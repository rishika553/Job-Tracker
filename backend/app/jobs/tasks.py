import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.connected_gmail import ConnectedGmailAccount
from app.models.email import EmailMessage
from app.models.interview import Interview
from app.models.job import JobApplication
from app.repositories.connected_gmail import ConnectedGmailRepository
from app.repositories.email import EmailMessageRepository
from app.repositories.interview import InterviewRepository
from app.repositories.job import JobApplicationRepository
from app.repositories.notification import NotificationRepository
from app.schemas.company import CompanyCreate
from app.schemas.job import JobApplicationCreate
from app.services.classification import (
    ClassificationResult,
    EmailClassificationService,
)
from app.services.company import CompanyService
from app.services.gmail import GmailService
from app.services.job import JobApplicationService
from app.services.notification import NotificationService
from app.services.parser import AIEmailParserService

logger = logging.getLogger(__name__)


async def sync_account_gmail_emails(
    db, account: ConnectedGmailAccount
) -> int:
    """
    Process new emails for a single connected Gmail account.
    Avoids duplicate processing by checking existing gmail_message_id records.
    """
    gmail_service = GmailService(db)
    email_repo = EmailMessageRepository(db)
    classification_service = EmailClassificationService()
    parser_service = AIEmailParserService(db)
    job_service = JobApplicationService(db)
    company_service = CompanyService(db)
    notification_repo = NotificationRepository(db)

    try:
        # Get valid access token (refreshes if close to expiry)
        access_token = await gmail_service.get_valid_access_token(account)
    except Exception as exc:
        logger.error(
            f"Failed to refresh access token for Gmail account {account.email}: {exc}"
        )
        return 0

    # 1. Fetch recent message headers (newer_than:30d)
    try:
        messages = await gmail_service.email_client.list_recent_messages(
            access_token=access_token, q="newer_than:30d", max_results=25
        )
    except Exception as exc:
        logger.error(f"Failed to list messages for {account.email}: {exc}")
        return 0

    processed_count = 0
    now = datetime.now(timezone.utc)

    for msg in messages:
        gmail_msg_id = msg.get("id")
        if not gmail_msg_id:
            continue

        # 2. DEDUPLICATION CHECK: Skip if already processed in PostgreSQL
        existing = await email_repo.get_by_gmail_id(gmail_msg_id)
        if existing:
            logger.debug(f"Skipping duplicate message {gmail_msg_id}")
            continue

        # 3. Fetch full message content
        try:
            msg_details = await gmail_service.email_client.get_message(
                access_token, gmail_msg_id
            )
        except Exception as exc:
            logger.error(f"Error fetching message {gmail_msg_id}: {exc}")
            continue

        subject = msg_details.get("subject", "")
        sender = msg_details.get("sender", "")
        snippet = msg_details.get("snippet", "")

        # 4. Save raw EmailMessage record in PostgreSQL
        email_record = await email_repo.create(
            obj_in={
                "user_id": account.user_id,
                "connected_gmail_account_id": account.id,
                "gmail_message_id": gmail_msg_id,
                "subject": subject,
                "sender": sender,
                "snippet": snippet,
                "received_at": now,
                "processed_at": now,
                "ai_analysis_status": "pending",
            }
        )

        # 5. Detect job emails via EmailClassificationService
        classification = await classification_service.classify_email(
            subject=subject, sender=sender, body_snippet=snippet
        )

        if classification == ClassificationResult.JOB_EMAIL:
            # 6. Parse AI details via AIEmailParserService
            extracted = await parser_service.parse_email_message(email_record.id)

            if extracted and extracted.company:
                # Resolve/Create Company
                company = await company_service.create_company(
                    CompanyCreate(name=extracted.company)
                )

                # Resolve/Create JobApplication
                job_app = await job_service.create_application(
                    user_id=account.user_id,
                    job_in=JobApplicationCreate(
                        company=company.name,
                        title=extracted.role or "Job Opportunity",
                        status=extracted.application_status or "applied",
                        location=extracted.location,
                        salary_range=extracted.salary,
                        source="gmail",
                    ),
                )

                # Link JobApplication to EmailMessage
                email_record.job_application_id = job_app.id
                await db.flush()

                # 7. Generate Specific Event Notification for User
                notification_service = NotificationService(db)
                role_title = extracted.role or "Job Opportunity"

                if extracted.offer:
                    await notification_service.notify_offer(
                        account.user_id, company.name, role_title, details=extracted.salary
                    )
                elif extracted.rejection:
                    await notification_service.notify_rejection(
                        account.user_id, company.name, role_title
                    )
                elif extracted.interview_date:
                    await notification_service.notify_interview_invitation(
                        account.user_id,
                        company.name,
                        role_title,
                        str(extracted.interview_date),
                    )
                elif extracted.assessment_date:
                    await notification_service.notify_assessment_deadline(
                        account.user_id,
                        company.name,
                        role_title,
                        str(extracted.assessment_date),
                    )
                else:
                    await notification_service.create_notification(
                        account.user_id,
                        f"Job Email Detected - {company.name}",
                        f"Tracked application for {company.name} ({role_title}).",
                        "job_detected",
                    )

            processed_count += 1
        else:
            # Non-job email -> Mark ignored
            email_record.ai_analysis_status = "ignored"
            await db.flush()

    return processed_count


