"""Goal: a target metric value for an account over a period."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.connected_account import ConnectedAccount


class Goal(UUIDPKMixin, Base):
    __tablename__ = "goals"

    connected_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("connected_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    # e.g. "followers_count", "views_count", "engagement_rate".
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_value: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    connected_account: Mapped["ConnectedAccount"] = relationship(
        back_populates="goals"
    )
