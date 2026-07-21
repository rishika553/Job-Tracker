from typing import List
from pydantic import BaseModel, ConfigDict


class StatusCount(BaseModel):
    status: str
    count: int


class MonthlyTrend(BaseModel):
    month: str  # YYYY-MM
    count: int


class ConversionRate(BaseModel):
    metric: str
    rate_percentage: float


class AnalyticsSummaryOut(BaseModel):
    total_applications: int
    status_distribution: List[StatusCount]
    monthly_trends: List[MonthlyTrend]
    platform_breakdown: List[StatusCount]
    conversion_rates: List[ConversionRate]

    model_config = ConfigDict(from_attributes=True)
