import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.token import TokenPayload
from app.schemas.user import UserCreate


class AuthService:
    """Orchestrates authentication logic, including standard credentials login, Refresh Tokens, and Google OAuth."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.refresh_token_repo = RefreshTokenRepository(db)

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Verify user credentials."""
        user = await self.user_repo.get_by_email(email)
        if not user or not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def register_user(self, user_in: UserCreate) -> User:
        """Register a new user account with hashed password."""
        hashed_password = (
            get_password_hash(user_in.password) if user_in.password else None
        )

        user_data = user_in.model_dump(exclude={"password"})
        user_data["hashed_password"] = hashed_password

        user = await self.user_repo.create(obj_in=user_data)
        return user

    async def verify_google_id_token(self, token_id: str) -> dict:
        """
        Validate Google ID token against Google tokeninfo endpoint.
        Returns extracted profile info (google_id, email, name).
        """
        # If in development and using a mock token, bypass verification
        if settings.ENV == "development" and token_id.startswith("mock-"):
            return {
                "google_id": f"g-{token_id[-10:]}",
                "email": f"google_user_{token_id[-5:]}@gmail.com",
                "name": "Google User"
            }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={token_id}",
                    timeout=5.0
                )
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to reach Google OAuth verification servers: {exc}"
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google OAuth token id signature"
                )

            data = response.json()

            # Verify target client ID audience
            if data.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google OAuth audience validation failed"
                )

            # Verify standard issuers
            if data.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google OAuth issuer validation failed"
                )

            return {
                "google_id": data.get("sub"),
                "email": data.get("email"),
                "name": data.get("name")
            }

    async def process_google_oauth(
        self, google_id: str, email: str, name: str
    ) -> User:
        """Process Google login: link to existing account or sign up a new user."""
        user = await self.user_repo.get_by_google_id(google_id)
        if user:
            return user

        # Check by email to prevent duplicate accounts and support account linking
        user = await self.user_repo.get_by_email(email)
        if user:
            user = await self.user_repo.update(
                db_obj=user, obj_in={"google_id": google_id}
            )
            return user

        # Create new user for first-time Google sign-ups
        user_in = UserCreate(email=email, full_name=name, google_id=google_id)
        user = await self.register_user(user_in)
        return user

    async def create_session(self, user_id: uuid.UUID) -> dict:
        """Generate access and refresh tokens, saving the refresh token record to database."""
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)

        # Expiry is set dynamically based on config settings
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.refresh_token_repo.create_hashed(
            user_id=user_id,
            raw_token=refresh_token,
            expires_at=expires_at,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def refresh_session(self, refresh_token_str: str) -> dict:
        """Validate refresh token and rotate it to generate new access and refresh token pair."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(
                refresh_token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_data = TokenPayload(**payload)
            if token_data.sub is None or token_data.type != "refresh":
                raise credentials_exception
        except jwt.PyJWTError:
            raise credentials_exception

        # Retrieve token including revoked tokens for reuse detection
        db_token = await self.refresh_token_repo.get_any_by_token(refresh_token_str)
        if not db_token:
            raise credentials_exception

        user_uuid = uuid.UUID(token_data.sub)

        # 🚨 Reuse Detection: if the token is already marked as revoked, it indicates
        # it was likely compromised and reused by an attacker. We immediately revoke all
        # active refresh tokens for this user!
        if db_token.is_revoked:
            await self.refresh_token_repo.revoke_all_for_user(user_uuid)
            await self.db.flush()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token reuse detected. All active sessions have been terminated for security.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Timezone safety check
        db_token_expires = db_token.expires_at
        if db_token_expires.tzinfo is None:
            db_token_expires = db_token_expires.replace(tzinfo=timezone.utc)

        if db_token_expires < datetime.now(timezone.utc):
            db_token.is_revoked = True
            await self.db.flush()
            raise credentials_exception

        # Invalidate old refresh token (Rotation)
        db_token.is_revoked = True
        await self.db.flush()

        # Issue new session
        return await self.create_session(user_uuid)

    async def revoke_session(self, refresh_token_str: str) -> None:
        """Revoke the active refresh token session."""
        db_token = await self.refresh_token_repo.get_any_by_token(refresh_token_str)
        if db_token and not db_token.is_revoked:
            db_token.is_revoked = True
            await self.db.flush()
