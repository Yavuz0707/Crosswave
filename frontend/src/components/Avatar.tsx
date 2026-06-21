import { initials, pickSwatch } from "../lib/format";

interface AvatarProps {
  name: string;
  size?: number;
  fontSize?: number;
}

export function Avatar({ name, size = 32, fontSize }: AvatarProps) {
  const [fg, bg] = pickSwatch(name);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        borderRadius: "var(--radius-full)",
        background: bg,
        color: fg,
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: fontSize ?? Math.round(size * 0.4),
      }}
    >
      {initials(name)}
    </span>
  );
}
