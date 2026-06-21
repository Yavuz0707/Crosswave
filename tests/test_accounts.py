"""Connected account endpoint tests (YouTube calls are mocked)."""

from __future__ import annotations

import uuid

from httpx import AsyncClient

from tests.conftest import FakeYouTubeClient, RegisterFn


async def _create_client(client: AsyncClient, headers: dict[str, str]) -> str:
    resp = await client.post(
        "/api/v1/clients", json={"name": "Aurora Studio"}, headers=headers
    )
    return resp.json()["id"]


async def test_connect_account(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    client_id = await _create_client(client, auth_headers)
    resp = await client.post(
        "/api/v1/accounts",
        json={"client_id": client_id, "channel": "@aurorastudio"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["external_account_id"] == "UCtest00000000000000001"
    assert body["display_name"] == "Aurora Studio"
    assert body["client_id"] == client_id
    assert body["status"] == "active"


async def test_connect_duplicate_channel_conflicts(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    client_id = await _create_client(client, auth_headers)
    payload = {"client_id": client_id, "channel": "@aurorastudio"}
    first = await client.post("/api/v1/accounts", json=payload, headers=auth_headers)
    assert first.status_code == 201
    second = await client.post("/api/v1/accounts", json=payload, headers=auth_headers)
    assert second.status_code == 409


async def test_connect_unknown_client_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    resp = await client.post(
        "/api/v1/accounts",
        json={"client_id": str(uuid.uuid4()), "channel": "@x"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_connect_channel_not_found_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    client_id = await _create_client(client, auth_headers)
    resp = await client.post(
        "/api/v1/accounts",
        json={"client_id": client_id, "channel": "__missing__"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_list_get_delete_account(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    client_id = await _create_client(client, auth_headers)
    created = await client.post(
        "/api/v1/accounts",
        json={"client_id": client_id, "channel": "@a"},
        headers=auth_headers,
    )
    account_id = created.json()["id"]

    listing = await client.get("/api/v1/accounts", headers=auth_headers)
    assert any(a["id"] == account_id for a in listing.json())

    filtered = await client.get(
        f"/api/v1/accounts?client_id={client_id}", headers=auth_headers
    )
    assert len(filtered.json()) == 1

    fetched = await client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert fetched.status_code == 200

    deleted = await client.delete(
        f"/api/v1/accounts/{account_id}", headers=auth_headers
    )
    assert deleted.status_code == 204

    gone = await client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert gone.status_code == 404


async def test_account_isolated_per_agency(
    client: AsyncClient,
    register: RegisterFn,
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    agency_a = await register(email="a3@agency.co", agency="A")
    agency_b = await register(email="b3@agency.co", agency="B")

    client_id = await _create_client(client, agency_a)
    created = await client.post(
        "/api/v1/accounts",
        json={"client_id": client_id, "channel": "@a"},
        headers=agency_a,
    )
    account_id = created.json()["id"]

    resp = await client.get(f"/api/v1/accounts/{account_id}", headers=agency_b)
    assert resp.status_code == 404
