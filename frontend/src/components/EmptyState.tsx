import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: EmptyStateProps) {
  const iconBg = tone === "error" ? "var(--negative-soft)" : "var(--surface-muted)";
  const iconColor = tone === "error" ? "var(--negative)" : "var(--text-muted)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 14,
        padding: "48px 24px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "var(--radius-full)",
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 380 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-.01em",
          }}
        >
          {title}
        </h3>
        {description && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
