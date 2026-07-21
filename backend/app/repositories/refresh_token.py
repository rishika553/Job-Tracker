import uuid
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_token
from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository handling custom queries for RefreshToken entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def create_hashed(
        self, user_id: uuid.UUID, raw_token: str, expires_at
    ) -> RefreshToken:
        """Create a refresh token record storing its SHA-256 hash in database."""
        token_digest = hash_token(raw_token)
        return await self.create(
            obj_in={
                "user_id": user_id,
                "token": token_digest,
                "expires_at": expires_at,
                "is_revoked": False,
            }
        )

    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        """Fetch an active refresh token record by raw or hashed token string."""
        token_digest = hash_token(token)
        query = select(RefreshToken).where(
            (RefreshToken.token == token_digest) | (RefreshToken.token == token),
            RefreshToken.is_revoked == False,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_any_by_token(self, token: str) -> Optional[RefreshToken]:
        """Fetch a refresh token record by raw or hashed token string."""
        token_digest = hash_token(token)
        query = select(RefreshToken).where(
            (RefreshToken.token == token_digest) | (RefreshToken.token == token)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """Revoke all active refresh tokens for a specific user."""
        query = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
            .values(is_revoked=True)
        )
        await self.db.execute(query)
