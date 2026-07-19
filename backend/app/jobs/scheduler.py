import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

# AsyncIOScheduler executes tasks on FastAPI's asynchronous event loop
scheduler = AsyncIOScheduler()


async def poll_gmail_emails_job():
    """
    Background task to scan for new job-related emails.
    Stripe-grade background processing is decoupled from request-response cycles.
    """
    logger.info("Executing scheduled job: polling Gmail and running AI analysis...")


# Add scheduled jobs
# Runs every 10 minutes to poll emails
scheduler.add_job(
    poll_gmail_emails_job,
    "interval",
    minutes=10,
    id="gmail_poll_job",
    replace_existing=True,
)
