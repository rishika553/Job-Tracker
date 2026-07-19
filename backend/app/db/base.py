# Import all the models, so that Base has them before being
# imported by Alembic or the database setup scripts.
from app.db.base_class import Base  # noqa: F401
from app.models.email import EmailMessage  # noqa: F401
from app.models.job import JobApplication  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.connected_gmail import ConnectedGmailAccount  # noqa: F401
from app.models.recruiter import Recruiter  # noqa: F401
from app.models.interview import Interview  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.timeline import ApplicationTimeline  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401


