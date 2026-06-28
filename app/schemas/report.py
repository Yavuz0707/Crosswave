"""Report request schema."""

from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    account_id: uuid.UUID
    period_start: date
    period_end: date
    # Optional white-label fields.
    agency_logo_url: str | None = None  # external URL (not fetched in MVP)
    accent_color_hex: str | None = None  # e.g. "#722F37"; defaults to vine red
