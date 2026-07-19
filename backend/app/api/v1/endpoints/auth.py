from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.token import Token, TokenRefreshRequest
from app.schemas.user import UserCreate, UserOut
from app.services.auth import AuthService
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Register a new user account."""
    user = await auth_service.user_repo.get_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    return await auth_service.register_user(user_in)


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Standard credentials login flow. Returns access token in body, refresh token in cookie."""
    user = await auth_service.authenticate(
        form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    
    session = await auth_service.create_session(user.id)

    # Set the refresh token as a secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=session["refresh_token"],
        httponly=True,
        secure=settings.ENV != "development",  # Secure cookie in staging/production
        samesite="lax",
        path=f"{settings.API_V1_STR}/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return session


@router.post("/google", response_model=Token)
async def google_auth(
    response: Response,
    body: TokenRefreshRequest,  # Google ID token credential in body
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """
    Authenticate user via Google OAuth ID token (credential).
    Validates token payloads against Google auth servers and coordinates accounts.
    """
    profile = await auth_service.verify_google_id_token(body.refresh_token)

    user = await auth_service.process_google_oauth(
        google_id=profile["google_id"],
        email=profile["email"],
        name=profile["name"],
    )

    session = await auth_service.create_session(user.id)

    # Set the refresh token as a secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=session["refresh_token"],
        httponly=True,
        secure=settings.ENV != "development",
        samesite="lax",
        path=f"{settings.API_V1_STR}/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return session


@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    request: Request,
    body: Optional[TokenRefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(default=None, alias="refresh_token"),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Rotate the session: validate the refresh token and return a new access/refresh pair."""
    token = refresh_token_cookie
    if not token and body:
        token = body.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is missing. Please log in.",
        )

    session = await auth_service.refresh_session(token)

    # Set the rotated refresh token as a secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=session["refresh_token"],
        httponly=True,
        secure=settings.ENV != "development",
        samesite="lax",
        path=f"{settings.API_V1_STR}/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return session


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    request: Request,
    body: Optional[TokenRefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(default=None, alias="refresh_token"),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Logout flow: revoke the active refresh token session so it cannot be used again."""
    token = refresh_token_cookie
    if not token and body:
        token = body.refresh_token

    if token:
        await auth_service.revoke_session(token)

    # Clear the HttpOnly cookie by setting an expired date
    response.delete_cookie(
        key="refresh_token",
        path=f"{settings.API_V1_STR}/auth",
    )
    return {"status": "success", "detail": "Session successfully logged out"}


@router.get("/me", response_model=UserOut)
async def read_current_user(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get profile information of the currently authenticated user."""
    return current_user
