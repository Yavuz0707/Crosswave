"""Client schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ClientUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agency_id: uuid.UUID
    name: str
    created_at: datetime
