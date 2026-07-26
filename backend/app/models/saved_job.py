import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
from app.db.types import PortableUUID


class SavedJob(Base):
    """SQLAlchemy model representing bookmarked/saved job opportunities for users."""

    __tablename__ = "saved_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    job_data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string of normalized job object
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_jobs")
