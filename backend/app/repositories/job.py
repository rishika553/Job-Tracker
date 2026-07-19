import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import JobApplication
from app.repositories.base import BaseRepository


class JobApplicationRepository(BaseRepository[JobApplication]):
    """Repository handling custom queries for JobApplication entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(JobApplication, db)

    async def get_multi_by_user(
        self, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[JobApplication]:
        """Fetch list of job applications for a specific user with pagination."""
        query = (
            select(JobApplication)
            .where(JobApplication.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
