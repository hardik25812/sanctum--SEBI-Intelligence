import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class ClientProfile(Base):
    __tablename__ = "client_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    aum_inr: Mapped[int] = mapped_column(BigInteger, nullable=False)
    business_risk: Mapped[dict] = mapped_column(JSONB, nullable=False)
    income_risk: Mapped[dict] = mapped_column(JSONB, nullable=False)
    balance_sheet: Mapped[dict] = mapped_column(JSONB, nullable=False)
    risk_profile: Mapped[str] = mapped_column(Text, nullable=False)
    kyc_tier: Mapped[str] = mapped_column(Text, nullable=False)
    entitlements: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)

    traces: Mapped[list["Trace"]] = relationship(back_populates="client_profile")


class Trace(Base):
    __tablename__ = "traces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    client_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("client_profiles.id"), nullable=False
    )
    query: Mapped[str] = mapped_column(Text, nullable=False)
    final_verdict: Mapped[str] = mapped_column(Text, nullable=False)
    final_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    primary_model: Mapped[str] = mapped_column(Text, nullable=False)
    cross_check_model: Mapped[str] = mapped_column(Text, nullable=False)

    client_profile: Mapped["ClientProfile"] = relationship(back_populates="traces")
    steps: Mapped[list["TraceStep"]] = relationship(
        back_populates="trace", order_by="TraceStep.step_number"
    )


class TraceStep(Base):
    __tablename__ = "trace_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    trace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("traces.id", ondelete="CASCADE"), nullable=False
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    step_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    input_hash: Mapped[str] = mapped_column(Text, nullable=False)
    output_hash: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )

    trace: Mapped["Trace"] = relationship(back_populates="steps")
