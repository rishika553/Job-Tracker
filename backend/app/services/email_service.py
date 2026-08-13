import os
import sys
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseEmailProvider(ABC):
    """Abstract Base Class for email providers (SOLID - Dependency Inversion Principle)."""

    @abstractmethod
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an HTML email to the specified recipient."""
        pass


class ResendEmailProvider(BaseEmailProvider):
    """Email provider implementation for Resend (https://resend.com)."""

    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email or "noreply@aijobtracker.com"
        self.api_url = "https://api.resend.com/emails"

    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        if not self.api_key:
            logger.warning("RESEND_API_KEY is not configured. Falling back to console logging.")
            return False

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        # Attempt sending with 1 retry on failure (Requirements #8)
        max_attempts = 2
        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(self.api_url, json=payload, headers=headers)
                    if response.status_code in [200, 201, 202]:
                        logger.info(f"Resend API: Welcome email sent successfully to {to_email}")
                        return True
                    else:
                        logger.warning(
                            f"Resend API attempt {attempt} failed (status {response.status_code}): {response.text}"
                        )
            except Exception as exc:
                logger.warning(f"Resend API attempt {attempt} error: {exc}")

            if attempt < max_attempts:
                await asyncio.sleep(1.0)

        return False

class ConsoleEmailProvider(BaseEmailProvider):
    """Fallback provider for local development that logs email output without sending external requests."""

    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        logger.info(f"[CONSOLE EMAIL PROVIDER] Sending email to {to_email} | Subject: '{subject}'")
        return True


class EmailService:
    """Service layer orchestrating HTML template rendering and email dispatching."""

    def __init__(self, provider: Optional[BaseEmailProvider] = None):
        if provider:
            self.provider = provider
        elif settings.EMAIL_PROVIDER.lower() == "resend" and settings.RESEND_API_KEY:
            self.provider = ResendEmailProvider(
                api_key=settings.RESEND_API_KEY,
                from_email=settings.FROM_EMAIL
            )
        else:
            self.provider = ConsoleEmailProvider()

    def _get_template_path(self, template_name: str) -> str:
        """Find template path across possible template directories."""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        possible_paths = [
            os.path.join(base_dir, "app", "templates", template_name),
            os.path.join(base_dir, "templates", template_name),
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
        raise FileNotFoundError(f"Email template '{template_name}' not found.")

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Load template file and substitute string placeholders {{key}}."""
        template_path = self._get_template_path(template_name)
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()

        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value))

        return content

    async def send_welcome_email(self, to_email: str, full_name: Optional[str] = None) -> bool:
        """
        Send welcome email immediately after successful signup.
        Non-blocking & exception-safe (will not crash account creation on failure).
        """
        try:
            display_name = full_name.strip() if full_name and full_name.strip() else to_email.split("@")[0]
            context = {
                "name": display_name,
                "dashboard_url": f"{settings.APP_URL}/",
                "year": datetime.now().year,
            }

            subject = "🎉 Welcome to AI Job Tracker!"
            html_content = self.render_template("welcome_email.html", context)

            success = await self.provider.send_email(to_email, subject, html_content)
            if success:
                logger.info(f"Welcome email sent successfully to {to_email}")
            else:
                logger.error(f"Email sending failed for {to_email}: Provider returned unsuccessful response")
            return success

        except Exception as exc:
            # Requirements #1 & #8: Log the error but NEVER crash or block account creation
            logger.error(f"Email sending failed for {to_email}: {exc}", exc_info=True)
            return False


# Singleton instance helper
def get_email_service() -> EmailService:
    return EmailService()

