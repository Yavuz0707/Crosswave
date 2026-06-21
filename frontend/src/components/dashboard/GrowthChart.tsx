import { motion } from "framer-motion";
import { formatShortDate } from "../../lib/format";
import { IconTrendingUp } from "../Icons";

export interface ChartPoint {
  date: string;
  subs: number | null;
  views: number | null;
}

const W = 1000;
const H = 360;
const PAD = 18;
const BASELINE = H - PAD; // 342

function buildPath(values: number[]): string {
  const n = values.length;
  if (n < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (W - PAD * 2) / (n - 1);
  return values
    .map((v, i) => {
      const x = PAD + i * step;
      const y = BASELINE - ((v - min) / span) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function pickLabels(points: ChartPoint[], max = 5): string[] {
  if (points.length === 0) return [];
  if (points.length <= max) return points.map((p) => formatShortDate(p.date));
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i * (points.length - 1)) / (max - 1));
    out.push(formatShortDate(points[idx].date));
  }
  return out;
}

interface GrowthChartProps {
  points: ChartPoint[];
  showViews?: boolean;
}

export function GrowthChart({ points, showViews = true }: GrowthChartProps) {
  const subsValues = points
    .map((p) => p.subs)
    .filter((v): v is number => v !== null);
  const viewValues = points
    .map((p) => p.views)
    .filter((v): v is number => v !== null);

  const linePath = buildPath(subsValues);
  const areaPath = linePath
    ? `${linePath} L${(W - PAD).toFixed(1)} ${BASELINE} L${PAD.toFixed(1)} ${BASELINE} Z`
    : "";
  const secPath = showViews ? buildPath(viewValues) : "";
  const labels = pickLabels(points);

  const drawable = subsValues.length >= 2;

  return (
    <div className="cw-card" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em" }}>
          Subscriber &amp; view growth
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: "var(--accent)" }} />
            Subscribers
          </span>
          {showViews && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, borderRadius: 2, background: "var(--gold)" }} />
              Views
            </span>
          )}
        </div>
      </div>

      {drawable ? (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="260"
            preserveAspectRatio="none"
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="cwArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[99, 180, 261].map((y) => (
              <line
                key={y}
                x1="18"
                x2="982"
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="2 5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <motion.path
              d={areaPath}
              fill="url(#cwArea)"
              stroke="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            />
            {secPath && (
              <motion.path
                d={secPath}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: "easeInOut", delay: 0.15 }}
              />
            )}
            <motion.path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          </svg>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              padding: "0 2px",
              fontSize: 12,
              color: "var(--text-faint)",
            }}
          >
            {labels.map((l, i) => (
              <span key={`${l}-${i}`}>{l}</span>
            ))}
          </div>
        </>
      ) : (
        <div
          style={{
            height: 260,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              background: "var(--surface-muted)",
              color: "var(--text-faint)",
            }}
          >
            <IconTrendingUp size={22} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
            Not enough history to chart yet
          </span>
          <span style={{ fontSize: 13, maxWidth: 340 }}>
            Sync this channel on at least two different days to see growth trends.
          </span>
        </div>
      )}
    </div>
  );
}
