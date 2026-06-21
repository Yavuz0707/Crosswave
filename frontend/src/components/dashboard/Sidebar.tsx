import type { ReactNode } from "react";
import type { Client, User } from "../../api/types";
import { formatShortDate } from "../../lib/format";
import { Avatar } from "../Avatar";
import {
  IconInstagram,
  IconPlus,
  IconSearch,
  IconSliders,
  IconTikTok,
  IconYouTube,
} from "../Icons";
import { Logo } from "../Logo";
import { Skeleton } from "../Skeleton";

interface SidebarProps {
  clients: Client[];
  loading: boolean;
  selectedId: string | null;
  query: string;
  user: User | null;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onAddClient: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  clients,
  loading,
  selectedId,
  query,
  user,
  onQueryChange,
  onSelect,
  onAddClient,
  onOpenSettings,
}: SidebarProps) {
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        flex: "none",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "20px 18px 16px" }}>
        <Logo size={32} subtitle="Agency" />
      </div>

      <div style={{ padding: "0 14px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 10px",
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <IconSearch size={15} color="var(--text-faint)" />
          <input
            type="text"
            placeholder="Search clients"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 18px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          Clients
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-faint)",
            background: "var(--surface-muted)",
            borderRadius: "var(--radius-full)",
            padding: "2px 8px",
          }}
        >
          {loading ? "…" : clients.length}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2px 10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 10px" }}>
              <Skeleton width={32} height={32} radius="var(--radius-full)" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width="70%" height={12} />
                <Skeleton width="45%" height={10} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p style={{ padding: "16px 12px", fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
            {clients.length === 0 ? "No clients yet." : "No clients match your search."}
          </p>
        ) : (
          filtered.map((c) => {
            const selected = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                className="client-item"
                onClick={() => onSelect(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  background: selected ? "var(--accent-soft)" : "transparent",
                  boxShadow: selected ? "inset 0 0 0 1px var(--accent-soft-2)" : "none",
                }}
              >
                {selected && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 9,
                      bottom: 9,
                      width: 3,
                      borderRadius: 3,
                      background: "var(--accent)",
                    }}
                  />
                )}
                <Avatar name={c.name} size={32} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: selected ? 600 : 500,
                      color: selected ? "var(--accent)" : "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-faint)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Added {formatShortDate(c.created_at)}
                  </span>
                </span>
                <IconYouTube size={14} color="var(--yt-red)" />
              </button>
            );
          })
        )}
      </div>

      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <button
          type="button"
          className="cw-btn-secondary"
          onClick={onAddClient}
          style={{ width: "100%", height: 38, background: "var(--surface-muted)" }}
        >
          <IconPlus size={16} />
          Add client
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingLeft: 2 }}>
          <SoonPill icon={<IconInstagram size={13} />} label="Instagram · soon" bg="#FBEDF5" color="#B5377F" />
          <SoonPill icon={<IconTikTok size={13} />} label="TikTok · soon" bg="#F0EEEE" color="#1F1F1F" />
        </div>
      </div>

      <button
        type="button"
        className="client-item"
        onClick={onOpenSettings}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          border: "none",
          borderTop: "1px solid var(--border-subtle)",
          background: "transparent",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <Avatar name={user?.email ?? "Agency"} size={32} />
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.email ?? "Workspace"}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "capitalize" }}>
            Agency · {user?.role ?? "member"}
          </span>
        </span>
        <IconSliders size={17} color="var(--text-faint)" />
      </button>
    </aside>
  );
}

function SoonPill({
  icon,
  label,
  bg,
  color,
}: {
  icon: ReactNode;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 9px 0 7px",
        borderRadius: "var(--radius-full)",
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        opacity: 0.6,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