async def run_gmail_sync_pipeline() -> int:
    """
    Standalone task entrypoint for background email sync.
    Can be scheduled via APScheduler or invoked as a Celery task.
    """
    logger.info("Starting background Gmail sync pipeline...")
    total_processed = 0

    async with SessionLocal() as db:
        gmail_repo = ConnectedGmailRepository(db)
        # Fetch all active connected accounts
        accounts = await gmail_repo.get_multi(skip=0, limit=500)
        active_accounts = [acc for acc in accounts if acc.is_active]

        for account in active_accounts:
            processed = await sync_account_gmail_emails(db, account)
            total_processed += processed

        await db.commit()

    logger.info(
        f"Completed background Gmail sync pipeline. Processed {total_processed} new job emails."
    )
    return total_processed


async def run_notification_reminders_pipeline() -> int:
    """
    Background pipeline scanning for upcoming interviews and stagnant job applications.
    Triggers 'upcoming_interview' and 'followup_reminder' notifications.
    """
    logger.info("Starting background notification reminders pipeline...")
    total_generated = 0
    now = datetime.now(timezone.utc)
    twenty_four_hours_later = now + timedelta(hours=24)

    async with SessionLocal() as db:
        notification_service = NotificationService(db)

        # 1. Upcoming Interview Reminders (in next 24 hours)
        query = (
            select(Interview)
            .join(JobApplication, Interview.job_application_id == JobApplication.id)
            .where(
                Interview.scheduled_at >= now,
                Interview.scheduled_at <= twenty_four_hours_later,
            )
        )
        result = await db.execute(query)
        upcoming_interviews = list(result.scalars().all())

        for item in upcoming_interviews:
            company_name = (
                item.job_application.company.name
                if item.job_application and item.job_application.company
                else "Company"
            )
            role_title = (
                item.job_application.title if item.job_application else "Job Opportunity"
            )
            user_id = item.job_application.user_id
            notif = await notification_service.notify_upcoming_interview(
                user_id=user_id,
                company=company_name,
                role=role_title,
                scheduled_at=str(item.scheduled_at),
            )
            if notif:
                total_generated += 1

        # 2. Follow-up Reminders (Applications applied > 14 days ago without updates)
        fourteen_days_ago = now - timedelta(days=14)
        query_stagnant = select(JobApplication).where(
            JobApplication.status == "applied",
            JobApplication.applied_at <= fourteen_days_ago,
        )
        res_stagnant = await db.execute(query_stagnant)
        stagnant_apps = list(res_stagnant.scalars().all())

        for app_item in stagnant_apps:
            company_name = (
                app_item.company.name if app_item.company else "Company"
            )
            notif = await notification_service.notify_followup_reminder(
                user_id=app_item.user_id,
                company=company_name,
                role=app_item.title,
                days_idle=14,
            )
            if notif:
                total_generated += 1

        await db.commit()

    logger.info(
        f"Completed notification reminders pipeline. Generated {total_generated} reminders."
    )
    return total_generated
