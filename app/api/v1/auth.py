"""Authentication endpoints: register, login, current user."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models.agency import Agency
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DbSession) -> Token:
    """Create a new agency and its first (owner) user, returning an access token."""
    email = payload.email.lower()

    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    agency = Agency(name=payload.agency_name)
    db.add(agency)
    await db.flush()  # populate agency.id

    user = User(
        agency_id=agency.id,
        email=email,
        password_hash=hash_password(payload.password),
        role="owner",
    )
    db.add(user)
    await db.flush()  # populate user.id

    token = create_access_token(user.id)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: DbSession) -> Token:
    """Authenticate with email + password and return a JWT access token."""
    email = payload.email.lower()
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
async def read_me(current_user: CurrentUser) -> User:
    """Return the currently authenticated user."""
    return current_user
