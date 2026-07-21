import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from app.db.types import PortableUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class ConnectedGmailAccount(Base):
    __tablename__ = "connected_gmail_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    access_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    scopes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="connected_gmail_accounts"
    )
    email_messages: Mapped[list["EmailMessage"]] = relationship(
        "EmailMessage", back_populates="connected_gmail_account", cascade="all, delete-orphan"
    )
