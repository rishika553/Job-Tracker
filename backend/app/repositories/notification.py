import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository handling database operations for Notification entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Notification]:
        """Fetch notifications for a user with optional unread and type filters."""
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        if notification_type:
            query = query.where(Notification.type == notification_type)

        query = (
            query.order_by(Notification.is_read.asc(), Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_existing_notification(
        self, user_id: uuid.UUID, notification_type: str, title: str
    ) -> Optional[Notification]:
        """Check if a notification with matching type and title exists for a user."""
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.title == title,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        """Count unread notifications for a specific user."""
        query = (
            select(func.count(Notification.id))
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Mark a specific notification as read."""
        now = datetime.now(timezone.utc)
        query = (
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .values(is_read=True, read_at=now)
        )
        result = await self.db.execute(query)
        await self.db.flush()
        return result.rowcount > 0

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        """Mark all unread notifications as read for a specific user."""
        now = datetime.now(timezone.utc)
        query = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True, read_at=now)
        )
        result = await self.db.execute(query)
        await self.db.flush()
        return result.rowcount

    async def delete_user_notification(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a notification belonging to a specific user."""
        query = delete(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        result = await self.db.execute(query)
        await self.db.flush()
        return result.rowcount > 0
