"""Auth & user schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Self-serve sign-up: creates a new agency and its first (owner) user."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    agency_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agency_id: uuid.UUID
    email: EmailStr
    role: str
    created_at: datetime
