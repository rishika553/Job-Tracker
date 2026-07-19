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
    auth_client = GoogleAuthClient()
    return auth_client.get_auth_url()


@router.get("/callback", status_code=status.HTTP_200_OK)
async def oauth_callback(
    code: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Callback receiver. Exchanges authorization code and links Gmail credentials."""
    service = GmailService(db)
    try:
        account = await service.connect_account(user_id=current_user.id, code=code)
        return {
            "status": "success",
            "message": "Gmail account successfully linked",
            "email": account.email,
        }
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
