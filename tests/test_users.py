"""User management tests: list + delete with multi-tenant & role rules."""

from __future__ import annotations

import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User
from tests.conftest import RegisterFn


async def _add_member(
    db: AsyncSession, agency_id: str, email: str, role: str = "member"
) -> User:
    member = User(
        agency_id=uuid.UUID(agency_id),
        email=email,
        password_hash=hash_password("password123"),
        role=role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def test_list_and_delete_user(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
) -> None:
    me = (await client.get("/api/v1/auth/me", headers=auth_headers)).json()
    member = await _add_member(db_session, me["agency_id"], "member@agency.co")

    listing = await client.get("/api/v1/users", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 2

    deleted = await client.delete(
        f"/api/v1/users/{member.id}", headers=auth_headers
    )
    assert deleted.status_code == 204

    after = await client.get("/api/v1/users", headers=auth_headers)
    assert len(after.json()) == 1


async def test_cannot_delete_self(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    me = (await client.get("/api/v1/auth/me", headers=auth_headers)).json()
    resp = await client.delete(f"/api/v1/users/{me['id']}", headers=auth_headers)
    assert resp.status_code == 400


async def test_cannot_delete_other_agency_user(
    client: AsyncClient, auth_headers: dict[str, str], register: RegisterFn
) -> None:
    other = await register(email="other@b.co", agency="Agency B")
    other_me = (await client.get("/api/v1/auth/me", headers=other)).json()

    resp = await client.delete(
        f"/api/v1/users/{other_me['id']}", headers=auth_headers
    )
    assert resp.status_code == 404


async def test_non_manager_cannot_delete(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
) -> None:
    me = (await client.get("/api/v1/auth/me", headers=auth_headers)).json()
    member = await _add_member(db_session, me["agency_id"], "member2@agency.co")
    member_headers = {"Authorization": f"Bearer {create_access_token(member.id)}"}

    # A non-owner/admin member tries to delete the owner -> forbidden.
    resp = await client.delete(f"/api/v1/users/{me['id']}", headers=member_headers)
    assert resp.status_code == 403
