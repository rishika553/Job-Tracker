from typing import List
from pydantic import BaseModel, ConfigDict
from app.schemas.calendar import CalendarEventOut
from app.schemas.job import JobApplicationOut


class DashboardMetrics(BaseModel):
    total_applications: int
    active_applications: int
    interviews_scheduled: int
    offers_received: int
    rejections_received: int
    response_rate_percentage: float


class DashboardSummaryOut(BaseModel):
    metrics: DashboardMetrics
    recent_applications: List[JobApplicationOut]
    upcoming_events: List[CalendarEventOut]
    unread_notifications_count: int

    model_config = ConfigDict(from_attributes=True)
