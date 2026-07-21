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
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
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
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Validates token payloads against JWT signature policies.
    Guards routes and resolves the currently active authenticated User context.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None or token_data.type != "access":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception


    user_repo = UserRepository(db)
    try:
        user_id = uuid.UUID(token_data.sub)
    except (ValueError, AttributeError):
        raise credentials_exception
    user = await user_repo.get(user_id)
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return user
