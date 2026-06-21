import type { ReactNode } from "react";
import type { ContentItem } from "../../api/types";
import { formatCompact, formatShortDate, pickThumbColor } from "../../lib/format";
import { IconComment, IconEye, IconHeart, IconPlay } from "../Icons";

function CardThumb({ item }: { item: ContentItem }) {
  return (
    <div
      style={{
        position: "relative",
        height: 128,
        background: item.thumbnail_url
          ? `center / cover no-repeat url(${item.thumbnail_url})`
          : pickThumbColor(item.id),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!item.thumbnail_url && (
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,.9)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconPlay size={18} />
        </span>
      )}
    </div>
  );
}

export function ContentCards({ items }: { items: ContentItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {items.map((item) => {
        const m = item.latest_metrics;
        return (
          <div
            key={item.id}
            className="cw-card cw-card-interactive"
            style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <CardThumb item={item} />
            <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.35,
                  letterSpacing: "-.01em",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.title ?? "Untitled"}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  height: 22,
                  padding: "0 9px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--positive-soft)",
                  color: "var(--green-700)",
                  border: "1px solid #CFE3D6",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green-500)" }} />
                Published · {formatShortDate(item.published_at)}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <CardMetric icon={<IconEye size={14} color="var(--text-faint)" />} value={m?.views ?? null} />
                <CardMetric icon={<IconHeart size={14} color="var(--text-faint)" />} value={m?.likes ?? null} />
                <CardMetric icon={<IconComment size={14} color="var(--text-faint)" />} value={m?.comments ?? null} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardMetric({ icon, value }: { icon: ReactNode; value: number | null }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        color: "var(--text-secondary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {icon}
      {formatCompact(value)}
    </span>
  );
}
