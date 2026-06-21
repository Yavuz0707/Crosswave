import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { fieldLabelStyle } from "../components/FormError";
import {
  IconArrowLeft,
  IconBell,
  IconCreditCard,
  IconLogOut,
  IconUser,
  IconUsers,
} from "../components/Icons";
import { PageTransition } from "../components/PageTransition";
import { useToast } from "../components/toast-context";
import { formatLongDate } from "../lib/format";

type Section = "profile" | "plan" | "notifications" | "team";

const NAV: { key: Section; label: string; icon: typeof IconUser }[] = [
  { key: "profile", label: "Profile", icon: IconUser },
  { key: "plan", label: "Plan & billing", icon: IconCreditCard },
  { key: "notifications", label: "Notifications", icon: IconBell },
  { key: "team", label: "Team", icon: IconUsers },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [section, setSection] = useState<Section>("profile");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--surface-card)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            type="button"
            className="cw-btn-secondary"
            style={{ height: 36, padding: "0 12px 0 8px", fontSize: 13 }}
            onClick={() => navigate("/")}
          >
            <IconArrowLeft size={17} />
            Back to dashboard
          </button>
          <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-.01em" }}>
            Settings
          </h1>
        </header>

        <div
          style={{
            display: "flex",
            maxWidth: 1080,
            width: "100%",
            margin: "0 auto",
            padding: 32,
            gap: 36,
            alignItems: "flex-start",
          }}
        >
          <nav
            style={{
              width: 212,
              flex: "none",
              display: "flex",
              flexDirection: "column",
              gap: 3,
              position: "sticky",
              top: 96,
            }}
          >
            {NAV.map((n) => {
              const active = n.key === section;
              const Icon = n.icon;
              return (
                <button
                  key={n.key}
                  type="button"
                  className="client-item"
                  onClick={() => setSection(n.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    width: "100%",
                    textAlign: "left",
                    height: 42,
                    padding: "0 14px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={17} color={active ? "var(--accent)" : "var(--text-muted)"} />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "profile" && (
              <ProfileSection
                email={user?.email ?? ""}
                role={user?.role ?? "member"}
                createdAt={user?.created_at ?? null}
                onLogout={handleLogout}
                onSave={() => toast.show("Profile editing isn't available yet.", "info")}
              />
            )}
            {section === "plan" && <PlanSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "team" && (
              <TeamSection
                email={user?.email ?? ""}
                role={user?.role ?? "member"}
                onInvite={() => toast.show("Inviting members isn't available yet.", "info")}
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

const cardStyle = {
  padding: 28,
} as const;

function ProfileSection({
  email,
  role,
  createdAt,
  onLogout,
  onSave,
}: {
  email: string;
  role: string;
  createdAt: string | null;
  onLogout: () => void;
  onSave: () => void;
}) {
  return (
    <div className="cw-card" style={cardStyle}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em" }}>
        Agency profile
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-muted)" }}>
        How your account appears across Crosswave.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          paddingBottom: 24,
          marginBottom: 24,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Avatar name={email || "Agency"} size={60} fontSize={22} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{email}</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "capitalize" }}>
            {role} · member since {formatLongDate(createdAt)}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <label style={fieldLabelStyle}>Contact email</label>
          <input className="cw-input" type="email" value={email} readOnly />
        </div>
        <div>
          <label style={fieldLabelStyle}>Role</label>
          <input className="cw-input" type="text" value={role} readOnly style={{ textTransform: "capitalize" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 26 }}>
        <button type="button" className="cw-btn-secondary" style={{ height: 42, padding: "0 16px", color: "var(--red-700)" }} onClick={onLogout}>
          <IconLogOut size={16} color="var(--red-700)" />
          Sign out
        </button>
        <button type="button" className="cw-btn-accent" style={{ height: 42, padding: "0 20px", fontSize: 14 }} onClick={onSave}>
          Save changes
        </button>
      </div>
    </div>
  );
}

function PlanSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          background: "var(--accent)",
          color: "var(--cream-50)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          padding: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600 }}>Starter plan</span>
            <span
              style={{
                height: 22,
                padding: "0 9px",
                borderRadius: "var(--radius-full)",
                background: "var(--gold)",
                color: "var(--bordeaux-900)",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              CURRENT
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,248,239,.8)" }}>
            Billing isn&apos;t configured for this workspace yet.
          </p>
        </div>
      </div>
      <div className="cw-card" style={{ padding: 24 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Subscription management and invoices will appear here once billing is
          enabled in a later release.
        </p>
      </div>
    </div>
  );
}

const NOTIF_DEFS = [
  { key: "weekly", label: "Weekly report email", desc: "A digest of every client's growth, each Monday." },
  { key: "growth", label: "Growth alerts", desc: "Notify me when a channel spikes or drops sharply." },
  { key: "comments", label: "New comments", desc: "When a client comments on a shared report." },
  { key: "billing", label: "Billing & receipts", desc: "Payment confirmations and renewal reminders." },
] as const;

function NotificationsSection() {
  const [state, setState] = useState<Record<string, boolean>>({
    weekly: true,
    growth: true,
    comments: false,
    billing: true,
  });
  return (
    <div className="cw-card" style={cardStyle}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em" }}>
        Notifications
      </h2>
      <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--text-muted)" }}>
        Preferences are saved locally for now (not yet synced to the server).
      </p>
      {NOTIF_DEFS.map((n, i) => {
        const on = state[n.key];
        return (
          <div
            key={n.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              padding: "16px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{n.label}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{n.desc}</span>
            </div>
            <button
              type="button"
              aria-label={`Toggle ${n.label}`}
              onClick={() => setState((s) => ({ ...s, [n.key]: !s[n.key] }))}
              style={{
                position: "relative",
                width: 44,
                height: 25,
                flex: "none",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: "pointer",
                background: on ? "var(--accent)" : "var(--cream-400)",
                transition: "background .15s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: on ? 22 : 3,
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "var(--shadow-sm)",
                  transition: "left .15s ease",
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TeamSection({
  email,
  role,
  onInvite,
}: {
  email: string;
  role: string;
  onInvite: () => void;
}) {
  return (
    <div className="cw-card" style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em" }}>
            Team members
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            People with access to your Crosswave workspace.
          </p>
        </div>
        <button type="button" className="cw-btn-accent" style={{ height: 38, padding: "0 16px", fontSize: 14 }} onClick={onInvite}>
          Invite member
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
        <Avatar name={email || "Member"} size={40} fontSize={15} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{email}</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>You</span>
        </div>
        <span
          style={{
            height: 24,
            padding: "0 11px",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--accent-soft-2)",
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            textTransform: "capitalize",
          }}
        >
          {role}
        </span>
      </div>
    </div>
  );
}
