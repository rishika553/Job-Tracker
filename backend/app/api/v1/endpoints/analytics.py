from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsSummaryOut
from app.services.analytics import AnalyticsService

router = APIRouter()


@router.get("", response_model=AnalyticsSummaryOut)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> AnalyticsSummaryOut:
    """Fetch statistical analytics summary, conversion rates, and status distributions."""
    service = AnalyticsService(db)
    return await service.get_analytics_summary(current_user.id)
