"""Connected account endpoints: connect a channel, list, sync, delete."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, get_owned_account, get_owned_client
from app.models.client import Client
from app.models.connected_account import ConnectedAccount
from app.models.platform import PLATFORM_YOUTUBE, Platform
from app.schemas.account import (
    AccountConnectRequest,
    AccountSyncResult,
    ConnectedAccountRead,
)
from app.services.youtube.client import YouTubeAPIError, get_youtube_client
from app.services.youtube.sync import sync_youtube_account

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("", response_model=ConnectedAccountRead, status_code=status.HTTP_201_CREATED)
async def connect_account(
    payload: AccountConnectRequest, current_user: CurrentUser, db: DbSession
) -> ConnectedAccount:
    """Connect a public YouTube channel to one of the agency's clients."""
    if payload.platform != PLATFORM_YOUTUBE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'youtube' is supported in this version.",
        )

    # Ensure the target client belongs to the caller's agency.
    await get_owned_client(db, current_user, payload.client_id)

    platform = await db.scalar(
        select(Platform).where(Platform.name == payload.platform)
    )
    if platform is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Platform '{payload.platform}' is not registered.",
        )

    async with get_youtube_client() as yt:
        try:
            channel = await yt.resolve_channel(payload.channel)
        except YouTubeAPIError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
            ) from exc

    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No YouTube channel found for '{payload.channel}'.",
        )

    duplicate = await db.scalar(
        select(ConnectedAccount).where(
            ConnectedAccount.platform_id == platform.id,
            ConnectedAccount.external_account_id == channel.channel_id,
        )
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This channel is already connected.",
        )

    account = ConnectedAccount(
        client_id=payload.client_id,
        platform_id=platform.id,
        external_account_id=channel.channel_id,
        display_name=channel.title,
        status="active",
    )
    db.add(account)
    await db.flush()
    return account


@router.get("", response_model=list[ConnectedAccountRead])
async def list_accounts(
    current_user: CurrentUser,
    db: DbSession,
    client_id: uuid.UUID | None = None,
) -> list[ConnectedAccount]:
    """List connected accounts for the agency, optionally filtered by client."""
    stmt = (
        select(ConnectedAccount)
        .join(Client, ConnectedAccount.client_id == Client.id)
        .where(Client.agency_id == current_user.agency_id)
        .order_by(ConnectedAccount.connected_at.desc())
    )
    if client_id is not None:
        stmt = stmt.where(ConnectedAccount.client_id == client_id)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{account_id}", response_model=ConnectedAccountRead)
async def get_account(
    account_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> ConnectedAccount:
    return await get_owned_account(db, current_user, account_id)


@router.post("/{account_id}/sync", response_model=AccountSyncResult)
async def sync_account(
    account_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> AccountSyncResult:
    """Pull the latest stats for a connected account from its platform."""
    account = await get_owned_account(db, current_user, account_id)

    platform = await db.get(Platform, account.platform_id)
    if platform is None or platform.name != PLATFORM_YOUTUBE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sync is only implemented for YouTube accounts.",
        )

    try:
        result = await sync_youtube_account(db, account)
    except YouTubeAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc

    return AccountSyncResult(
        account_id=account.id,
        captured_date=result.captured_date,
        followers_count=result.followers_count,
        views_count=result.views_count,
        content_items_synced=result.content_items_synced,
        message="Sync completed.",
    )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> None:
    account = await get_owned_account(db, current_user, account_id)
    await db.delete(account)
