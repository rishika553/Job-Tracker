import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class InterviewBase(BaseModel):
    job_application_id: uuid.UUID
    title: str
    type: str  # e.g. phone, technical, onsite
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60
    notes: Optional[str] = None
    feedback: Optional[str] = None
    location_url: Optional[str] = None


class InterviewCreate(InterviewBase):
    pass


class InterviewOut(InterviewBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarEventOut(BaseModel):
    id: uuid.UUID
    event_type: str  # interview, assessment, application_deadline
    title: str
    scheduled_at: datetime
    company: Optional[str] = None
    job_title: Optional[str] = None
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
