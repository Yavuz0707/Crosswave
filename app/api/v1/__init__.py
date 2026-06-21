"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import accounts, auth, clients, metrics

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(clients.router)
api_router.include_router(accounts.router)
api_router.include_router(metrics.router)

__all__ = ["api_router"]
