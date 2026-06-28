"""matplotlib subscriber-growth chart rendered to a PNG byte buffer."""

from __future__ import annotations

from datetime import date


def generate_subscriber_chart(
    dates: list[date], counts: list[int], accent_hex: str = "#722F37"
) -> bytes:
    """Render an area+line chart of subscriber counts over time as PNG bytes.

    The result can be handed straight to reportlab's ``Image``.
    """
    import matplotlib

    matplotlib.use("Agg")  # headless backend
    import matplotlib.dates as mdates
    import matplotlib.pyplot as plt
    from io import BytesIO

    fig, ax = plt.subplots(figsize=(7, 3), dpi=150)
    fig.patch.set_facecolor("#FAF7F0")
    ax.set_facecolor("#FAF7F0")

    ax.fill_between(dates, counts, alpha=0.15, color=accent_hex)
    ax.plot(dates, counts, color=accent_hex, linewidth=2)

    locator = mdates.AutoDateLocator()
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
    plt.xticks(rotation=30, ha="right", fontsize=8)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"{int(x):,}"))
    ax.tick_params(axis="y", labelsize=8)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    buf = BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf.read()
