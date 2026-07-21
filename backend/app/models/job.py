import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from app.db.types import PortableUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

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
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(50), default="applied", nullable=False, index=True
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    salary_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(
        String(50), default="manual", nullable=False
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        PortableUUID,
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

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
    user: Mapped["User"] = relationship("User", back_populates="job_applications")
    company: Mapped["Company"] = relationship("Company", back_populates="job_applications")
    resume: Mapped["Resume"] = relationship("Resume", back_populates="job_applications")
    recruiters: Mapped[list["Recruiter"]] = relationship(
        "Recruiter", back_populates="job_application", cascade="all, delete-orphan"
    )
    interviews: Mapped[list["Interview"]] = relationship(
        "Interview", back_populates="job_application", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["ApplicationTimeline"]] = relationship(
        "ApplicationTimeline", back_populates="job_application", cascade="all, delete-orphan"
    )
    email_messages: Mapped[list["EmailMessage"]] = relationship(
        "EmailMessage", back_populates="job_application", cascade="all, delete-orphan"
    )

