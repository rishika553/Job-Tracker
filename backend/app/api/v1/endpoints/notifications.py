import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.notification import NotificationService

router = APIRouter()


@router.get("", response_model=List[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    type: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """List notifications for the logged in user with optional unread and type filters."""
    service = NotificationService(db)
    return await service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=type,
        skip=skip,
        limit=limit,
    )


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Mark all unread notifications as read."""
    service = NotificationService(db)
    count = await service.mark_all_read(user_id=current_user.id)
    return {"status": "success", "updated_count": count}


@router.put("/{id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Mark a specific notification as read."""
    service = NotificationService(db)
    success = await service.mark_read(notification_id=id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return {"status": "success", "message": "Notification marked as read."}


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Mark all unread notifications as read."""
    service = NotificationService(db)
    count = await service.mark_all_read(user_id=current_user.id)
    return {"status": "success", "updated_count": count}


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_notification(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Delete a notification."""
    service = NotificationService(db)
    success = await service.delete_notification(
        notification_id=id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return {"status": "success", "message": "Notification deleted."}
