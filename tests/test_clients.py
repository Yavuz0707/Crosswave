"""Client CRUD + multi-tenant isolation tests."""

from __future__ import annotations

import uuid

from httpx import AsyncClient

from tests.conftest import RegisterFn


async def test_create_client(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/clients", json={"name": "Aurora Studio"}, headers=auth_headers
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Aurora Studio"
    assert body["agency_id"]

    listing = await client.get("/api/v1/clients", headers=auth_headers)
    assert any(c["id"] == body["id"] for c in listing.json())


async def test_clients_isolated_per_agency(
    client: AsyncClient, register: RegisterFn
) -> None:
    agency_a = await register(email="a@agency.co", agency="Agency A")
    agency_b = await register(email="b@agency.co", agency="Agency B")

    created = await client.post(
        "/api/v1/clients", json={"name": "A's Client"}, headers=agency_a
    )
    a_client_id = created.json()["id"]

    # Agency B must not see Agency A's client in its listing.
    b_listing = await client.get("/api/v1/clients", headers=agency_b)
    assert all(c["id"] != a_client_id for c in b_listing.json())

    # ...and must not be able to fetch it directly.
    b_fetch = await client.get(f"/api/v1/clients/{a_client_id}", headers=agency_b)
    assert b_fetch.status_code == 404

    # Agency A can still fetch its own client.
    a_fetch = await client.get(f"/api/v1/clients/{a_client_id}", headers=agency_a)
    assert a_fetch.status_code == 200


async def test_get_missing_client_404(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    resp = await client.get(f"/api/v1/clients/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


async def test_update_and_delete_client(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    created = await client.post(
        "/api/v1/clients", json={"name": "Old Name"}, headers=auth_headers
    )
    client_id = created.json()["id"]

    updated = await client.patch(
        f"/api/v1/clients/{client_id}", json={"name": "New Name"}, headers=auth_headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "New Name"

    deleted = await client.delete(
        f"/api/v1/clients/{client_id}", headers=auth_headers
    )
    assert deleted.status_code == 204

    gone = await client.get(f"/api/v1/clients/{client_id}", headers=auth_headers)
    assert gone.status_code == 404


async def test_cannot_modify_other_agency_client(
    client: AsyncClient, register: RegisterFn
) -> None:
    agency_a = await register(email="a2@agency.co", agency="A")
    agency_b = await register(email="b2@agency.co", agency="B")

    created = await client.post(
        "/api/v1/clients", json={"name": "A's Client"}, headers=agency_a
    )
    a_client_id = created.json()["id"]

    update = await client.patch(
        f"/api/v1/clients/{a_client_id}", json={"name": "hijacked"}, headers=agency_b
    )
    assert update.status_code == 404

    delete = await client.delete(
        f"/api/v1/clients/{a_client_id}", headers=agency_b
    )
    assert delete.status_code == 404
