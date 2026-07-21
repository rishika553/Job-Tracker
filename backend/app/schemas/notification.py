import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
