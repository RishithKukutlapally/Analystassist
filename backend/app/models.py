from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    entity_name: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String, nullable=False)
    registration_number: Mapped[str] = mapped_column(String, nullable=False)
    document_name: Mapped[str] = mapped_column(String, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, default=1)
    ocr_info: Mapped[str] = mapped_column(String, default="OCR 300 DPI")
    status: Mapped[str] = mapped_column(String, default="ready")  # 'ready', 'signed', 'exception'
    assigned_analyst: Mapped[str] = mapped_column(String, default="Sarah Jenkins, CAMS")
    risk_rating: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # empty initially, set by MLRO
    sla_time: Mapped[str] = mapped_column(String, default="01:45:12")
    primary_owner_summary: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    fields: Mapped[List["Field"]] = relationship("Field", back_populates="case", cascade="all, delete-orphan")
    source_lines: Mapped[List["SourceLine"]] = relationship("SourceLine", back_populates="case", cascade="all, delete-orphan")
    ubo_holdings: Mapped[List["UboHolding"]] = relationship("UboHolding", back_populates="case", cascade="all, delete-orphan")


class SourceLine(Base):
    __tablename__ = "source_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    case: Mapped["Case"] = relationship("Case", back_populates="source_lines")

    __table_args__ = (
        Index("ix_source_lines_page_line", "case_id", "page_number", "line_number"),
    )


class Field(Base):
    __tablename__ = "fields"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    ai_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    page: Mapped[int] = mapped_column(Integer, nullable=False)
    line: Mapped[int] = mapped_column(Integer, nullable=False)
    quoted_span: Mapped[str] = mapped_column(Text, nullable=False)
    decision: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # 'accepted', 'edited', 'rejected'
    override_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # 'pending', 'accepted', 'edited', 'rejected'
    is_exception: Mapped[bool] = mapped_column(Boolean, default=False)
    exception_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="fields")


class UboHolding(Base):
    __tablename__ = "ubo_holdings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    holder_name: Mapped[str] = mapped_column(String, nullable=False)
    holder_type: Mapped[str] = mapped_column(String, nullable=False)  # 'natural_person', 'corporate', 'nominee'
    target_name: Mapped[str] = mapped_column(String, nullable=False)
    direct_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    effective_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    layer: Mapped[int] = mapped_column(Integer, default=1)
    citation: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="ubo_holdings")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    case_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String, nullable=False)  # 'ai', 'analyst', 'mlro'
    action: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)


class SubmissionStaging(Base):
    __tablename__ = "submission_staging"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    risk_rating: Mapped[str] = mapped_column(String, nullable=False)
    signed_by: Mapped[str] = mapped_column(String, nullable=False)
    signed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    payload: Mapped[str] = mapped_column(Text, nullable=False)
