"""reportlab styles: Crosswave palette, fonts, and paragraph/table styles.

Fonts: the standard PDF font Helvetica cannot render Turkish glyphs (ş, ğ, ı, İ).
We therefore register the DejaVuSans TTF that ships *with matplotlib* (already a
dependency — no extra install or system font needed) and fall back to Helvetica
only if it is somehow unavailable.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---- Palette ----
PRIMARY = HexColor("#722F37")  # vine red
SECONDARY = HexColor("#FAF7F0")  # cream
DARK = HexColor("#2D2D2D")
LIGHT_GRAY = HexColor("#E8E4DC")
WHITE = HexColor("#FFFFFF")
MUTED = HexColor("#8A817C")

FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
_FONTS_REGISTERED = False


def register_fonts() -> None:
    """Register DejaVuSans (Turkish-capable) once; no-op on repeated calls."""
    global _FONTS_REGISTERED, FONT_REGULAR, FONT_BOLD
    if _FONTS_REGISTERED:
        return
    _FONTS_REGISTERED = True
    try:
        import matplotlib

        ttf = Path(matplotlib.get_data_path()) / "fonts" / "ttf"
        regular = ttf / "DejaVuSans.ttf"
        bold = ttf / "DejaVuSans-Bold.ttf"
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("DejaVuSans", str(regular)))
            pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", str(bold)))
            pdfmetrics.registerFontFamily(
                "DejaVuSans", normal="DejaVuSans", bold="DejaVuSans-Bold"
            )
            FONT_REGULAR = "DejaVuSans"
            FONT_BOLD = "DejaVuSans-Bold"
    except Exception:  # noqa: BLE001 - fall back to Helvetica on any issue
        pass


def parse_accent(hex_str: str | None) -> Color:
    """Return a reportlab Color from a hex string, defaulting to PRIMARY."""
    if hex_str:
        try:
            return HexColor(hex_str)
        except (ValueError, TypeError):
            pass
    return PRIMARY


def build_styles(accent: Color) -> dict[str, ParagraphStyle]:
    """Paragraph styles used across the report (accent threads the section color)."""
    register_fonts()
    return {
        "section": ParagraphStyle(
            "section", fontName=FONT_BOLD, fontSize=13, textColor=accent, spaceAfter=2
        ),
        "card_label": ParagraphStyle(
            "card_label", fontName=FONT_REGULAR, fontSize=9, textColor=MUTED
        ),
        "card_value": ParagraphStyle(
            "card_value", fontName=FONT_BOLD, fontSize=18, textColor=DARK, leading=22
        ),
        "body": ParagraphStyle(
            "body", fontName=FONT_REGULAR, fontSize=10, textColor=DARK, leading=14
        ),
        "muted": ParagraphStyle(
            "muted", fontName=FONT_REGULAR, fontSize=10, textColor=MUTED, leading=14
        ),
        "td": ParagraphStyle(
            "td", fontName=FONT_REGULAR, fontSize=8.5, textColor=DARK, leading=11
        ),
        "goal_label": ParagraphStyle(
            "goal_label", fontName=FONT_BOLD, fontSize=10, textColor=DARK, spaceAfter=3
        ),
    }
