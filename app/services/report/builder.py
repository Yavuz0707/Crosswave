"""Assemble the full PDF report from queried data (all in-memory)."""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import date, datetime

from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.services.report import styles as S
from app.services.report.chart import generate_subscriber_chart

A4_W, A4_H = A4
MARGIN = 40
FRAME_W = A4_W - 2 * MARGIN


@dataclass
class VideoRow:
    title: str
    published_at: date | None
    views: int | None
    likes: int | None
    comments: int | None


@dataclass
class GoalRow:
    label: str
    target: float
    actual: float | None
    pct: float | None


@dataclass
class ReportData:
    agency_name: str
    client_name: str
    channel_name: str
    period_start: date
    period_end: date
    generated_at: datetime
    metric_dates: list[date] = field(default_factory=list)
    metric_followers: list[int] = field(default_factory=list)
    summary_followers: int | None = None
    summary_views: int | None = None
    growth_pct: float | None = None
    top_videos: list[VideoRow] = field(default_factory=list)
    goals: list[GoalRow] = field(default_factory=list)
    accent_hex: str = "#722F37"
    agency_logo_url: str | None = None


# --- formatting helpers --------------------------------------------------
def _fmt_int(n: int | None) -> str:
    return "—" if n is None else f"{n:,}"


def _fmt_num(n: float | None) -> str:
    if n is None:
        return "—"
    if float(n).is_integer():
        return f"{int(n):,}"
    return f"{n:,.2f}"


def _fmt_date(d: date | None) -> str:
    return d.strftime("%d.%m.%Y") if d else "—"


def _trunc(text: str | None, limit: int = 60, fallback: str = "Başlıksız") -> str:
    text = (text or "").strip() or fallback
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


# --- flowable builders ---------------------------------------------------
def _section(title: str, st: dict, accent: Color) -> list:
    return [
        Spacer(1, 4),
        Paragraph(title, st["section"]),
        HRFlowable(width="100%", thickness=1, color=accent, spaceBefore=2, spaceAfter=8),
    ]


def _summary_cards(data: ReportData, st: dict, accent: Color) -> Table:
    gap = 14
    card_w = (FRAME_W - 2 * gap) / 3
    growth = (
        "Veri yetersiz"
        if data.growth_pct is None
        else f"{data.growth_pct:+.1f}%"
    )
    specs = [
        ("Toplam abone", _fmt_int(data.summary_followers)),
        ("Toplam görüntülenme", _fmt_int(data.summary_views)),
        ("Dönem büyümesi", growth),
    ]

    def card(label: str, value: str) -> Table:
        inner = Table(
            [[""], [Paragraph(label, st["card_label"])], [Paragraph(value, st["card_value"])]],
            colWidths=[card_w],
            rowHeights=[6, 16, 32],
        )
        inner.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), accent),
                    ("BACKGROUND", (0, 1), (0, 2), S.WHITE),
                    ("BOX", (0, 0), (-1, -1), 0.5, S.LIGHT_GRAY),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (0, 0), 0),
                    ("BOTTOMPADDING", (0, 0), (0, 0), 0),
                    ("TOPPADDING", (0, 1), (0, 1), 9),
                    ("BOTTOMPADDING", (0, 1), (0, 1), 2),
                    ("TOPPADDING", (0, 2), (0, 2), 0),
                    ("BOTTOMPADDING", (0, 2), (0, 2), 10),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        return inner

    cards = [card(label, value) for label, value in specs]
    outer = Table(
        [[cards[0], "", cards[1], "", cards[2]]],
        colWidths=[card_w, gap, card_w, gap, card_w],
    )
    outer.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return outer


def _chart_flowable(data: ReportData, st: dict):
    if len(data.metric_dates) < 2:
        return Paragraph("Bu dönem için grafik verisi yetersiz.", st["muted"])
    png = generate_subscriber_chart(
        data.metric_dates, data.metric_followers, data.accent_hex
    )
    from PIL import Image as PILImage

    with PILImage.open(io.BytesIO(png)) as im:
        ratio = im.height / im.width
    img = Image(io.BytesIO(png), width=FRAME_W, height=FRAME_W * ratio)
    img.hAlign = "CENTER"
    return img


def _video_table(data: ReportData, st: dict, accent: Color):
    if not data.top_videos:
        return Paragraph("Bu dönemde yayınlanmış içerik bulunamadı.", st["muted"])

    header = ["Video", "Yayın", "Görüntülenme", "Beğeni", "Yorum"]
    body = [
        [
            Paragraph(_trunc(v.title), st["td"]),
            _fmt_date(v.published_at),
            _fmt_int(v.views),
            _fmt_int(v.likes),
            _fmt_int(v.comments),
        ]
        for v in data.top_videos
    ]
    table = Table(
        [header, *body],
        colWidths=[215, 70, 90, 70, 70],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), accent),
                ("TEXTCOLOR", (0, 0), (-1, 0), S.WHITE),
                ("FONTNAME", (0, 0), (-1, 0), S.FONT_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), S.FONT_REGULAR),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [S.WHITE, S.SECONDARY]),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, S.LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.4, S.LIGHT_GRAY),
            ]
        )
    )
    return table


