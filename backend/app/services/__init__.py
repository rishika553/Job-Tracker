# Export service layer classes to facilitate API routing imports.
from app.services.auth import AuthService
from app.services.job import JobApplicationService
from app.services.gmail import GmailService
from app.services.classification import EmailClassificationService, ClassificationResult
from app.services.parser import AIEmailParserService
from app.services.company import CompanyService
from app.services.notification import NotificationService
from app.services.calendar import CalendarService
from app.services.analytics import AnalyticsService
from app.services.dashboard import DashboardService
