import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { IconTrendingDown, IconTrendingUp } from "../Icons";
import { Skeleton } from "../Skeleton";
import { useCountUp } from "../../lib/useCountUp";
import type { Delta } from "../../lib/format";

interface StatCardProps {
  label: string;
  icon: ReactNode;
  value: number | null;
  formatValue: (n: number) => string;
  delta: Delta | null;
  accentIcon?: boolean;
  loading?: boolean;
  index?: number;
}

export function StatCard({
  label,
  icon,
  value,
  formatValue,
  delta,
  accentIcon = false,
  loading = false,
  index = 0,
}: StatCardProps) {
  const animated = useCountUp(value ?? 0, 1000);
  const display = value === null ? "—" : formatValue(animated);

  return (
    <motion.div
      className="cw-card cw-card-interactive"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
      style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "-.01em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: accentIcon ? "var(--accent-soft)" : "var(--surface-muted)",
            color: accentIcon ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <Skeleton width={120} height={36} radius="var(--radius-sm)" />
      ) : (
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 38,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {delta ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px 2px 5px",
              borderRadius: "var(--radius-full)",
              background: delta.up ? "var(--positive-soft)" : "var(--negative-soft)",
              color: delta.up ? "var(--positive)" : "var(--negative)",
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {delta.up ? (
              <IconTrendingUp size={13} strokeWidth={2.25} />
            ) : (
              <IconTrendingDown size={13} strokeWidth={2.25} />
            )}
            {delta.text}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
            Not enough history yet
          </span>
        )}
        {delta && (
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
            vs. period start
          </span>
        )}
      </div>
    </motion.div>
  );
}
