import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.jobs.tasks import (
    run_gmail_sync_pipeline,
    run_notification_reminders_pipeline,
)

logger = logging.getLogger(__name__)

# AsyncIOScheduler executes background tasks on FastAPI's asynchronous event loop
scheduler = AsyncIOScheduler()

# 1. Email Sync Job: Runs every 5 minutes to poll emails, classify, extract, and generate alerts
scheduler.add_job(
    run_gmail_sync_pipeline,
    "interval",
    minutes=5,
    id="gmail_poll_job",
    replace_existing=True,
)

# 2. Notification Reminders Job: Runs every 15 minutes to check for upcoming interviews & follow-up reminders
scheduler.add_job(
    run_notification_reminders_pipeline,
    "interval",
    minutes=15,
    id="notification_reminders_job",
    replace_existing=True,
)
