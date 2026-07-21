import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import JobApplication
from app.repositories.job import JobApplicationRepository
from app.schemas.job import JobApplicationCreate, JobApplicationUpdate


class JobApplicationService:
    """Service layer managing the lifecycle of Job Applications."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.job_repo = JobApplicationRepository(db)

    async def get_by_id(self, job_id: uuid.UUID) -> Optional[JobApplication]:
        """Fetch a specific job application by ID."""
        return await self.job_repo.get(job_id)

    async def get_user_applications(
        self,
        user_id: uuid.UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[JobApplication]:
        """Retrieve all job applications associated with a specific user."""
        return await self.job_repo.get_multi_by_user(
            user_id=user_id, status=status, skip=skip, limit=limit
        )

    async def create_application(
        self, user_id: uuid.UUID, job_in: JobApplicationCreate
    ) -> JobApplication:
        """Create a new job application entry linked to a user."""
        job_data = job_in.model_dump()
        job_data["user_id"] = user_id
        return await self.job_repo.create(obj_in=job_data)

    async def update_application(
        self, job_id: uuid.UUID, job_in: JobApplicationUpdate
    ) -> Optional[JobApplication]:
        """Update an existing job application entry."""
        job = await self.job_repo.get(job_id)
        if not job:
            return None
        return await self.job_repo.update(db_obj=job, obj_in=job_in)

    async def delete_application(
        self, job_id: uuid.UUID
    ) -> Optional[JobApplication]:
        """Remove a job application entry."""
        return await self.job_repo.remove(id=job_id)
        
    async def process_scanned_job(self, user_id: uuid.UUID, details: dict) -> JobApplication:
        """
        Placeholder logic showing how services orchestrate raw updates
        from background scans (Gmail processing / AI details extraction).
        """
        # Under scale-out, standard checks & transaction boundaries go here
        job_in = JobApplicationCreate(
            company=details.get("company", "Unknown Company"),
            title=details.get("title", "Job Opportunity"),
            applied_at=details.get("applied_at"),
            job_description=details.get("job_description"),
            source="gmail"
        )
        return await self.create_application(user_id=user_id, job_in=job_in)
