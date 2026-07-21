from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    applications,
    auth,
    calendar,
    companies,
    dashboard,
    gmail,
    notifications,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(gmail.router, prefix="/gmail", tags=["gmail"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
