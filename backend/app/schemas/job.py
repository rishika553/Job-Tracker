import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class JobSearchParams(BaseModel):
    """Query parameters for job search request."""
    query: str = Field(default="Developer", description="Job title, keyword, or company name")
    location: Optional[str] = Field(default="", description="City, state, or Remote")
    experience: Optional[str] = Field(default="", description="entry, mid, senior, lead")
    employment_type: Optional[str] = Field(default="", description="Full Time, Part Time, Internship, Contract")
    salary: Optional[str] = Field(default="", description="Minimum salary filter")
    page: int = Field(default=1, ge=1, description="Pagination page number")


class NormalizedJob(BaseModel):
    """
    Canonical normalized job payload required by the frontend.
    Includes future-ready AI extension fields.
    """
    id: str
    title: str
    company: str
    location: str
    employment_type: str = "Full Time"
    salary: str = "Not specified"
    description: str = ""
    apply_url: str = ""
    posted_at: str = "Recently"
    source: str = "JSearch"
    company_logo: Optional[str] = None
    skills: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    ai_match_score: Optional[float] = None  # Future AI feature placeholder

    model_config = ConfigDict(from_attributes=True)


class SavedJobCreate(BaseModel):
    """Schema for saving a job listing."""
    job: NormalizedJob


class SavedJobResponse(BaseModel):
    """Schema returning saved job metadata."""
    id: uuid.UUID
    user_id: uuid.UUID
    job_id: str
    job_data: NormalizedJob
    saved_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentSearchResponse(BaseModel):
    """Schema returning recent search logs."""
    id: uuid.UUID
    query: str
    location: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Keep existing JobApplication schemas below for compatibility
class JobApplicationBase(BaseModel):
    title: str
    status: str = "applied"
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    source: str = "manual"


class JobApplicationCreate(JobApplicationBase):
    company: str
    company_id: Optional[uuid.UUID] = None
    resume_id: Optional[uuid.UUID] = None


class JobApplicationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    company_id: Optional[uuid.UUID] = None
    resume_id: Optional[uuid.UUID] = None


class JobApplicationResponse(JobApplicationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    resume_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Compatibility aliases
JobApplicationOut = JobApplicationResponse
JobApplicationIn = JobApplicationCreate

