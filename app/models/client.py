"""Client: a customer of the agency whose social accounts are tracked."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.agency import Agency
    from app.models.connected_account import ConnectedAccount
    from app.models.report import Report


class Client(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "clients"

    agency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    agency: Mapped["Agency"] = relationship(back_populates="clients")
    connected_accounts: Mapped[list["ConnectedAccount"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
