"""Client CRUD endpoints (scoped to the authenticated user's agency)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, get_owned_client
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientRead])
async def list_clients(current_user: CurrentUser, db: DbSession) -> list[Client]:
    stmt = (
        select(Client)
        .where(Client.agency_id == current_user.agency_id)
        .order_by(Client.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate, current_user: CurrentUser, db: DbSession
) -> Client:
    client = Client(agency_id=current_user.agency_id, name=payload.name)
    db.add(client)
    await db.flush()
    return client


@router.get("/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> Client:
    return await get_owned_client(db, current_user, client_id)


@router.patch("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> Client:
    client = await get_owned_client(db, current_user, client_id)
    client.name = payload.name
    await db.flush()
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> None:
    client = await get_owned_client(db, current_user, client_id)
    await db.delete(client)
