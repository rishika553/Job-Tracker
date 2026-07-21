import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.job import (
    JobApplicationCreate,
    JobApplicationOut,
    JobApplicationUpdate,
)
from app.services.job import JobApplicationService

router = APIRouter()


@router.get("", response_model=List[JobApplicationOut])
async def list_applications(
    status: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """List job applications for active user with optional status filter."""
    service = JobApplicationService(db)
    return await service.get_user_applications(
        user_id=current_user.id, status=status, skip=skip, limit=limit
    )


@router.post("", response_model=JobApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    job_in: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Create a new job application."""
    service = JobApplicationService(db)
    return await service.create_application(user_id=current_user.id, job_in=job_in)


@router.get("/{id}", response_model=JobApplicationOut)
async def get_application(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Get job application details by ID."""
    service = JobApplicationService(db)
    app_obj = await service.get_by_id(id)
    if not app_obj or app_obj.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found.",
        )
    return app_obj


@router.put("/{id}", response_model=JobApplicationOut)
async def update_application(
    id: uuid.UUID,
    job_in: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Update job application status or details."""
    service = JobApplicationService(db)
    app_obj = await service.get_by_id(id)
    if not app_obj or app_obj.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found.",
        )
    return await service.update_application(job_id=id, job_in=job_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> None:
    """Delete a job application."""
    service = JobApplicationService(db)
    app_obj = await service.get_by_id(id)
    if not app_obj or app_obj.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found.",
        )
    await service.delete_application(id)
