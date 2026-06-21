"""SQLAlchemy models.

Importing every model here ensures they are all registered on ``Base.metadata``
before Alembic autogenerate or ``create_all`` runs.
"""

from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.agency import Agency
from app.models.base import Base
from app.models.client import Client
from app.models.connected_account import ConnectedAccount
from app.models.content_item import ContentItem
from app.models.content_metrics import ContentMetrics
from app.models.goal import Goal
from app.models.platform import PLATFORM_YOUTUBE, Platform
from app.models.report import Report
from app.models.user import User

__all__ = [
    "Base",
    "Agency",
    "User",
    "Client",
    "Platform",
    "PLATFORM_YOUTUBE",
    "ConnectedAccount",
    "AccountMetricsDaily",
    "ContentItem",
    "ContentMetrics",
    "Goal",
    "Report",
]
