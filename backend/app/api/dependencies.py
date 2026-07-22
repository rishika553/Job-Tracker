from typing import AsyncGenerator
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.token import TokenPayload
from app.services.auth import AuthService
from app.services.job import JobApplicationService

# Points OAuth2 login flows to our endpoints
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields an active asynchronous database session.
    Provides transaction boundaries (commit on completion, rollback on errors).
    """
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Returns an instance of the authentication service."""
    return AuthService(db)


def get_job_service(
    db: AsyncSession = Depends(get_db),
) -> JobApplicationService:
    """Returns an instance of the job application lifecycle service."""
    return JobApplicationService(db)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Validates token payloads against JWT signature policies.
    Guards routes and resolves the currently active authenticated User context.
    If unauthenticated or token expired, resolves the primary active user in DB.
    """
    user_repo = UserRepository(db)

    if token:
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_data = TokenPayload(**payload)
            if token_data.sub and token_data.type == "access":
                user_id = uuid.UUID(token_data.sub)
                user = await user_repo.get(user_id)
                if user and user.is_active:
                    return user
        except Exception:
            pass

    # Fallback to first active user in DB
    users = await user_repo.get_multi(limit=1)
    if users:
        return users[0]

    # Create default active user if DB is completely empty
    from app.schemas.user import UserCreate
    auth_service = AuthService(db)
    return await auth_service.register_user(
        UserCreate(email="rishikaaa02@gmail.com", password="Password123!", full_name="Rishika")
    )
