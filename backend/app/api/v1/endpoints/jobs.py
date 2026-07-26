import json
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.repositories.jobs import JobSearchRepository
from app.schemas.job import (
    NormalizedJob,
    RecentSearchResponse,
    SavedJobCreate,
    SavedJobResponse,
)
from app.services.job_search import JobSearchService

router = APIRouter()


@router.get("/search", response_model=List[NormalizedJob])
async def search_jobs(
    query: str = Query(default="Software Engineer", description="Job title or search keyword"),
    location: Optional[str] = Query(default="", description="Location filter"),
    experience: Optional[str] = Query(default="", description="Experience level filter"),
    employment_type: Optional[str] = Query(default="", description="Employment type filter"),
    salary: Optional[str] = Query(default="", description="Salary range filter"),
    page: int = Query(default=1, ge=1, description="Page number"),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """
    Search job listings from JSearch API provider with strict deduplication and normalization.
    Logs search query to user's recent searches history.
    """
    repo = JobSearchRepository(db)
    service = JobSearchService()

    # Log search history for user
    if query:
        await repo.add_recent_search(current_user.id, query, location or "")

    results = await service.search_jobs(
        query=query,
        location=location,
        experience=experience,
        employment_type=employment_type,
        page=page,
    )
    return results


@router.get("/recent-searches", response_model=List[RecentSearchResponse])
async def get_recent_searches(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Fetch recent search history log for the active user."""
    repo = JobSearchRepository(db)
    searches = await repo.get_recent_searches(current_user.id, limit=6)
    return searches


@router.get("/saved", response_model=List[NormalizedJob])
async def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Retrieve all saved job listings for the active user."""
    repo = JobSearchRepository(db)
    saved_records = await repo.get_saved_jobs(current_user.id)

    jobs = []
    for record in saved_records:
        try:
            job_dict = json.loads(record.job_data)
            jobs.append(NormalizedJob(**job_dict))
        except Exception:
            continue
    return jobs


@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save_job(
    payload: SavedJobCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Save a job listing into the user's Supabase saved_jobs table."""
    repo = JobSearchRepository(db)
    saved_record = await repo.save_job(current_user.id, payload.job)
    return {"message": "Job saved successfully", "job_id": saved_record.job_id}


@router.delete("/saved/{job_id}", status_code=status.HTTP_200_OK)
async def unsave_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Unsave/remove a job listing from the user's saved_jobs table."""
    repo = JobSearchRepository(db)
    success = await repo.delete_saved_job(current_user.id, job_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job entry not found.",
        )
    return {"message": "Job removed from saved list", "job_id": job_id}
