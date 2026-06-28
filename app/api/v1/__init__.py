"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import admin, accounts, auth, clients, metrics, reports, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(clients.router)
api_router.include_router(accounts.router)
api_router.include_router(metrics.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
