from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryOut
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("", response_model=DashboardSummaryOut)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> DashboardSummaryOut:
    """Fetch high-level dashboard metrics, recent applications, and upcoming events."""
    service = DashboardService(db)
    return await service.get_dashboard_summary(current_user.id)
