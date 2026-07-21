from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.calendar import CalendarEventOut, InterviewCreate, InterviewOut
from app.services.calendar import CalendarService

router = APIRouter()


@router.get("/events", response_model=List[CalendarEventOut])
async def get_calendar_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Get calendar events for user within date range (defaults to current window)."""
    now = datetime.now(timezone.utc)
    start = start_date or (now - timedelta(days=30))
    end = end_date or (now + timedelta(days=60))

    service = CalendarService(db)
    return await service.get_user_events(
        user_id=current_user.id, start_date=start, end_date=end
    )


@router.post(
    "/interviews", response_model=InterviewOut, status_code=status.HTTP_201_CREATED
)
async def schedule_interview(
    obj_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Schedule a new interview for a job application."""
    service = CalendarService(db)
    return await service.schedule_interview(obj_in)
