"""Development-only admin utilities."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.scheduler import run_active_sync

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/sync-all")
async def sync_all(current_user: CurrentUser, db: DbSession) -> dict[str, object]:
    """Trigger an immediate sync of all active accounts.

    Enabled only in development (returns 403 otherwise) — handy for populating
    data without waiting for the nightly job.
    """
    if settings.app_env.lower() != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development.",
        )
    result = await run_active_sync(db)
    return {"message": "Sync completed.", **result}
