import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_current_user, get_job_service
from app.models.user import User
from app.schemas.job import (
    JobApplicationCreate,
    JobApplicationOut,
    JobApplicationUpdate,
)
from app.services.job import JobApplicationService

router = APIRouter()


@router.get("/", response_model=List[JobApplicationOut])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    job_service: JobApplicationService = Depends(get_job_service),
) -> Any:
    """List job applications for the authenticated user."""
    return await job_service.get_user_applications(
        user_id=current_user.id, skip=skip, limit=limit
    )


@router.post(
    "/", response_model=JobApplicationOut, status_code=status.HTTP_201_CREATED
)
async def create_job(
    job_in: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    job_service: JobApplicationService = Depends(get_job_service),
) -> Any:
    """Create a new manually entered job application."""
    return await job_service.create_application(
        user_id=current_user.id, job_in=job_in
    )


@router.get("/{job_id}", response_model=JobApplicationOut)
async def get_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    job_service: JobApplicationService = Depends(get_job_service),
) -> Any:
    """Retrieve details of a single job application."""
    job = await job_service.get_by_id(job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )
    return job


@router.put("/{job_id}", response_model=JobApplicationOut)
async def update_job(
    job_id: uuid.UUID,
    job_in: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    job_service: JobApplicationService = Depends(get_job_service),
) -> Any:
    """Update attributes of a job application."""
    job = await job_service.get_by_id(job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )
    return await job_service.update_application(job_id, job_in)


@router.delete("/{job_id}", response_model=JobApplicationOut)
async def delete_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    job_service: JobApplicationService = Depends(get_job_service),
) -> Any:
    """Delete a job application."""
    job = await job_service.get_by_id(job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )
    return await job_service.delete_application(job_id)
