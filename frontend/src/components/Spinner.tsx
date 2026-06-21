interface SpinnerProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Spinner({
  size = 18,
  color = "currentColor",
  strokeWidth = 2.2,
}: SpinnerProps) {
  return (
    <svg
      className="cw-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeOpacity="0.22"
        strokeWidth={strokeWidth}
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
