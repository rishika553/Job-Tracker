from enum import Enum


class ApplicationStatus(str, Enum):
    """Enumeration of possible job application lifecycle statuses."""

    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    REJECTED = "rejected"
    ASSESSMENT = "assessment"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


class AIAnalysisStatus(str, Enum):
    """Enumeration of email AI extraction statuses."""

    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    IGNORED = "ignored"


class NotificationType(str, Enum):
    """Enumeration of system notification types."""

    INTERVIEW_INVITATION = "interview_invitation"
    OFFER = "offer"
    REJECTION = "rejection"
    UPCOMING_INTERVIEW = "upcoming_interview"
    ASSESSMENT_DEADLINE = "assessment_deadline"
    FOLLOWUP_REMINDER = "followup_reminder"
    JOB_DETECTED = "job_detected"


class InterviewType(str, Enum):
    """Enumeration of scheduled interview formats."""

    PHONE = "phone"
    TECHNICAL = "technical"
    ONSITE = "onsite"
    BEHAVIORAL = "behavioral"
