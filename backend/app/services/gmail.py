import logging
import base64
import re
import html
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Protocol
import httpx
from urllib.parse import urlencode
import uuid

from app.core.config import settings
from app.core.http_client import get_http_client
from app.core.security import encrypt_token, decrypt_token
from app.models.connected_gmail import ConnectedGmailAccount
from app.repositories.connected_gmail import ConnectedGmailRepository

logger = logging.getLogger(__name__)


class BaseOAuthClient(Protocol):
    """Protocol defining the interface for OAuth credential flows."""
    async def exchange_code(self, code: str) -> Dict[str, Any]: ...
    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]: ...
    async def fetch_user_email(self, access_token: str) -> str: ...


class BaseEmailClient(Protocol):
    """Protocol defining the interface for listing and reading messages."""
    async def list_recent_messages(
        self, access_token: str, q: Optional[str] = None, max_results: int = 10
    ) -> List[Dict[str, Any]]: ...
    async def get_message(self, access_token: str, message_id: str) -> Dict[str, Any]: ...


class GoogleAuthClient(BaseOAuthClient):
    """HTTP client handling Google OAuth code exchange and token rotation."""

    def __init__(self):
        self.token_url = "https://oauth2.googleapis.com/token"

    def get_auth_url(self, state: Optional[str] = None) -> str:
        """Generate Google consent screen URL with required offline access scopes."""
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": (
                "https://www.googleapis.com/auth/gmail.readonly "
                "https://www.googleapis.com/auth/userinfo.email"
            ),
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        return f"{base_url}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange redirect authorization code for access and refresh tokens."""
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        client = get_http_client()
        response = await client.post(self.token_url, data=data, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Failed to exchange Gmail auth code: {response.text}")
            response.raise_for_status()
        return response.json()

    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Request new access token from Google using the stored refresh token."""
        data = {
            "refresh_token": refresh_token,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "grant_type": "refresh_token",
        }
        client = get_http_client()
        response = await client.post(self.token_url, data=data, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Failed to refresh Gmail tokens: {response.text}")
            response.raise_for_status()
        return response.json()

    async def fetch_user_email(self, access_token: str) -> str:
        """Fetch the email address associated with the given Google access token."""
        url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        client = get_http_client()
        response = await client.get(url, headers=headers, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Failed to fetch Gmail userinfo email: {response.text}")
            response.raise_for_status()
        return response.json().get("email")


class GmailClient(BaseEmailClient):
    """HTTP client querying raw Gmail API endpoints."""

    def __init__(self):
        self.base_url = "https://gmail.googleapis.com/gmail/v1/users/me"

    async def list_recent_messages(
        self, access_token: str, q: Optional[str] = None, max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """List messages matching timeframe queries (e.g. newer_than:1d)."""
        url = f"{self.base_url}/messages"
        headers = {"Authorization": f"Bearer {access_token}"}
        params: Dict[str, Any] = {"maxResults": max_results}
        if q:
            params["q"] = q

        client = get_http_client()
        response = await client.get(
            url, headers=headers, params=params, timeout=5.0
        )
        if response.status_code != 200:
            logger.error(f"Failed to list Gmail messages: {response.text}")
            response.raise_for_status()
        return response.json().get("messages", [])

    async def get_message(self, access_token: str, message_id: str) -> Dict[str, Any]:
        """Fetch detailed information of a message and parse raw headers and full body content."""
        url = f"{self.base_url}/messages/{message_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        client = get_http_client()
        response = await client.get(url, headers=headers, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Failed to fetch Gmail message {message_id}: {response.text}")
            response.raise_for_status()
        data = response.json()

        def clean_html_markup(raw_content: str) -> str:
            if not raw_content or not isinstance(raw_content, str):
                return ""
            if "<" not in raw_content or ">" not in raw_content:
                return html.unescape(raw_content).strip()

            text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', raw_content, flags=re.IGNORECASE)
            text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text, flags=re.IGNORECASE)
            text = re.sub(r'<head[^>]*>[\s\S]*?</head>', '', text, flags=re.IGNORECASE)
            text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', r'\2 (\1)', text, flags=re.IGNORECASE | re.DOTALL)
            text = re.sub(r'</?(p|div|tr|h1|h2|h3|h4|h5|h6|li|blockquote)[^>]*>', '\n', text, flags=re.IGNORECASE)
            text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = html.unescape(text)
            lines = [line.strip() for line in text.splitlines()]
            return "\n\n".join([line for line in lines if line])

        def extract_body(payload: dict) -> str:
            if not payload:
                return ""
            body_data = payload.get("body", {}).get("data")
            if body_data:
                try:
                    padded = body_data.replace("-", "+").replace("_", "/")
                    padded += "=" * ((4 - len(padded) % 4) % 4)
                    raw_decoded = base64.b64decode(padded).decode("utf-8", errors="ignore")
                    if "<" in raw_decoded and ">" in raw_decoded:
                        return clean_html_markup(raw_decoded)
                    return raw_decoded
                except Exception:
                    pass
            parts = payload.get("parts", [])
            text_plain = ""
            text_html = ""
            for part in parts:
                mime_type = part.get("mimeType", "")
                part_data = part.get("body", {}).get("data")
                if part_data:
                    try:
                        padded = part_data.replace("-", "+").replace("_", "/")
                        padded += "=" * ((4 - len(padded) % 4) % 4)
                        decoded = base64.b64decode(padded).decode("utf-8", errors="ignore")
                        if mime_type == "text/plain":
                            text_plain = decoded
                        elif mime_type == "text/html" and not text_plain:
                            text_html = clean_html_markup(decoded)
                    except Exception:
                        pass
                if part.get("parts"):
                    nested = extract_body(part)
                    if nested:
                        return nested
            return text_plain or text_html or ""

        payload = data.get("payload", {})
        raw_extracted = extract_body(payload) or data.get("snippet", "")
        body_content = clean_html_markup(raw_extracted)

        parsed = {
            "id": data.get("id"),
            "snippet": data.get("snippet", ""),
            "body": body_content,
            "subject": "",
            "sender": "",
            "date": "",
        }

        headers_list = payload.get("headers", [])
        for h in headers_list:
            name = h.get("name", "").lower()
            value = h.get("value", "")
            if name == "subject":
                parsed["subject"] = value
            elif name == "from":
                parsed["sender"] = value
            elif name == "date":
                parsed["date"] = value

        return parsed


class GmailService:
    """Orchestrates Gmail account registration, token refreshes, and email fetches."""

    def __init__(
        self,
        db: AsyncSession,
        oauth_client: Optional[BaseOAuthClient] = None,
        email_client: Optional[BaseEmailClient] = None,
    ):
        self.db = db
        self.gmail_repo = ConnectedGmailRepository(db)
        self.oauth_client = oauth_client or GoogleAuthClient()
        self.email_client = email_client or GmailClient()

    async def connect_account(
        self, user_id: uuid.UUID, code: str
    ) -> ConnectedGmailAccount:
        """Process redirect callback, exchange code, fetch email, and save tokens."""
        # 1. Exchange OAuth code for access and refresh tokens
        token_data = await self.oauth_client.exchange_code(code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        scopes = token_data.get("scope")

        # Expiry is set to local datetime object
        token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        # 2. Query user email to link credentials to database record
        email = await self.oauth_client.fetch_user_email(access_token)

        # 3. Save or update record in database (Encrypt tokens at rest)
        existing_account = await self.gmail_repo.get_by_email(email)
        if existing_account:
            update_data = {
                "access_token": encrypt_token(access_token),
                "token_expiry": token_expiry,
                "is_active": True,
            }
            if refresh_token:
                update_data["refresh_token"] = encrypt_token(refresh_token)
            return await self.gmail_repo.update(
                db_obj=existing_account, obj_in=update_data
            )

        new_account = await self.gmail_repo.create(
            obj_in={
                "user_id": user_id,
                "email": email,
                "access_token": encrypt_token(access_token),
                "refresh_token": encrypt_token(refresh_token),
                "token_expiry": token_expiry,
                "scopes": scopes,
                "is_active": True,
            }
        )
        return new_account

    async def get_valid_access_token(self, account: ConnectedGmailAccount) -> str:
        """Ensure token is valid, refreshing it if expired or expiring within 60 seconds."""
        expiry = account.token_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        raw_refresh_token = decrypt_token(account.refresh_token)
        raw_access_token = decrypt_token(account.access_token)

        # If expired or expiring within 60 seconds, trigger refresh rotation
        if expiry - timedelta(seconds=60) < datetime.now(timezone.utc):
            if not raw_refresh_token:
                raise ValueError("No refresh token stored to rotate expired session.")

            refresh_data = await self.oauth_client.refresh_tokens(
                raw_refresh_token
            )
            new_access_token = refresh_data.get("access_token")
            expires_in = refresh_data.get("expires_in", 3600)
            new_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            await self.gmail_repo.update(
                db_obj=account,
                obj_in={
                    "access_token": encrypt_token(new_access_token),
                    "token_expiry": new_expiry,
                },
            )
            return new_access_token

        return raw_access_token

    async def fetch_recent_emails(
        self, account_id: uuid.UUID, max_results: int = 25, query: str = "newer_than:30d"
    ) -> List[Dict[str, Any]]:
        """Fetch emails from Gmail account matching date constraint queries without analyzing them."""
        account = await self.gmail_repo.get(account_id)
        if not account or not account.is_active:
            raise ValueError("Gmail account not found or inactive.")

        # Ensure we have a valid non-expired access token
        access_token = await self.get_valid_access_token(account)

        messages = await self.email_client.list_recent_messages(
            access_token=access_token, q=query, max_results=max_results
        )

        detailed_messages = []
        for msg in messages:
            msg_details = await self.email_client.get_message(
                access_token, msg["id"]
            )
            detailed_messages.append(msg_details)

        return detailed_messages

    async def fetch_recent_email_ids(
        self, account_id: uuid.UUID, max_results: int = 25, query: str = "newer_than:30d"
    ) -> List[str]:
        """Fetch recent message IDs matching the timeframe query."""
        account = await self.gmail_repo.get(account_id)
        if not account or not account.is_active:
            raise ValueError("Gmail account not found or inactive.")

        access_token = await self.get_valid_access_token(account)
        messages = await self.email_client.list_recent_messages(
            access_token=access_token, q=query, max_results=max_results
        )
        return [msg["id"] for msg in messages if "id" in msg]

    async def fetch_email_details(
        self, account_id: uuid.UUID, message_id: str
    ) -> Dict[str, Any]:
        """Fetch detailed information of a single message by its ID."""
        account = await self.gmail_repo.get(account_id)
        if not account or not account.is_active:
            raise ValueError("Gmail account not found or inactive.")

        access_token = await self.get_valid_access_token(account)
        return await self.email_client.get_message(access_token, message_id)

    async def refresh_expired_token(self, account_id: uuid.UUID) -> str:
        """Explicitly refresh the access token if expired, update in DB, and return it."""
        account = await self.gmail_repo.get(account_id)
        if not account or not account.is_active:
            raise ValueError("Gmail account not found or inactive.")

        return await self.get_valid_access_token(account)

