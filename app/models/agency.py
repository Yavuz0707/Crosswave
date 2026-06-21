"""Agency: the top-level tenant. Owns users and clients."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.user import User


class Agency(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "agencies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=text("'starter'")
    )

    users: Mapped[list["User"]] = relationship(
        back_populates="agency", cascade="all, delete-orphan"
    )
    clients: Mapped[list["Client"]] = relationship(
        back_populates="agency", cascade="all, delete-orphan"
    )
