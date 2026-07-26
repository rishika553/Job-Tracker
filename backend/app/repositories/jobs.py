import json
import uuid
from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_job import SavedJob
from app.models.recent_search import RecentSearch
from app.schemas.job import NormalizedJob


class JobSearchRepository:
    """Repository handling database interactions for saved jobs and recent search logs."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_job(self, user_id: uuid.UUID, job: NormalizedJob) -> SavedJob:
        """Save a job listing to saved_jobs for the user."""
        # Check if already saved
        query = select(SavedJob).where(SavedJob.user_id == user_id, SavedJob.job_id == job.id)
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        saved_job = SavedJob(
            user_id=user_id,
            job_id=job.id,
            job_data=json.dumps(job.model_dump()),
        )
        self.db.add(saved_job)
        await self.db.commit()
        await self.db.refresh(saved_job)
        return saved_job

    async def delete_saved_job(self, user_id: uuid.UUID, job_id: str) -> bool:
        """Unsave/remove a job listing for the user."""
        stmt = delete(SavedJob).where(SavedJob.user_id == user_id, SavedJob.job_id == job_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def get_saved_jobs(self, user_id: uuid.UUID) -> List[SavedJob]:
        """Fetch all saved jobs for a specific user."""
        query = (
            select(SavedJob)
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.saved_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_recent_search(self, user_id: uuid.UUID, query_text: str, location: str = "") -> RecentSearch:
        """Log a recent search query for the user (deduplicating recent duplicates)."""
        if not query_text.strip():
            return None

        # Check if identical query already exists for user
        query = select(RecentSearch).where(
            RecentSearch.user_id == user_id,
            RecentSearch.query == query_text.strip(),
            RecentSearch.location == (location or "").strip(),
        )
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        recent = RecentSearch(
            user_id=user_id,
            query=query_text.strip(),
            location=(location or "").strip(),
        )
        self.db.add(recent)
        await self.db.commit()
        await self.db.refresh(recent)
        return recent

    async def get_recent_searches(self, user_id: uuid.UUID, limit: int = 5) -> List[RecentSearch]:
        """Fetch the most recent search history logs for the user."""
        query = (
            select(RecentSearch)
            .where(RecentSearch.user_id == user_id)
            .order_by(RecentSearch.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
