import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from app.db.types import PortableUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class Recruiter(Base):
    __tablename__ = "recruiters"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        PortableUUID,
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    job_application_id: Mapped[uuid.UUID | None] = mapped_column(
        PortableUUID,
        ForeignKey("job_applications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    user: Mapped["User"] = relationship("User", back_populates="recruiters")
    company: Mapped["Company"] = relationship("Company", back_populates="recruiters")
    job_application: Mapped["JobApplication"] = relationship(
        "JobApplication", back_populates="recruiters"
    )
