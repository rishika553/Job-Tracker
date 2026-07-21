# Import all schemas to make import statements cleaner across the app.
from app.schemas.job import (
    JobApplicationCreate,
    JobApplicationOut,
    JobApplicationUpdate,
)
from app.schemas.token import Token, TokenPayload
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.parser import ExtractedEmailData
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.schemas.notification import NotificationOut
from app.schemas.calendar import CalendarEventOut, InterviewCreate, InterviewOut
from app.schemas.analytics import AnalyticsSummaryOut, StatusCount, MonthlyTrend, ConversionRate
from app.schemas.dashboard import DashboardSummaryOut, DashboardMetrics
