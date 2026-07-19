import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.connected_gmail import ConnectedGmailAccount
from app.repositories.base import BaseRepository


class ConnectedGmailRepository(BaseRepository[ConnectedGmailAccount]):
    """Repository handling custom queries for ConnectedGmailAccount entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(ConnectedGmailAccount, db)

    async def get_by_email(self, email: str) -> Optional[ConnectedGmailAccount]:
        """Fetch a connected Gmail account credentials by email address."""
        query = select(ConnectedGmailAccount).where(
            ConnectedGmailAccount.email == email
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> List[ConnectedGmailAccount]:
        """Fetch all active connected Gmail accounts associated with a specific user."""
        query = select(ConnectedGmailAccount).where(
            ConnectedGmailAccount.user_id == user_id,
            ConnectedGmailAccount.is_active == True
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
