import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.repositories.notification import NotificationRepository


class NotificationService:
    """Service handling business logic for user notifications across event lifecycle stages."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def get_user_notifications(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Notification]:
        """Fetch user notifications with unread and type filters."""
        return await self.repo.get_by_user(
            user_id=user_id,
            unread_only=unread_only,
            notification_type=notification_type,
            skip=skip,
            limit=limit,
        )

    async def create_notification(
        self, user_id: uuid.UUID, title: str, message: str, notification_type: str
    ) -> Notification:
        """Persist a new notification record."""
        return await self.repo.create(
            obj_in={
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "is_read": False,
            }
        )

    # --- 1. Interview Invitations ---
    async def notify_interview_invitation(
        self,
        user_id: uuid.UUID,
        company: str,
        role: str,
        interview_date: Optional[str] = None,
    ) -> Notification:
        """Generate notification for new interview invitations."""
        title = f"Interview Invitation - {company}"
        message = f"You received an interview invitation for {role} at {company}."
        if interview_date:
            message += f" Scheduled date: {interview_date}."
        return await self.create_notification(
            user_id, title, message, "interview_invitation"
        )

    # --- 2. Job Offers ---
    async def notify_offer(
        self,
        user_id: uuid.UUID,
        company: str,
        role: str,
        details: Optional[str] = None,
    ) -> Notification:
        """Generate notification for job offer extended."""
        title = f"Job Offer - {company}!"
        message = f"Congratulations! You received a job offer for {role} at {company}."
        if details:
            message += f" Details: {details}."
        return await self.create_notification(user_id, title, message, "offer")

    # --- 3. Rejections ---
    async def notify_rejection(
        self, user_id: uuid.UUID, company: str, role: str
    ) -> Notification:
        """Generate notification for application rejections."""
        title = f"Application Update - {company}"
        message = f"Your application for {role} at {company} was updated to rejected."
        return await self.create_notification(user_id, title, message, "rejection")

    # --- 4. Upcoming Interviews ---
    async def notify_upcoming_interview(
        self,
        user_id: uuid.UUID,
        company: str,
        role: str,
        scheduled_at: str,
    ) -> Optional[Notification]:
        """Generate reminder notification for upcoming interview."""
        title = f"Upcoming Interview Alert - {company}"
        existing = await self.repo.get_existing_notification(
            user_id, "upcoming_interview", title
        )
        if existing:
            return existing
        message = f"Reminder: You have an upcoming interview for {role} at {company} scheduled at {scheduled_at}."
        return await self.create_notification(
            user_id, title, message, "upcoming_interview"
        )

    # --- 5. Assessment Deadlines ---
    async def notify_assessment_deadline(
        self,
        user_id: uuid.UUID,
        company: str,
        role: str,
        deadline_at: str,
    ) -> Notification:
        """Generate notification for assessment test deadlines."""
        title = f"Assessment Deadline - {company}"
        message = f"Take-home assessment for {role} at {company} is due by {deadline_at}."
        return await self.create_notification(
            user_id, title, message, "assessment_deadline"
        )

    # --- 6. Follow-up Reminders ---
    async def notify_followup_reminder(
        self,
        user_id: uuid.UUID,
        company: str,
        role: str,
        days_idle: int = 14,
    ) -> Optional[Notification]:
        """Generate reminder to follow up on stagnant job applications."""
        title = f"Follow-up Reminder - {company}"
        existing = await self.repo.get_existing_notification(
            user_id, "followup_reminder", title
        )
        if existing:
            return existing
        message = f"It has been {days_idle} days since you applied for {role} at {company}. Consider sending a follow-up email."
        return await self.create_notification(
            user_id, title, message, "followup_reminder"
        )

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Mark a notification as read."""
        return await self.repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        """Mark all unread notifications as read for a user."""
        return await self.repo.mark_all_as_read(user_id)

    async def delete_notification(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a user notification."""
        return await self.repo.delete_user_notification(notification_id, user_id)
