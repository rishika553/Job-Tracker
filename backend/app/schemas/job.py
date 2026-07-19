import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class JobApplicationBase(BaseModel):
    company: str
    title: str
    status: str = "applied"
    applied_at: Optional[datetime] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    source: str = "manual"


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    applied_at: Optional[datetime] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    source: Optional[str] = None


class JobApplicationOut(JobApplicationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    applied_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
