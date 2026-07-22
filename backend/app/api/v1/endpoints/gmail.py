import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.gmail import GmailService, GoogleAuthClient
from app.repositories.connected_gmail import ConnectedGmailRepository

router = APIRouter()


@router.get("/connect", response_model=str)
async def get_connect_url(
    current_user: User = Depends(get_current_user)
) -> str:
    """Generate the Google OAuth consent url to initiate Gmail connection."""
    import jwt
    from app.core.config import settings
    state_token = jwt.encode(
        {"user_id": str(current_user.id)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    auth_client = GoogleAuthClient()
    return auth_client.get_auth_url(state=state_token)


@router.get("/callback", status_code=status.HTTP_200_OK)
async def oauth_callback(
    code: str,
    state: str,
    db=Depends(get_db),
) -> Any:
    """Callback receiver. Exchanges authorization code and links Gmail credentials."""
    import jwt
    from app.core.config import settings
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = uuid.UUID(payload["user_id"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or expired state parameter: {exc}",
        )

    service = GmailService(db)
    try:
        account = await service.connect_account(user_id=user_id, code=code)
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="http://localhost:5173/settings?gmail=connected")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google OAuth exchange failed: {exc}",
        )


@router.get("/accounts")
async def list_connected_accounts(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """List all connected Gmail accounts linked to the active user."""
    repo = ConnectedGmailRepository(db)
    accounts = await repo.get_by_user_id(current_user.id)
    return [
        {
            "id": acc.id,
            "email": acc.email,
            "is_active": acc.is_active,
            "created_at": acc.created_at,
        }
        for acc in accounts
    ]


@router.get("/accounts/{account_id}/emails")
async def fetch_recent_emails(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Retrieve recent messages (newer than 1 day) from the selected Gmail inbox."""
    repo = ConnectedGmailRepository(db)
    account = await repo.get(account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected Gmail account credentials not found.",
        )

    service = GmailService(db)
    try:
        from app.jobs.tasks import sync_account_gmail_emails
        await sync_account_gmail_emails(db, account)
        await db.commit()

        emails = await service.fetch_recent_emails(account_id=account.id)
        return {
            "account_email": account.email,
            "count": len(emails),
            "emails": emails,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google API execution failed: {exc}",
        )


@router.get("/accounts/{account_id}/emails/ids")
async def fetch_recent_email_ids(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Retrieve only the IDs of recent messages (newer than 1 day) from the selected Gmail inbox."""
    repo = ConnectedGmailRepository(db)
    account = await repo.get(account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected Gmail account credentials not found.",
        )

    service = GmailService(db)
    try:
        email_ids = await service.fetch_recent_email_ids(account_id=account.id)
        return {
            "account_email": account.email,
            "count": len(email_ids),
            "email_ids": email_ids,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google API execution failed: {exc}",
        )


@router.get("/accounts/{account_id}/emails/{message_id}")
async def fetch_email_details(
    account_id: uuid.UUID,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Retrieve full details of a specific email message from the selected Gmail inbox."""
    repo = ConnectedGmailRepository(db)
    account = await repo.get(account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected Gmail account credentials not found.",
        )

    service = GmailService(db)
    try:
        details = await service.fetch_email_details(account_id=account.id, message_id=message_id)
        return details
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google API execution failed: {exc}",
        )


@router.post("/accounts/{account_id}/refresh")
async def refresh_expired_token(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Refresh the access token for the selected Gmail account if expired and return it."""
    repo = ConnectedGmailRepository(db)
    account = await repo.get(account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected Gmail account credentials not found.",
        )

    service = GmailService(db)
    try:
        access_token = await service.refresh_expired_token(account_id=account.id)
        return {
            "status": "success",
            "message": "Token refreshed successfully",
            "access_token": access_token
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Token refresh failed: {exc}",
        )

