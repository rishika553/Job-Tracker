import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyOut
from app.services.company import CompanyService

router = APIRouter()


@router.get("", response_model=List[CompanyOut])
async def list_companies(
    q: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """List companies with optional search query."""
    service = CompanyService(db)
    return await service.list_companies(q=q, skip=skip, limit=limit)


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    obj_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Add a company to the system."""
    service = CompanyService(db)
    return await service.create_company(obj_in)


@router.get("/{id}", response_model=CompanyOut)
async def get_company(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> Any:
    """Get company details by ID."""
    service = CompanyService(db)
    company = await service.get_company(id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )
    return company
