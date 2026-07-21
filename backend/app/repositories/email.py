import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.email import EmailMessage
from app.repositories.base import BaseRepository


class EmailMessageRepository(BaseRepository[EmailMessage]):
    """Repository handling database operations for EmailMessage entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(EmailMessage, db)

    async def get_by_gmail_id(self, gmail_message_id: str) -> Optional[EmailMessage]:
        """Fetch an email message record by Gmail message ID."""
        query = select(EmailMessage).where(
            EmailMessage.gmail_message_id == gmail_message_id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_pending_analysis(self, limit: int = 10) -> List[EmailMessage]:
        """Fetch email messages pending AI extraction."""
        query = (
            select(EmailMessage)
            .where(EmailMessage.ai_analysis_status == "pending")
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_ai_extraction(
        self, email_id: uuid.UUID, extracted_data: dict, status: str = "success"
    ) -> Optional[EmailMessage]:
        """Save parsed JSONB data and update AI analysis status."""
        email_record = await self.get(email_id)
        if email_record:
            email_record.ai_extracted_data = extracted_data
            email_record.ai_analysis_status = status
            await self.db.flush()
        return email_record
