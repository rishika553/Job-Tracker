import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.repositories.company import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate


class CompanyService:
    """Service encapsulating business logic for companies management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CompanyRepository(db)

    async def create_company(self, obj_in: CompanyCreate) -> Company:
        """Create a new company record or return existing if name matches."""
        existing = await self.repo.get_by_name(obj_in.name)
        if existing:
            return existing
        return await self.repo.create(obj_in.model_dump())

    async def get_company(self, company_id: uuid.UUID) -> Optional[Company]:
        """Fetch company details by ID."""
        return await self.repo.get(company_id)

    async def list_companies(
        self, q: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[Company]:
        """List companies with optional name search filter."""
        if q:
            return await self.repo.search_by_name(q, skip=skip, limit=limit)
        return await self.repo.get_multi(skip=skip, limit=limit)
