import uuid
from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.interview import Interview
from app.repositories.interview import InterviewRepository
from app.schemas.calendar import CalendarEventOut, InterviewCreate


class CalendarService:
    """Service handling business logic for calendar events and interviews."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.interview_repo = InterviewRepository(db)

    async def schedule_interview(self, obj_in: InterviewCreate) -> Interview:
        """Schedule a new interview for a job application."""
        return await self.interview_repo.create(obj_in.model_dump())

    async def get_user_events(
        self, user_id: uuid.UUID, start_date: datetime, end_date: datetime
    ) -> List[CalendarEventOut]:
        """Fetch scheduled calendar events within a date range."""
        interviews = await self.interview_repo.get_events_by_date_range(
            user_id, start_date, end_date
        )
        events = []
        for i in interviews:
            company_name = (
                i.job_application.company.name
                if i.job_application and i.job_application.company
                else None
            )
            job_title = i.job_application.title if i.job_application else None
            events.append(
                CalendarEventOut(
                    id=i.id,
                    event_type="interview",
                    title=i.title,
                    scheduled_at=i.scheduled_at,
                    company=company_name,
                    job_title=job_title,
                    details=f"Type: {i.type}. Location: {i.location_url or 'N/A'}",
                )
            )
        return events
