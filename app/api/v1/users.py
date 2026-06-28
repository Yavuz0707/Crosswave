"""User management within the authenticated user's agency."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.user import User
from app.schemas.auth import UserRead

router = APIRouter(prefix="/users", tags=["users"])

_MANAGER_ROLES = {"owner", "admin"}


@router.get("", response_model=list[UserRead])
async def list_users(current_user: CurrentUser, db: DbSession) -> list[User]:
    """List all users in the caller's agency."""
    stmt = (
        select(User)
        .where(User.agency_id == current_user.agency_id)
        .order_by(User.created_at.asc())
    )
    return list((await db.execute(stmt)).scalars().all())


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> None:
    """Remove a user from the caller's agency (owners/admins only)."""
    if current_user.role not in _MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners or admins can remove users.",
        )
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    target = await db.get(User, user_id)
    if target is None or target.agency_id != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    await db.delete(target)
