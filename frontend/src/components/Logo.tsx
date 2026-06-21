interface LogoMarkProps {
  size?: number;
  onAccent?: boolean;
}

export function LogoMark({ size = 32, onAccent = false }: LogoMarkProps) {
  const rectFill = onAccent ? "#FFF8EF" : "var(--accent)";
  const leafFill = onAccent ? "var(--accent)" : "#FFF8EF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ display: "block" }}
    >
      <rect width="32" height="32" rx="9" fill={rectFill} />
      <path
        d="M16 25C16 17.5 12 12.5 7.5 10.2C13.2 9.6 16 12.2 16 12.2C16 12.2 17.6 6.6 24 5C22 12.6 19.8 18.4 16 25Z"
        fill={leafFill}
      />
      <path
        d="M16 25C16 20 17.2 15.5 20 11.8"
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  onAccent?: boolean;
  subtitle?: string;
  color?: string;
}

export function Logo({ size = 32, onAccent = false, subtitle, color }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <LogoMark size={size} onAccent={onAccent} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: size * 0.69,
            fontWeight: 600,
            letterSpacing: ".01em",
            color: color ?? (onAccent ? "var(--cream-50)" : "var(--ink-900)"),
          }}
        >
          Crosswave
        </span>
        {subtitle && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
