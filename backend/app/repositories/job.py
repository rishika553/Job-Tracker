import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import JobApplication
from app.repositories.base import BaseRepository


class JobApplicationRepository(BaseRepository[JobApplication]):
    """Repository handling custom queries for JobApplication entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(JobApplication, db)

    async def get_multi_by_user(
        self,
        *,
        user_id: uuid.UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[JobApplication]:
        """Fetch list of job applications for a user with optional status filter."""
        query = select(JobApplication).where(JobApplication.user_id == user_id)
        if status:
            query = query.where(JobApplication.status == status)
        query = (
            query.order_by(JobApplication.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_status_distribution(self, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Group and count applications by status for a user."""
        query = (
            select(JobApplication.status, func.count(JobApplication.id))
            .where(JobApplication.user_id == user_id)
            .group_by(JobApplication.status)
        )
        result = await self.db.execute(query)
        return [{"status": row[0], "count": row[1]} for row in result.all()]

    async def get_platform_distribution(self, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Group and count applications by application source platform."""
        query = (
            select(JobApplication.source, func.count(JobApplication.id))
            .where(JobApplication.user_id == user_id)
            .group_by(JobApplication.source)
        )
        result = await self.db.execute(query)
        return [{"status": row[0] or "manual", "count": row[1]} for row in result.all()]

    async def get_total_count_by_user(self, user_id: uuid.UUID) -> int:
        """Count total applications for a specific user."""
        query = select(func.count(JobApplication.id)).where(
            JobApplication.user_id == user_id
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
