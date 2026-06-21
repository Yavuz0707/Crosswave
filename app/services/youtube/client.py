"""Thin async wrapper around the YouTube Data API v3 (public data, API key).

Only the calls needed for Sprint 1 are implemented:
- ``channels.list``  -> channel snapshot (stats + uploads playlist)
- ``playlistItems.list`` + ``videos.list`` -> recent uploads with stats

No OAuth: every request is authenticated with a server-side API key.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings

# A YouTube channel id looks like "UC" + 22 url-safe base64 chars.
_CHANNEL_ID_RE = re.compile(r"^UC[0-9A-Za-z_-]{22}$")


class YouTubeAPIError(Exception):
    """Raised when the YouTube Data API call fails or is misconfigured."""


@dataclass(slots=True)
class YouTubeChannel:
    channel_id: str
    title: str
    subscriber_count: int | None
    view_count: int | None
    video_count: int | None
    uploads_playlist_id: str | None
    hidden_subscriber_count: bool = False


@dataclass(slots=True)
class YouTubeVideo:
    video_id: str
    title: str | None
    published_at: datetime | None
    thumbnail_url: str | None
    view_count: int | None
    like_count: int | None
    comment_count: int | None


def _to_int(value: Any) -> int | None:
    """YouTube returns numeric stats as strings; convert defensively."""
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        # API returns e.g. "2021-01-01T00:00:00Z".
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _best_thumbnail(thumbnails: dict[str, Any] | None) -> str | None:
    if not thumbnails:
        return None
    for key in ("maxres", "standard", "high", "medium", "default"):
        if key in thumbnails and thumbnails[key].get("url"):
            return thumbnails[key]["url"]
    return None


class YouTubeClient:
    """Async YouTube Data API v3 client.

    Use as an async context manager so the underlying HTTP connection pool is
    closed cleanly::

        async with YouTubeClient() as yt:
            channel = await yt.resolve_channel("@google")
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 15.0,
    ) -> None:
        self._api_key = api_key or settings.youtube_api_key
        self._base_url = (base_url or settings.youtube_api_base_url).rstrip("/")
        self._client = httpx.AsyncClient(timeout=timeout)

    async def __aenter__(self) -> "YouTubeClient":
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._client.aclose()

    # -- low level -----------------------------------------------------------
    async def _get(self, resource: str, params: dict[str, Any]) -> dict[str, Any]:
        if not self._api_key:
            raise YouTubeAPIError(
                "YOUTUBE_API_KEY is not configured; cannot call the YouTube API."
            )
        query = {**params, "key": self._api_key}
        try:
            resp = await self._client.get(f"{self._base_url}/{resource}", params=query)
        except httpx.HTTPError as exc:
            raise YouTubeAPIError(f"YouTube API request failed: {exc}") from exc

        if resp.status_code != httpx.codes.OK:
            detail = _extract_api_error(resp)
            raise YouTubeAPIError(
                f"YouTube API returned {resp.status_code}: {detail}"
            )
        return resp.json()

    # -- channels ------------------------------------------------------------
    async def get_channel(
        self,
        *,
        channel_id: str | None = None,
        handle: str | None = None,
        username: str | None = None,
    ) -> YouTubeChannel | None:
        """Fetch a single channel by id, @handle, or legacy username."""
        params: dict[str, Any] = {
            "part": "snippet,statistics,contentDetails",
        }
        if channel_id:
            params["id"] = channel_id
        elif handle:
            params["forHandle"] = handle if handle.startswith("@") else f"@{handle}"
        elif username:
            params["forUsername"] = username
        else:
            raise ValueError("One of channel_id, handle or username is required.")

        data = await self._get("channels", params)
        items = data.get("items") or []
        if not items:
            return None
        return _parse_channel(items[0])

    async def resolve_channel(self, raw: str) -> YouTubeChannel | None:
        """Resolve a free-form channel reference (id / @handle / username / URL)."""
        kind, value = _parse_channel_input(raw)
        if kind == "id":
            return await self.get_channel(channel_id=value)
        if kind == "handle":
            return await self.get_channel(handle=value)
        # "unknown": try handle first, then legacy username.
        channel = await self.get_channel(handle=value)
        if channel is None:
            channel = await self.get_channel(username=value)
        return channel

    # -- videos --------------------------------------------------------------
    async def get_recent_videos(
        self, uploads_playlist_id: str, max_results: int = 10
    ) -> list[YouTubeVideo]:
        """Return the most recent uploads (with statistics) for a channel."""
        if not uploads_playlist_id:
            return []
        max_results = max(1, min(max_results, 50))

        playlist = await self._get(
            "playlistItems",
            {
                "part": "contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": max_results,
            },
        )
        video_ids = [
            item["contentDetails"]["videoId"]
            for item in playlist.get("items", [])
            if item.get("contentDetails", {}).get("videoId")
        ]
        if not video_ids:
            return []

        videos_data = await self._get(
            "videos",
            {"part": "snippet,statistics", "id": ",".join(video_ids)},
        )
        return [_parse_video(item) for item in videos_data.get("items", [])]


def get_youtube_client() -> YouTubeClient:
    """Factory returning a configured client from app settings."""
    return YouTubeClient()


# --- parsing helpers --------------------------------------------------------
def _extract_api_error(resp: httpx.Response) -> str:
    try:
        body = resp.json()
        return body.get("error", {}).get("message", resp.text)
    except Exception:  # noqa: BLE001 - best-effort error extraction
        return resp.text


def _parse_channel(item: dict[str, Any]) -> YouTubeChannel:
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    content = item.get("contentDetails", {})
    uploads = content.get("relatedPlaylists", {}).get("uploads")
    return YouTubeChannel(
        channel_id=item["id"],
        title=snippet.get("title", ""),
        subscriber_count=_to_int(stats.get("subscriberCount")),
        view_count=_to_int(stats.get("viewCount")),
        video_count=_to_int(stats.get("videoCount")),
        uploads_playlist_id=uploads,
        hidden_subscriber_count=bool(stats.get("hiddenSubscriberCount", False)),
    )


def _parse_video(item: dict[str, Any]) -> YouTubeVideo:
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    return YouTubeVideo(
        video_id=item["id"],
        title=snippet.get("title"),
        published_at=_parse_published_at(snippet.get("publishedAt")),
        thumbnail_url=_best_thumbnail(snippet.get("thumbnails")),
        view_count=_to_int(stats.get("viewCount")),
        like_count=_to_int(stats.get("likeCount")),
        comment_count=_to_int(stats.get("commentCount")),
    )


def _parse_channel_input(raw: str) -> tuple[str, str]:
    """Classify a free-form channel reference.

    Returns a ``(kind, value)`` tuple where ``kind`` is one of
    ``"id"``, ``"handle"`` or ``"unknown"``.
    """
    value = raw.strip()

    # Full URL? Inspect the path.
    if "youtube.com" in value or "youtu.be" in value:
        path = urlparse(value).path.strip("/")
        segments = path.split("/")
        if segments:
            first = segments[0]
            if first == "channel" and len(segments) > 1:
                return "id", segments[1]
            if first in {"user", "c"} and len(segments) > 1:
                return "unknown", segments[1]
            if first.startswith("@"):
                return "handle", first
        return "unknown", value

    if value.startswith("@"):
        return "handle", value
    if _CHANNEL_ID_RE.match(value):
        return "id", value
    return "unknown", value
