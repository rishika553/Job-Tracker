import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    """Repository handling custom database operations for Company entities."""

    def __init__(self, db: AsyncSession):
        super().__init__(Company, db)

    async def get_by_name(self, name: str) -> Optional[Company]:
        """Fetch a company record by exact name."""
        query = select(Company).where(Company.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def search_by_name(
        self, q: str, skip: int = 0, limit: int = 100
    ) -> List[Company]:
        """Search companies by name substring matching (case-insensitive)."""
        query = (
            select(Company)
            .where(Company.name.ilike(f"%{q}%"))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
