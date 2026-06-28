import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { connectAccount, listAccounts, syncAccount } from "../api/accounts";
import { createClient, listClients } from "../api/clients";
import { extractErrorMessage } from "../api/client";
import { getAccountContent, getAccountMetrics } from "../api/metrics";
import { generateReport } from "../api/reports";
import type {
  AccountMetricsDaily,
  Client,
  ConnectedAccount,
  ContentItem,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { FormModal } from "../components/Modal";
import { PageTransition } from "../components/PageTransition";
import { Skeleton } from "../components/Skeleton";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/toast-context";
import { ContentCards } from "../components/dashboard/ContentCards";
import { ContentTable } from "../components/dashboard/ContentTable";
import { GrowthChart, type ChartPoint } from "../components/dashboard/GrowthChart";
import { Sidebar } from "../components/dashboard/Sidebar";
import { StatCard } from "../components/dashboard/StatCard";
import {
  IconAlert,
  IconBell,
  IconCalendar,
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconEye,
  IconFileText,
  IconInbox,
  IconLink,
  IconRefresh,
  IconTrendingUp,
  IconUsers,
  IconYouTube,
} from "../components/Icons";
import {
  computeDelta,
  formatCompact,
  type Delta,
} from "../lib/format";

type TabKey = "overview" | "content" | "audience" | "reports";
type RangeKey = "7" | "30" | "90";
type ContentFilter = "all" | "published" | "scheduled" | "draft";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "content", label: "Content" },
  { key: "audience", label: "Audience" },
  { key: "reports", label: "Reports" },
];

