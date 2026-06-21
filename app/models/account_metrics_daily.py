"""AccountMetricsDaily: one snapshot row per account per day."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.connected_account import ConnectedAccount


class AccountMetricsDaily(UUIDPKMixin, Base):
    __tablename__ = "account_metrics_daily"
    __table_args__ = (
        UniqueConstraint(
            "connected_account_id",
            "captured_date",
            name="uq_account_metrics_daily_account_date",
        ),
        Index(
            "idx_metrics_account_date",
            "connected_account_id",
            text("captured_date DESC"),
        ),
    )

    connected_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("connected_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    captured_date: Mapped[date] = mapped_column(Date, nullable=False)
    followers_count: Mapped[int | None] = mapped_column(Integer)
    views_count: Mapped[int | None] = mapped_column(BigInteger)
    engagement_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    connected_account: Mapped["ConnectedAccount"] = relationship(
        back_populates="metrics_daily"
    )
