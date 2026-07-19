import uuid
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository handling custom queries for RefreshToken entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        """Fetch a active refresh token record by token string."""
        query = select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.is_revoked == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_any_by_token(self, token: str) -> Optional[RefreshToken]:
        """Fetch a refresh token record by token string, regardless of its revocation status."""
        query = select(RefreshToken).where(RefreshToken.token == token)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """Revoke all active refresh tokens for a specific user (logout all devices/breach response)."""
        query = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
            .values(is_revoked=True)
        )
        await self.db.execute(query)
