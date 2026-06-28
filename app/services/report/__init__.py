"""PDF report generation (reportlab + matplotlib)."""

from app.services.report.builder import (
    GoalRow,
    ReportData,
    VideoRow,
    build_pdf,
)

__all__ = ["build_pdf", "ReportData", "VideoRow", "GoalRow"]
