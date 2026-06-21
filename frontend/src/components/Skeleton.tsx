import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = "var(--radius-sm)",
  style,
}: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
