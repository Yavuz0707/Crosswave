"""Shared API dependencies: database session, authentication, ownership checks."""

from __future__ import annotations

import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.client import Client
from app.models.connected_account import ConnectedAccount
from app.models.user import User

DbSession = Annotated[AsyncSession, Depends(get_db)]

_bearer_scheme = HTTPBearer(auto_error=True, description="JWT access token")

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer_scheme)],
    db: DbSession,
) -> User:
    """Resolve the authenticated user from the bearer token."""
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise _credentials_exc from exc

    subject = payload.get("sub")
    if not subject:
        raise _credentials_exc
    try:
        user_id = uuid.UUID(subject)
    except (ValueError, TypeError) as exc:
        raise _credentials_exc from exc

    user = await db.get(User, user_id)
    if user is None:
        raise _credentials_exc
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_owned_client(
    db: AsyncSession, user: User, client_id: uuid.UUID
) -> Client:
    """Return a client owned by the user's agency, or raise 404."""
    client = await db.get(Client, client_id)
    if client is None or client.agency_id != user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    return client


async def get_owned_account(
    db: AsyncSession, user: User, account_id: uuid.UUID
) -> ConnectedAccount:
    """Return a connected account belonging to the user's agency, or raise 404."""
    stmt = (
        select(ConnectedAccount)
        .join(Client, ConnectedAccount.client_id == Client.id)
        .where(
            ConnectedAccount.id == account_id,
            Client.agency_id == user.agency_id,
        )
    )
    account = (await db.execute(stmt)).scalar_one_or_none()
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connected account not found"
        )
    return account
