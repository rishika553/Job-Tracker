import logging
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

    def get_auth_url(self) -> str:
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
        """Fetch detailed information of a message and parse raw headers."""
        url = f"{self.base_url}/messages/{message_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        client = get_http_client()
        response = await client.get(url, headers=headers, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Failed to fetch Gmail message {message_id}: {response.text}")
            response.raise_for_status()
        data = response.json()

        parsed = {
            "id": data.get("id"),
            "snippet": data.get("snippet", ""),
            "subject": "",
            "sender": "",
            "date": "",
        }

        headers_list = data.get("payload", {}).get("headers", [])
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
        self, account_id: uuid.UUID, max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Fetch emails from Gmail account matching date constraint queries without analyzing them."""
        account = await self.gmail_repo.get(account_id)
        if not account or not account.is_active:
            raise ValueError("Gmail account not found or inactive.")

        # Ensure we have a valid non-expired access token
        access_token = await self.get_valid_access_token(account)

        # Query messages newer than 1 day (newer_than:1d)
        query = "newer_than:1d"
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
