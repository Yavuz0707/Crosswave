import type { CSSProperties, ReactNode } from "react";
import type { ContentItem } from "../../api/types";
import { formatCompact, formatShortDate, pickThumbColor } from "../../lib/format";
import { IconComment, IconEye, IconHeart, IconPlay } from "../Icons";

const th: CSSProperties = {
  paddingBottom: 12,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
  whiteSpace: "nowrap",
};

function Thumb({ item, w = 68, h = 42 }: { item: ContentItem; w?: number; h?: number }) {
  return (
    <span
      style={{
        position: "relative",
        width: w,
        height: h,
        flex: "none",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        background: item.thumbnail_url
          ? `center / cover no-repeat url(${item.thumbnail_url})`
          : pickThumbColor(item.id),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
      }}
    >
      {!item.thumbnail_url && (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,.92)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconPlay size={11} />
        </span>
      )}
    </span>
  );
}

function Metric({
  icon,
  value,
}: {
  icon: ReactNode;
  value: number | null;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "flex-end",
        fontVariantNumeric: "tabular-nums",
        fontSize: 14,
        color: "var(--text-secondary)",
      }}
    >
      {icon}
      {formatCompact(value)}
    </span>
  );
}

export function ContentTable({ items }: { items: ContentItem[] }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left", paddingRight: 16, paddingLeft: 4 }}>Content</th>
            <th style={{ ...th, textAlign: "right", padding: "0 16px 12px" }}>Views</th>
            <th style={{ ...th, textAlign: "right", padding: "0 16px 12px" }}>Likes</th>
            <th style={{ ...th, textAlign: "right", padding: "0 16px 12px" }}>Comments</th>
            <th style={{ ...th, textAlign: "left", padding: "0 16px 12px" }}>Published</th>
            <th style={{ ...th, textAlign: "right", paddingLeft: 16, paddingRight: 4 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const m = item.latest_metrics;
            return (
              <tr key={item.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "14px 16px 14px 4px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <Thumb item={item} />
                    <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          letterSpacing: "-.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 340,
                        }}
                      >
                        {item.title ?? "Untitled"}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "capitalize" }}>
                        {item.content_type}
                      </span>
                    </span>
                  </span>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <Metric icon={<IconEye size={15} color="var(--text-faint)" />} value={m?.views ?? null} />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <Metric icon={<IconHeart size={15} color="var(--text-faint)" />} value={m?.likes ?? null} />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <Metric icon={<IconComment size={15} color="var(--text-faint)" />} value={m?.comments ?? null} />
                </td>
                <td style={{ padding: "14px 16px", fontSize: 14, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatShortDate(item.published_at)}
                </td>
                <td style={{ padding: "14px 4px 14px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 24,
                      padding: "0 10px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--positive-soft)",
                      color: "var(--green-700)",
                      border: "1px solid #CFE3D6",
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-500)" }} />
                    Published
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
