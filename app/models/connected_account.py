"""ConnectedAccount: a single social account (e.g. a YouTube channel) tracked
for a client on a given platform."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.account_metrics_daily import AccountMetricsDaily
    from app.models.client import Client
    from app.models.content_item import ContentItem
    from app.models.goal import Goal
    from app.models.platform import Platform


class ConnectedAccount(UUIDPKMixin, Base):
    __tablename__ = "connected_accounts"
    __table_args__ = (
        UniqueConstraint(
            "platform_id",
            "external_account_id",
            name="uq_connected_accounts_platform_external",
        ),
        Index("idx_connected_accounts_client", "client_id"),
    )

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("platforms.id"), nullable=False
    )
    # Platform-native account identifier (e.g. a YouTube channel id "UC...").
    external_account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255))

    # OAuth fields — unused for the YouTube API-key flow, reserved for future
    # platforms (Instagram/TikTok) that require per-account tokens.
    access_token: Mapped[str | None] = mapped_column(Text)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'active'")
    )
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    client: Mapped["Client"] = relationship(back_populates="connected_accounts")
    platform: Mapped["Platform"] = relationship(back_populates="connected_accounts")
    metrics_daily: Mapped[list["AccountMetricsDaily"]] = relationship(
        back_populates="connected_account", cascade="all, delete-orphan"
    )
    content_items: Mapped[list["ContentItem"]] = relationship(
        back_populates="connected_account", cascade="all, delete-orphan"
    )
    goals: Mapped[list["Goal"]] = relationship(
        back_populates="connected_account", cascade="all, delete-orphan"
    )
