import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.models.interview import Interview
from app.models.job import JobApplication
from app.repositories.base import BaseRepository


class InterviewRepository(BaseRepository[Interview]):
    """Repository handling database operations for Interview entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(Interview, db)

    async def get_by_job_id(self, job_application_id: uuid.UUID) -> List[Interview]:
        """Fetch all interviews scheduled for a specific job application."""
        query = (
            select(Interview)
            .where(Interview.job_application_id == job_application_id)
            .order_by(Interview.scheduled_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_upcoming_by_user(
        self, user_id: uuid.UUID, limit: int = 5
    ) -> List[Interview]:
        """Fetch upcoming interviews for a specific user with eager loading to prevent N+1 queries."""
        now = datetime.now(timezone.utc)
        query = (
            select(Interview)
            .options(
                joinedload(Interview.job_application).joinedload(JobApplication.company)
            )
            .join(JobApplication, Interview.job_application_id == JobApplication.id)
            .where(
                JobApplication.user_id == user_id,
                Interview.scheduled_at >= now,
            )
            .order_by(Interview.scheduled_at.asc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_events_by_date_range(
        self, user_id: uuid.UUID, start_date: datetime, end_date: datetime
    ) -> List[Interview]:
        """Fetch scheduled interviews within a date range with eager loading to prevent N+1 queries."""
        query = (
            select(Interview)
            .options(
                joinedload(Interview.job_application).joinedload(JobApplication.company)
            )
            .join(JobApplication, Interview.job_application_id == JobApplication.id)
            .where(
                JobApplication.user_id == user_id,
                Interview.scheduled_at >= start_date,
                Interview.scheduled_at <= end_date,
            )
            .order_by(Interview.scheduled_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
