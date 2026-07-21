import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.interview import InterviewRepository
from app.repositories.job import JobApplicationRepository
from app.repositories.notification import NotificationRepository
from app.schemas.calendar import CalendarEventOut
from app.schemas.dashboard import DashboardMetrics, DashboardSummaryOut
from app.schemas.job import JobApplicationOut


class DashboardService:
    """Service aggregating high-level dashboard metrics and user summaries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.job_repo = JobApplicationRepository(db)
        self.interview_repo = InterviewRepository(db)
        self.notification_repo = NotificationRepository(db)

    async def get_dashboard_summary(self, user_id: uuid.UUID) -> DashboardSummaryOut:
        """Fetch and aggregate metrics, recent applications, and upcoming events."""
        total_apps = await self.job_repo.get_total_count_by_user(user_id)
        status_dist = await self.job_repo.get_status_distribution(user_id)

        active_apps = sum(
            item["count"]
            for item in status_dist
            if item["status"] in ("applied", "interviewing", "interview")
        )
        offers = sum(
            item["count"] for item in status_dist if item["status"] == "offered"
        )
        rejections = sum(
            item["count"] for item in status_dist if item["status"] == "rejected"
        )
        interviews_count = sum(
            item["count"]
            for item in status_dist
            if item["status"] in ("interviewing", "interview")
        )

        response_rate = (
            round(((interviews_count + offers + rejections) / total_apps) * 100, 2)
            if total_apps > 0
            else 0.0
        )

        metrics = DashboardMetrics(
            total_applications=total_apps,
            active_applications=active_apps,
            interviews_scheduled=interviews_count,
            offers_received=offers,
            rejections_received=rejections,
            response_rate_percentage=response_rate,
        )

        # Fetch recent applications
        recent_apps_entities = await self.job_repo.get_multi_by_user(
            user_id=user_id, limit=5
        )
        recent_applications = [
            JobApplicationOut.model_validate(app) for app in recent_apps_entities
        ]

        # Fetch upcoming interviews
        upcoming_interviews = await self.interview_repo.get_upcoming_by_user(
            user_id=user_id, limit=5
        )
        upcoming_events = [
            CalendarEventOut(
                id=item.id,
                event_type="interview",
                title=item.title,
                scheduled_at=item.scheduled_at,
                company=(
                    item.job_application.company.name
                    if item.job_application and item.job_application.company
                    else None
                ),
                job_title=item.job_application.title if item.job_application else None,
                details=f"Type: {item.type}. Location: {item.location_url or 'N/A'}",
            )
            for item in upcoming_interviews
        ]

        # Count unread notifications
        unread_notifications = await self.notification_repo.get_unread_count(user_id)

        return DashboardSummaryOut(
            metrics=metrics,
            recent_applications=recent_applications,
            upcoming_events=upcoming_events,
            unread_notifications_count=unread_notifications,
        )
