import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { PageTransition } from "./PageTransition";

interface AuthLayoutProps {
  headline: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ headline, footer, children }: AuthLayoutProps) {
  return (
    <PageTransition>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div
          style={{
            width: "46%",
            flex: "none",
            background: "var(--accent)",
            color: "var(--cream-50)",
            padding: "56px 56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
          className="auth-left"
        >
          <span
            style={{
              position: "absolute",
              right: -120,
              bottom: -120,
              width: 360,
              height: 360,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.10)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: -60,
              bottom: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          />
          <div style={{ position: "relative" }}>
            <Logo size={34} onAccent />
          </div>
          <div style={{ position: "relative", maxWidth: 430 }}>{headline}</div>
          <div style={{ position: "relative" }}>{footer}</div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            background: "var(--bg-app)",
          }}
        >
          <div style={{ width: "100%", maxWidth: 384 }}>{children}</div>
        </div>
      </div>
    </PageTransition>
  );
}