function withinRange(metrics: AccountMetricsDaily[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return metrics
    .filter((m) => new Date(m.captured_date) >= cutoff)
    .sort(
      (a, b) =>
        new Date(a.captured_date).getTime() - new Date(b.captured_date).getTime(),
    );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // ---- clients ----
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // ---- accounts + data for the selected client ----
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AccountMetricsDaily[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // ---- ui ----
  const [tab, setTab] = useState<TabKey>("overview");
  const [range, setRange] = useState<RangeKey>("30");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [syncing, setSyncing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const primaryAccount = accounts[0] ?? null;

  // ---- load clients on mount ----
  useEffect(() => {
    let active = true;
    setClientsLoading(true);
    listClients()
      .then((data) => {
        if (!active) return;
        setClients(data);
        setSelectedClientId((prev) => prev ?? data[0]?.id ?? null);
      })
      .catch((err) => {
        if (active) toast.show(extractErrorMessage(err), "error");
      })
      .finally(() => {
        if (active) setClientsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  // ---- load accounts whenever the selected client changes ----
  useEffect(() => {
    if (!selectedClientId) {
      setAccounts([]);
      return;
    }
    let active = true;
    setAccountsLoading(true);
    setMetrics([]);
    setContent([]);
    setTab("overview");
    listAccounts(selectedClientId)
      .then((data) => {
        if (active) setAccounts(data);
      })
      .catch((err) => {
        if (active) toast.show(extractErrorMessage(err), "error");
      })
      .finally(() => {
        if (active) setAccountsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedClientId, toast]);

  // ---- load metrics + content whenever the primary account changes ----
  const loadAccountData = useCallback(
    async (accountId: string) => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [m, c] = await Promise.all([
          getAccountMetrics(accountId, 90),
          getAccountContent(accountId, 50),
        ]);
        setMetrics(m);
        setContent(c);
      } catch (err) {
        setDataError(extractErrorMessage(err));
      } finally {
        setDataLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!primaryAccount) return;
    void loadAccountData(primaryAccount.id);
  }, [primaryAccount, loadAccountData]);

  // ---- derived metric values ----
  const rangedMetrics = useMemo(
    () => withinRange(metrics, Number(range)),
    [metrics, range],
  );

  const stats = useMemo(() => {
    const series = rangedMetrics.length >= 1 ? rangedMetrics : metrics;
    if (series.length === 0) {
      return {
        subs: null as number | null,
        views: null as number | null,
        growth: null as number | null,
        subsDelta: null as Delta | null,
        viewsDelta: null as Delta | null,
        growthDelta: null as Delta | null,
      };
    }
    const first = series[0];
    const last = series[series.length - 1];
    const subs = last.followers_count;
    const views = last.views_count;
    const growth =
      subs !== null && first.followers_count !== null
        ? subs - first.followers_count
        : null;
    return {
      subs,
      views,
      growth,
      subsDelta: computeDelta(subs, first.followers_count),
      viewsDelta: computeDelta(views, first.views_count),
      growthDelta: computeDelta(subs, first.followers_count),
    };
  }, [rangedMetrics, metrics]);

  const chartPoints: ChartPoint[] = useMemo(
    () =>
      rangedMetrics.map((m) => ({
        date: m.captured_date,
        subs: m.followers_count,
        views: m.views_count,
      })),
    [rangedMetrics],
  );

  const filteredContent = useMemo(() => {
    // The public YouTube API only yields published videos, so every synced
    // item is treated as "published". Other filters intentionally show empty.
    if (contentFilter === "all" || contentFilter === "published") return content;
    return [];
  }, [content, contentFilter]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  // ---- handlers ----
  const handleAddClient = useCallback(
    async (name: string) => {
      try {
        const created = await createClient({ name });
        setClients((prev) => [created, ...prev]);
        setSelectedClientId(created.id);
        toast.show(`Client "${created.name}" added.`, "success");
      } catch (err) {
        throw new Error(extractErrorMessage(err, "Could not create client."));
      }
    },
    [toast],
  );

  const handleConnect = useCallback(
    async (channel: string) => {
      if (!selectedClientId) throw new Error("Select a client first.");
      try {
        const account = await connectAccount({
          client_id: selectedClientId,
          channel,
        });
        setAccounts((prev) => [account, ...prev]);
        toast.show(
          `Connected ${account.display_name ?? "channel"}. Run a sync to pull stats.`,
          "success",
        );
      } catch (err) {
        throw new Error(
          extractErrorMessage(err, "Could not connect that channel."),
        );
      }
    },
    [selectedClientId, toast],
  );

  const handleSync = useCallback(async () => {
    if (!primaryAccount) return;
    setSyncing(true);
    try {
      const result = await syncAccount(primaryAccount.id);
      await loadAccountData(primaryAccount.id);
      toast.show(
        `Synced — ${formatCompact(result.followers_count)} subscribers, ${result.content_items_synced} items.`,
        "success",
      );
    } catch (err) {
      toast.show(extractErrorMessage(err, "Sync failed."), "error");
    } finally {
      setSyncing(false);
    }
  }, [primaryAccount, loadAccountData, toast]);

  const handleDownloadReport = useCallback(async () => {
    if (!primaryAccount) return;
    setDownloadingReport(true);
    try {
      // MVP: fixed last-30-days window (a date range picker comes later).
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      await generateReport(primaryAccount.id, iso(start), iso(end));
      // Browser shows its own download indicator; no success toast needed.
    } catch (err) {
      toast.show(
        extractErrorMessage(err, "Rapor oluşturulamadı, tekrar dene."),
        "error",
      );
    } finally {
      setDownloadingReport(false);
    }
  }, [primaryAccount, toast]);

  // ---- render ----
  return (
    <PageTransition>
      <div style={{ display: "flex", alignItems: "stretch", minHeight: "100vh" }}>
        <Sidebar
          clients={clients}
          loading={clientsLoading}
          selectedId={selectedClientId}
          query={query}
          user={user}
          onQueryChange={setQuery}
          onSelect={setSelectedClientId}
          onAddClient={() => setAddClientOpen(true)}
          onOpenSettings={() => navigate("/settings")}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--bg-app)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!clientsLoading && clients.length === 0 ? (
            <CenteredArea>
              <EmptyState
                icon={<IconUsers size={24} />}
                title="Add your first client"
                description="Create a client, connect their YouTube channel, and start tracking growth."
                action={
                  <button
                    type="button"
                    className="cw-btn-accent"
                    style={{ height: 42, padding: "0 18px" }}
                    onClick={() => setAddClientOpen(true)}
                  >
                    Add client
                  </button>
                }
              />
            </CenteredArea>
          ) : (
            <>
              <DashboardHeader
                client={selectedClient}
                account={primaryAccount}
                accountsLoading={accountsLoading}
                range={range}
                onRange={setRange}
                syncing={syncing}
                onSync={handleSync}
                downloadingReport={downloadingReport}
                onDownloadReport={handleDownloadReport}
                onGenerateReport={() => setTab("reports")}
                onNotifications={() =>
                  toast.show("No new notifications.", "info")
                }
              />

              <div style={{ padding: "22px 32px 48px", display: "flex", flexDirection: "column", gap: 22 }}>
                <TabBar tab={tab} onChange={setTab} />

                {accountsLoading ? (
                  <OverviewSkeleton />
                ) : !primaryAccount ? (
                  <CenteredArea>
                    <EmptyState
                      icon={<IconLink size={24} />}
                      title="Connect a YouTube channel"
                      description={`Link a public channel to ${selectedClient?.name ?? "this client"} by handle, channel ID, or URL.`}
                      action={
                        <button
                          type="button"
                          className="cw-btn-accent"
                          style={{ height: 42, padding: "0 18px" }}
                          onClick={() => setConnectOpen(true)}
                        >
                          Connect channel
                        </button>
                      }
                    />
                  </CenteredArea>
                ) : dataError ? (
                  <CenteredArea>
                    <EmptyState
                      tone="error"
                      icon={<IconAlert size={24} />}
                      title="Couldn't load data"
                      description={dataError}
                      action={
                        <button
                          type="button"
                          className="cw-btn-secondary"
                          style={{ height: 40, padding: "0 16px" }}
                          onClick={() => void loadAccountData(primaryAccount.id)}
                        >
                          Try again
                        </button>
                      }
                    />
                  </CenteredArea>
                ) : tab === "overview" ? (
                  <OverviewTab
                    loading={dataLoading}
                    stats={stats}
                    chartPoints={chartPoints}
                    content={content}
                    onViewAllContent={() => setTab("content")}
                    onSync={handleSync}
                    syncing={syncing}
                  />
                ) : tab === "content" ? (
                  <ContentTab
                    loading={dataLoading}
                    items={filteredContent}
                    totalItems={content.length}
                    filter={contentFilter}
                    onFilter={setContentFilter}
                  />
                ) : tab === "audience" ? (
                  <CenteredArea>
                    <EmptyState
                      icon={<IconUsers size={24} />}
                      title="Audience analytics aren't available yet"
                      description="Demographics (age, location, gender) require channel-owner access via OAuth. The current YouTube integration uses public data only."
                    />
                  </CenteredArea>
                ) : (
                  <CenteredArea>
                    <EmptyState
                      icon={<IconFileText size={24} />}
                      title="Reporting is coming soon"
                      description="White-label PDF reports will be generated here in an upcoming release."
                    />
                  </CenteredArea>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <FormModal
        open={addClientOpen}
        title="Add client"
        description="Give your client a name. You can connect their channel next."
        label="Client name"
        placeholder="Aurora Studio"
        submitLabel="Add client"
        onSubmit={handleAddClient}
        onClose={() => setAddClientOpen(false)}
      />
      <FormModal
        open={connectOpen}
        title="Connect YouTube channel"
        description="Enter a channel handle (@name), channel ID (UC…), or full URL."
        label="Channel"
        placeholder="@aurorastudio"
        submitLabel="Connect"
        onSubmit={handleConnect}
        onClose={() => setConnectOpen(false)}
      />
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------

function CenteredArea({ children }: { children: ReactNode }) {
  return (
    <div className="cw-card" style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      {children}
    </div>
  );
}

interface HeaderProps {
  client: Client | null;
  account: ConnectedAccount | null;
  accountsLoading: boolean;
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  syncing: boolean;
  onSync: () => void;
  downloadingReport: boolean;
  onDownloadReport: () => void;
  onGenerateReport: () => void;
  onNotifications: () => void;
}

function DashboardHeader({
  client,
  account,
  accountsLoading,
  range,
  onRange,
  syncing,
  onSync,
  downloadingReport,
  onDownloadReport,
  onGenerateReport,
  onNotifications,
}: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--bg-app)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            flex: "none",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: 19,
          }}
        >
          {client ? client.name.slice(0, 2).toUpperCase() : "—"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-.01em" }}>
              {client?.name ?? "Select a client"}
            </h1>
            {account && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 20,
                  padding: "0 8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--positive-soft)",
                  color: "var(--green-700)",
                  border: "1px solid #CFE3D6",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-500)" }} />
                Tracking
              </span>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-muted)" }}>
            <IconYouTube size={14} color="var(--yt-red)" />
            {accountsLoading
              ? "Loading channel…"
              : account
                ? account.display_name ?? account.external_account_id
                : "No channel connected"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 8px 0 11px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-card)",
          }}
        >
          <IconCalendar size={15} color="var(--text-muted)" />
          <select
            value={range}
            onChange={(e) => onRange(e.target.value as RangeKey)}
            style={{
              appearance: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <IconChevronDown size={14} color="var(--text-faint)" />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="cw-icon-btn"
          style={{ width: 38, height: 38 }}
          onClick={onNotifications}
        >
          <IconBell size={18} />
        </button>

        <button
          type="button"
          className="cw-btn-secondary"
          style={{ height: 38, padding: "0 14px" }}
          onClick={onSync}
          disabled={!account || syncing}
        >
          {syncing ? (
            <Spinner size={16} color="var(--accent)" />
          ) : (
            <IconRefresh size={16} />
          )}
          {syncing ? "Syncing…" : "Sync"}
        </button>

        <button
          type="button"
          className="cw-btn-secondary"
          style={{ height: 38, padding: "0 14px" }}
          onClick={onDownloadReport}
          disabled={!account || downloadingReport}
          title="Son 30 günün PDF raporunu indir"
        >
          {downloadingReport ? (
            <Spinner size={16} color="var(--accent)" />
          ) : (
            <IconDownload size={16} />
          )}
          {downloadingReport ? "Hazırlanıyor…" : "PDF İndir"}
        </button>

        <button
          type="button"
          className="cw-btn-accent"
          style={{ height: 38, padding: "0 16px", fontSize: 14 }}
          onClick={onGenerateReport}
        >
          <IconFileText size={16} />
          Generate report
        </button>
      </div>
    </header>
  );
}

function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)" }}>
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              position: "relative",
              padding: "9px 14px 12px",
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {t.label}
            {active && (
              <motion.span
                layoutId="tab-underline"
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  bottom: -1,
                  height: 2,
                  borderRadius: 2,
                  background: "var(--accent)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface OverviewProps {
  loading: boolean;
  stats: {
    subs: number | null;
    views: number | null;
    growth: number | null;
    subsDelta: Delta | null;
    viewsDelta: Delta | null;
    growthDelta: Delta | null;
  };
  chartPoints: ChartPoint[];
  content: ContentItem[];
  onViewAllContent: () => void;
  onSync: () => void;
  syncing: boolean;
}

function OverviewTab({
  loading,
  stats,
  chartPoints,
  content,
  onViewAllContent,
  onSync,
  syncing,
}: OverviewProps) {
  const noData = !loading && stats.subs === null && content.length === 0;

  if (noData) {
    return (
      <CenteredArea>
        <EmptyState
          icon={<IconRefresh size={24} />}
          title="No data yet"
          description="Run a sync to pull this channel's latest subscribers, views, and recent videos."
          action={
            <button
              type="button"
              className="cw-btn-accent"
              style={{ height: 42, padding: "0 18px" }}
              onClick={onSync}
              disabled={syncing}
            >
              {syncing ? <Spinner size={17} color="var(--text-on-accent)" /> : "Sync now"}
            </button>
          }
        />
      </CenteredArea>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <StatCard
          index={0}
          label="Subscribers"
          icon={<IconUsers size={18} />}
          value={stats.subs}
          formatValue={(n) => formatCompact(Math.round(n))}
          delta={stats.subsDelta}
          accentIcon
          loading={loading}
        />
        <StatCard
          index={1}
          label="Total views"
          icon={<IconEye size={18} />}
          value={stats.views}
          formatValue={(n) => formatCompact(Math.round(n))}
          delta={stats.viewsDelta}
          loading={loading}
        />
        <StatCard
          index={2}
          label={`${rangeLabel(chartPoints)} growth`}
          icon={<IconTrendingUp size={18} />}
          value={stats.growth}
          formatValue={(n) => {
            const r = Math.round(n);
            return `${r >= 0 ? "+" : ""}${formatCompact(r)}`;
          }}
          delta={stats.growthDelta}
          loading={loading}
        />
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : (
        <GrowthChart points={chartPoints} showViews />
      )}

      <div className="cw-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em" }}>
            Recent content
          </h2>
          {content.length > 0 && (
            <button
              type="button"
              className="cw-link-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}
              onClick={onViewAllContent}
            >
              View all
              <IconChevronRight size={15} />
            </button>
          )}
        </div>
        {loading ? (
          <TableSkeleton />
        ) : content.length === 0 ? (
          <p style={{ margin: 0, padding: "20px 0", fontSize: 14, color: "var(--text-muted)" }}>
            No content synced yet.
          </p>
        ) : (
          <ContentTable items={content.slice(0, 5)} />
        )}
      </div>
    </div>
  );
}

function rangeLabel(points: ChartPoint[]): string {
  return points.length > 1 ? `${points.length}-day` : "Recent";
}

interface ContentTabProps {
  loading: boolean;
  items: ContentItem[];
  totalItems: number;
  filter: ContentFilter;
  onFilter: (f: ContentFilter) => void;
}

function ContentTab({ loading, items, totalItems, filter, onFilter }: ContentTabProps) {
  const filters: { key: ContentFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "scheduled", label: "Scheduled" },
    { key: "draft", label: "Drafts" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilter(f.key)}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: "var(--radius-full)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border-subtle)"}`,
                background: active ? "var(--accent)" : "var(--surface-card)",
                color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cw-card" style={{ overflow: "hidden" }}>
              <Skeleton height={128} radius={0} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton width="90%" height={14} />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <CenteredArea>
          <EmptyState
            icon={<IconInbox size={24} />}
            title={totalItems === 0 ? "No content synced yet" : "Nothing here"}
            description={
              totalItems === 0
                ? "Run a sync to pull this channel's recent videos."
                : "No content matches this filter. Synced YouTube videos appear under “Published”."
            }
          />
        </CenteredArea>
      ) : (
        <ContentCards items={items} />
      )}
    </div>
  );
}

// ---- skeletons ----
function OverviewSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="cw-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <Skeleton width="40%" height={13} />
            <Skeleton width={120} height={36} />
            <Skeleton width="55%" height={12} />
          </div>
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="cw-card" style={{ padding: 24 }}>
      <Skeleton width={220} height={17} style={{ marginBottom: 16 }} />
      <Skeleton height={260} radius="var(--radius-md)" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <Skeleton width={68} height={42} />
          <Skeleton width="40%" height={14} />
          <div style={{ flex: 1 }} />
          <Skeleton width={60} height={14} />
        </div>
      ))}
    </div>
  );
}
