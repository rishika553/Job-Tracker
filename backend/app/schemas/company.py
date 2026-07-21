import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


class CompanyOut(CompanyBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