def _goal_block(goal: GoalRow, st: dict, accent: Color):
    clamped = 0.0 if goal.pct is None else max(0.0, min(goal.pct, 100.0)) / 100.0
    bar = Drawing(FRAME_W, 20)
    bar.add(Rect(0, 3, FRAME_W, 14, fillColor=S.LIGHT_GRAY, strokeColor=None))
    if clamped > 0:
        bar.add(Rect(0, 3, FRAME_W * clamped, 14, fillColor=accent, strokeColor=None))
    pct_text = "Veri yok" if goal.pct is None else f"%{goal.pct:.0f}"
    label = f"{_fmt_num(goal.actual)} / {_fmt_num(goal.target)} ({pct_text})"
    bar.add(
        String(
            FRAME_W / 2,
            6,
            label,
            textAnchor="middle",
            fontName=S.FONT_BOLD,
            fontSize=8.5,
            fillColor=S.DARK,
        )
    )
    return KeepTogether([Paragraph(goal.label, st["goal_label"]), bar])


# --- page furniture (canvas) ---------------------------------------------
def _draw_cover(canvas, _doc, data: ReportData, accent: Color) -> None:
    w, h = A4_W, A4_H

    canvas.setFillColor(accent)
    canvas.rect(0, h - 170, w, 170, fill=1, stroke=0)
    canvas.setFillColor(S.WHITE)
    canvas.setFont(S.FONT_BOLD, 13)
    canvas.drawString(MARGIN, h - 48, "CROSSWAVE")
    canvas.setFont(S.FONT_BOLD, 28)
    canvas.drawString(MARGIN, h - 100, _trunc(data.agency_name, 30, "Crosswave"))
    canvas.setFillColor(S.SECONDARY)
    canvas.setFont(S.FONT_REGULAR, 13)
    canvas.drawString(MARGIN, h - 128, "Performans Raporu")

    # Cream detail panel
    canvas.setFillColor(S.SECONDARY)
    canvas.rect(0, 250, w, 248, fill=1, stroke=0)
    canvas.setFillColor(accent)
    canvas.rect(0, 498, w, 3, fill=1, stroke=0)

    rows = [
        ("MÜŞTERİ", data.client_name),
        ("YOUTUBE KANALI", data.channel_name),
        (
            "RAPOR DÖNEMİ",
            f"{_fmt_date(data.period_start)} – {_fmt_date(data.period_end)}",
        ),
        ("OLUŞTURULMA", _fmt_date(data.generated_at.date())),
    ]
    y = 458
    for label, value in rows:
        canvas.setFont(S.FONT_REGULAR, 9)
        canvas.setFillColor(S.MUTED)
        canvas.drawString(MARGIN, y, label)
        canvas.setFont(S.FONT_BOLD, 16)
        canvas.setFillColor(S.DARK)
        canvas.drawString(MARGIN, y - 20, _trunc(value, 48, "—"))
        y -= 56

    canvas.setFillColor(accent)
    canvas.rect(MARGIN, 80, w - 2 * MARGIN, 2.5, fill=1, stroke=0)
    canvas.setFillColor(S.MUTED)
    canvas.setFont(S.FONT_REGULAR, 9)
    canvas.drawString(MARGIN, 64, "Crosswave · Sosyal medya analitiği")


def _draw_header_footer(canvas, doc, accent: Color) -> None:
    w, h = A4_W, A4_H
    canvas.setFillColor(accent)
    canvas.setFont(S.FONT_BOLD, 8)
    canvas.drawString(MARGIN, h - 32, "CROSSWAVE")
    canvas.setStrokeColor(S.LIGHT_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, h - 38, w - MARGIN, h - 38)
    canvas.setFillColor(S.MUTED)
    canvas.setFont(S.FONT_REGULAR, 8)
    canvas.drawRightString(w - MARGIN, 28, str(doc.page))


def build_pdf(data: ReportData) -> bytes:
    """Render the report to PDF bytes."""
    S.register_fonts()
    accent = S.parse_accent(data.accent_hex)
    st = S.build_styles(accent)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=58,
        bottomMargin=46,
        title=f"Crosswave — {data.client_name}",
        author="Crosswave",
    )

    story: list = [Spacer(1, 2), PageBreak()]  # page 1 = canvas cover

    story += _section("Özet", st, accent)
    story.append(_summary_cards(data, st, accent))
    story.append(Spacer(1, 16))

    story += _section("Büyüme grafiği", st, accent)
    story.append(_chart_flowable(data, st))
    story.append(Spacer(1, 16))

    story += _section("En iyi performans gösteren videolar", st, accent)
    story.append(_video_table(data, st, accent))

    if data.goals:
        story.append(Spacer(1, 16))
        story += _section("Hedef vs gerçekleşen", st, accent)
        for goal in data.goals:
            story.append(_goal_block(goal, st, accent))
            story.append(Spacer(1, 8))

    doc.build(
        story,
        onFirstPage=lambda c, d: _draw_cover(c, d, data, accent),
        onLaterPages=lambda c, d: _draw_header_footer(c, d, accent),
    )
    return buf.getvalue()
