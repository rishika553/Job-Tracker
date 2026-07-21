import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job import JobApplicationRepository
from app.schemas.analytics import (
    AnalyticsSummaryOut,
    ConversionRate,
    MonthlyTrend,
    StatusCount,
)


class AnalyticsService:
    """Service performing statistical aggregations and calculating conversion metrics."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.job_repo = JobApplicationRepository(db)

    async def get_analytics_summary(self, user_id: uuid.UUID) -> AnalyticsSummaryOut:
        """Compute statistical summary for a user's job search pipeline."""
        total = await self.job_repo.get_total_count_by_user(user_id)
        status_dist_raw = await self.job_repo.get_status_distribution(user_id)
        platform_dist_raw = await self.job_repo.get_platform_distribution(user_id)

        status_distribution = [
            StatusCount(status=item["status"], count=item["count"])
            for item in status_dist_raw
        ]

        platform_breakdown = [
            StatusCount(status=item["status"], count=item["count"])
            for item in platform_dist_raw
        ]

        # Calculate conversion rates
        interview_count = sum(
            item["count"]
            for item in status_dist_raw
            if item["status"] in ("interviewing", "interview", "offered")
        )
        offer_count = sum(
            item["count"] for item in status_dist_raw if item["status"] == "offered"
        )

        app_to_interview_rate = (
            round((interview_count / total) * 100, 2) if total > 0 else 0.0
        )
        interview_to_offer_rate = (
            round((offer_count / interview_count) * 100, 2)
            if interview_count > 0
            else 0.0
        )

        conversion_rates = [
            ConversionRate(
                metric="Application to Interview Rate",
                rate_percentage=app_to_interview_rate,
            ),
            ConversionRate(
                metric="Interview to Offer Rate",
                rate_percentage=interview_to_offer_rate,
            ),
        ]

        monthly_trends = [MonthlyTrend(month="2026-07", count=total)]

        return AnalyticsSummaryOut(
            total_applications=total,
            status_distribution=status_distribution,
            monthly_trends=monthly_trends,
            platform_breakdown=platform_breakdown,
            conversion_rates=conversion_rates,
        )
