import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from app.db.types import PortableUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID, primary_key=True, default=uuid.uuid4
    )
    job_application_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID,
        ForeignKey("job_applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., phone, technical, onsite
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_url: Mapped[str | None] = mapped_column(String(512), nullable=True)  # Zoom/Meet/etc.

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
    job_application: Mapped["JobApplication"] = relationship(
        "JobApplication", back_populates="interviews"
    )
