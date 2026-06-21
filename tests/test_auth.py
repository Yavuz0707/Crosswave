"""Auth endpoint integration tests."""

from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import RegisterFn


async def test_register_returns_token(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@agency.co", "password": "password123", "agency_name": "New"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


async def test_register_duplicate_email_conflicts(client: AsyncClient) -> None:
    payload = {"email": "dup@agency.co", "password": "password123", "agency_name": "Dup"}
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


async def test_login_success(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@agency.co", "password": "password123", "agency_name": "L"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@agency.co", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["access_token"]


async def test_login_wrong_password_unauthorized(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wp@agency.co", "password": "password123", "agency_name": "W"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wp@agency.co", "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_protected_endpoint_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/clients")
    assert resp.status_code in (401, 403)


async def test_me_returns_current_user(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "owner@agency.co"
    assert body["role"] == "owner"
    assert body["agency_id"]


async def test_invalid_token_rejected(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert resp.status_code == 401


async def test_register_then_login_with_second_agency(
    client: AsyncClient, register: RegisterFn
) -> None:
    headers = await register(email="second@agency.co", agency="Second Agency")
    resp = await client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "second@agency.co"
