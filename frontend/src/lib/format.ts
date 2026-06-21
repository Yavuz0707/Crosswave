/* Formatting + small presentational helpers ported from the design's logic. */

/** Compact number formatting: 1240000 -> "1.24M", 48200 -> "48.2K". */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs < 1000) return String(value);
  const units = [
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];
  for (const u of units) {
    if (abs >= u.v) {
      const n = value / u.v;
      const str = n >= 100 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");
      return `${str}${u.s}`;
    }
  }
  return String(value);
}

/** Full grouped number: 48200 -> "48,200". */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US");
}

/** "2026-06-14T..." -> "Jun 14". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "2026-06-14T..." -> "Jun 14, 2026". */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

/** Deterministic avatar swatch [foreground, background] from a name. */
const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ["#6D2932", "#FBF0F1"],
  ["#A6863F", "#FBF5E9"],
  ["#3F7D5B", "#EBF3ED"],
  ["#3E7A7A", "#E9F1F1"],
  ["#883A44", "#F4DDDF"],
  ["#A24E58", "#FBF0F1"],
  ["#9A6A21", "#FBF1E2"],
  ["#635A54", "#F5EEE2"],
];

export function pickSwatch(name: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
}

/** Thumbnail placeholder color from a string id (used when no thumbnail_url). */
export function pickThumbColor(seed: string): string {
  const palette = ["#6D2932", "#A6863F", "#3F7D5B", "#3E7A7A", "#542027", "#2B2422"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function parseEngagement(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? null : n;
}

export interface Delta {
  pct: number;
  up: boolean;
  text: string;
}

/** Percentage change between an earlier and later value. */
export function computeDelta(
  later: number | null,
  earlier: number | null,
): Delta | null {
  if (later === null || earlier === null || earlier === 0) return null;
  const pct = ((later - earlier) / earlier) * 100;
  const up = pct >= 0;
  return { pct, up, text: `${up ? "+" : ""}${pct.toFixed(1)}%` };
}
