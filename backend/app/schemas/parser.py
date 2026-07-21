from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ExtractedEmailData(BaseModel):
    """Pydantic model validating structured job application details extracted from raw email."""

    company: Optional[str] = Field(None, description="Name of the company hiring")
    role: Optional[str] = Field(None, description="Title of the job role")
    platform: Optional[str] = Field(
        None, description="Platform used (e.g. LinkedIn, Indeed, Greenhouse)"
    )
    application_status: Optional[str] = Field(
        None, description="Status (e.g. applied, interviewing, offered, rejected)"
    )
    salary: Optional[str] = Field(
        None, description="Salary range or compensation details"
    )
    location: Optional[str] = Field(
        None, description="Job location or Remote status"
    )
    recruiter: Optional[str] = Field(
        None, description="Name or contact of the recruiter"
    )
    interview_date: Optional[datetime] = Field(
        None, description="Scheduled interview timestamp"
    )
    assessment_date: Optional[datetime] = Field(
        None, description="Scheduled assessment/test timestamp"
    )
    offer: bool = Field(False, description="True if email contains a job offer")
    rejection: bool = Field(
        False, description="True if email contains an application rejection"
    )
    confidence_score: float = Field(
        0.0, ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)"
    )

    model_config = ConfigDict(from_attributes=True)
