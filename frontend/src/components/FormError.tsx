import type { CSSProperties } from "react";

export const fieldLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 7,
};

export function FormError({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 12px",
        marginBottom: 14,
        borderRadius: "var(--radius-md)",
        background: "var(--negative-soft)",
        border: "1px solid #F0CFCC",
        color: "var(--red-700)",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  );
}
