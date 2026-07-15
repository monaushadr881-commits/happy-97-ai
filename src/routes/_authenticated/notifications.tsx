/**
 * /notifications — Real Notification Center.
 *
 * Backend: public.notifications (RLS scoped to auth.uid()).
 * Features: list, filter (all/unread/read + category), unread counter,
 * mark read / unread, mark all read, delete, realtime updates,
 * per-kind × per-channel preferences.
 *
 * No placeholders. All state comes from the database.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, CheckCheck, Check, Trash2, RefreshCw, Inbox, ShieldAlert,
  Rocket, ShoppingBag, CreditCard, Bot, Sparkles, Loader2, Undo2,
} from "lucide-react";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  notifList, notifUnreadCount, notifCategoryCounts,
  notifMarkRead, notifMarkUnread, notifMarkAllRead, notifDelete,
  notifPrefsList, notifPrefUpsert, notifDevSeed,
} from "@/lib/notification-center.functions";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — HAPPY" },
      { name: "description", content: "Your unified inbox: system, security, deployments, marketplace, billing, and Digital Human alerts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationCenter,
});

type Notif = {
  id: string;
  user_id: string;
  kind: string;
  channel: string;
  title: string;
  body: string | null;
  action_url: string | null;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

type Filter = "all" | "unread" | "read";

const KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: "gold" | "success" | "warning" | "danger" | "info" | "neutral" }> = {
  system:        { label: "System",        icon: Bell,         tone: "neutral" },
  security:      { label: "Security",      icon: ShieldAlert,  tone: "danger"  },
  deployment:    { label: "Deployment",    icon: Rocket,       tone: "info"    },
  marketplace:   { label: "Marketplace",   icon: ShoppingBag,  tone: "gold"    },
  billing:       { label: "Billing",       icon: CreditCard,   tone: "warning" },
  digital_human: { label: "Digital Human", icon: Bot,          tone: "success" },
  founder:       { label: "Founder",       icon: Sparkles,     tone: "gold"    },
};

function kindMeta(kind: string) {
  return KIND_META[kind] ?? { label: kind, icon: Bell, tone: "neutral" as const };
}

const CHANNELS = ["in_app", "email", "push"] as const;
const PREF_KINDS = ["system", "security", "deployment", "marketplace", "billing", "digital_human", "founder"] as const;

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.round((now - d) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

function NotificationCenter() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [showPrefs, setShowPrefs] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const listKey = ["notif", "list", filter, kind ?? "*"] as const;

  const listQ = useQuery({
    queryKey: listKey,
    queryFn: () => notifList({ data: { filter, kind, limit: 200 } }) as Promise<Notif[]>,
  });
  const unreadQ = useQuery({
    queryKey: ["notif", "unread"],
    queryFn: () => notifUnreadCount() as Promise<{ count: number }>,
    refetchInterval: 30_000,
  });
  const catsQ = useQuery({
    queryKey: ["notif", "cats"],
    queryFn: () => notifCategoryCounts() as Promise<Record<string, { total: number; unread: number }>>,
  });

  // Realtime — refetch on any change to this user's rows.
  useEffect(() => {
    let uid: string | null = null;
    const channel = supabase.channel("notif-center");
    supabase.auth.getUser().then(({ data }) => {
      uid = data.user?.id ?? null;
      if (!uid) return;
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => {
            setLastRefresh(new Date());
            qc.invalidateQueries({ queryKey: ["notif"] });
          },
        )
        .subscribe();
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ["notif"] });

  const markReadM = useMutation({
    mutationFn: (id: string) => notifMarkRead({ data: { id } }),
    onSuccess: invalidateAll,
  });
  const markUnreadM = useMutation({
    mutationFn: (id: string) => notifMarkUnread({ data: { id } }),
    onSuccess: invalidateAll,
  });
  const markAllM = useMutation({
    mutationFn: () => notifMarkAllRead(),
    onSuccess: invalidateAll,
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => notifDelete({ data: { id } }),
    onSuccess: invalidateAll,
  });
  const seedM = useMutation({
    mutationFn: () => notifDevSeed(),
    onSuccess: invalidateAll,
  });

  const items: Notif[] = Array.isArray(listQ.data) ? listQ.data : [];
  const unread = unreadQ.data?.count ?? 0;
  const cats = catsQ.data ?? {};
  const kindList = useMemo(() => Object.keys(cats).sort(), [cats]);

  return (
    <>
      <PageHeader
        eyebrow="Inbox · Live"
        title="Notification Center"
        description="System, security, deployment, marketplace, billing, and Digital Human alerts — with realtime updates."
        actions={
          <div className="flex items-center gap-2">
            <Chip tone={unread > 0 ? "gold" : "neutral"} aria-label={`${unread} unread`}>
              {unreadQ.isLoading ? "…" : `${unread} unread`}
            </Chip>
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllM.mutate()}
              disabled={markAllM.isPending || unread === 0}
              aria-label="Mark all notifications as read"
            >
              {markAllM.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" aria-hidden /> : <CheckCheck className="h-3 w-3 mr-1" aria-hidden />}
              Mark all read
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setLastRefresh(new Date()); invalidateAll(); }}
              aria-label="Refresh notifications"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
            </Button>
          </div>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px,1fr]">
        {/* ─── Sidebar: filters + categories ───────────────────────── */}
        <Panel className="p-4 h-fit">
          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-gray mb-2">Status</div>
          <div role="tablist" aria-label="Notification status filter" className="grid grid-cols-3 gap-1 mb-4">
            {(["all", "unread", "read"] as Filter[]).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-md border px-2 py-1.5 text-xs capitalize transition ${
                  filter === f
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/5 bg-white/[0.02] text-soft-gray hover:text-paper"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-gray mb-2">Categories</div>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setKind(undefined)}
                aria-pressed={kind === undefined}
                className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                  kind === undefined ? "bg-white/5 text-paper" : "text-soft-gray hover:text-paper hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2"><Inbox className="h-3.5 w-3.5" aria-hidden /> All categories</span>
                <span className="numeric">{items.length}</span>
              </button>
            </li>
            {kindList.map((k) => {
              const meta = kindMeta(k);
              const Icon = meta.icon;
              const c = cats[k];
              return (
                <li key={k}>
                  <button
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                      kind === k ? "bg-white/5 text-paper" : "text-soft-gray hover:text-paper hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {c.unread > 0 && <Chip tone="gold">{c.unread}</Chip>}
                      <span className="numeric text-[10px] text-soft-gray">{c.total}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Hairline className="my-4" />

          <button
            onClick={() => setShowPrefs((v) => !v)}
            className="w-full text-left text-xs text-gold hover:text-gold-bright"
            aria-expanded={showPrefs}
          >
            {showPrefs ? "Hide" : "Manage"} preferences →
          </button>

          {import.meta.env.DEV && (
            <>
              <Hairline className="my-4" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => seedM.mutate()}
                disabled={seedM.isPending}
                aria-label="Insert sample notifications (dev only)"
                className="w-full"
              >
                {seedM.isPending ? "Seeding…" : "Insert sample data"}
              </Button>
            </>
          )}
        </Panel>

        {/* ─── Main list ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div
            role="status"
            aria-live="polite"
            className="sr-only"
          >
            {listQ.isLoading
              ? "Loading notifications"
              : listQ.isError
              ? "Failed to load notifications"
              : `${items.length} notifications shown, ${unread} unread. Last refresh ${lastRefresh.toLocaleTimeString()}.`}
          </div>

          <Panel className="p-0 overflow-hidden">
            {listQ.isLoading && (
              <div className="p-6 text-xs text-soft-gray flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading your inbox…
              </div>
            )}

            {listQ.isError && (
              <div role="alert" className="p-4 text-xs text-red-200 flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/5">
                <span>Couldn’t load notifications: {(listQ.error as Error)?.message ?? "Request failed."}</span>
                <Button size="sm" variant="outline" onClick={() => listQ.refetch()} aria-label="Retry loading notifications">
                  <RefreshCw className="h-3 w-3 mr-1" aria-hidden /> Retry
                </Button>
              </div>
            )}

            {!listQ.isLoading && !listQ.isError && items.length === 0 && (
              <div className="p-10 text-center">
                <Inbox className="h-8 w-8 mx-auto text-soft-gray mb-3" aria-hidden />
                <div className="text-sm text-paper mb-1">You’re all caught up</div>
                <p className="text-xs text-soft-gray">
                  {filter === "unread" ? "No unread notifications." : kind ? `No notifications in ${kindMeta(kind).label}.` : "No notifications yet."}
                </p>
              </div>
            )}

            {!listQ.isLoading && !listQ.isError && items.length > 0 && (
              <ul className="divide-y divide-white/5">
                {items.map((n) => {
                  const meta = kindMeta(n.kind);
                  const Icon = meta.icon;
                  const isUnread = !n.read_at;
                  return (
                    <li
                      key={n.id}
                      className={`p-4 flex items-start gap-3 transition ${isUnread ? "bg-gold/[0.03]" : ""}`}
                    >
                      <div
                        aria-hidden
                        className={`shrink-0 mt-0.5 h-8 w-8 rounded-md flex items-center justify-center border ${
                          isUnread ? "border-gold/30 bg-gold/10 text-gold" : "border-white/5 bg-white/[0.02] text-soft-gray"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${isUnread ? "text-paper font-medium" : "text-soft-gray"}`}>{n.title}</span>
                          <Chip tone={meta.tone}>{meta.label}</Chip>
                          {isUnread && (
                            <span aria-label="Unread" className="h-1.5 w-1.5 rounded-full bg-gold" />
                          )}
                        </div>
                        {n.body && (
                          <p className={`mt-1 text-xs ${isUnread ? "text-paper/90" : "text-soft-gray"}`}>{n.body}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-soft-gray">
                          <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString()}>
                            {timeAgo(n.created_at)}
                          </time>
                          <span aria-hidden>·</span>
                          <span>via {n.channel}</span>
                          {n.action_url && (
                            <>
                              <span aria-hidden>·</span>
                              <a
                                href={n.action_url}
                                className="text-gold hover:text-gold-bright underline underline-offset-2"
                                onClick={() => isUnread && markReadM.mutate(n.id)}
                              >
                                Open
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {isUnread ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markReadM.mutate(n.id)}
                            disabled={markReadM.isPending}
                            aria-label={`Mark "${n.title}" as read`}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markUnreadM.mutate(n.id)}
                            disabled={markUnreadM.isPending}
                            aria-label={`Mark "${n.title}" as unread`}
                          >
                            <Undo2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteM.mutate(n.id)}
                          disabled={deleteM.isPending}
                          aria-label={`Delete "${n.title}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {showPrefs && <PreferencesPanel />}
        </div>
      </div>
    </>
  );
}

// ─── Preferences ────────────────────────────────────────────────────────────
function PreferencesPanel() {
  const qc = useQueryClient();
  const prefsQ = useQuery({
    queryKey: ["notif", "prefs"],
    queryFn: () => notifPrefsList() as Promise<Array<{ id: string; kind: string; channel: string; enabled: boolean }>>,
  });
  const upsertM = useMutation({
    mutationFn: (v: { kind: string; channel: (typeof CHANNELS)[number]; enabled: boolean }) => notifPrefUpsert({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif", "prefs"] }),
  });

  const prefMap = new Map<string, boolean>();
  for (const p of prefsQ.data ?? []) prefMap.set(`${p.kind}:${p.channel}`, p.enabled);
  // Default = enabled unless explicitly disabled.
  const isEnabled = (kind: string, channel: string) => prefMap.get(`${kind}:${channel}`) ?? true;

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Preferences</h2>
        <Button size="sm" variant="ghost" onClick={() => prefsQ.refetch()} aria-label="Refresh preferences">
          <RefreshCw className="h-3 w-3" aria-hidden />
        </Button>
      </div>

      {prefsQ.isLoading && <div className="text-xs text-soft-gray">Loading preferences…</div>}
      {prefsQ.isError && (
        <div role="alert" className="text-xs text-red-200">Couldn’t load preferences. <Button size="sm" variant="outline" onClick={() => prefsQ.refetch()}>Retry</Button></div>
      )}

      {!prefsQ.isLoading && !prefsQ.isError && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-soft-gray">
              <tr>
                <th className="text-left py-2 pr-4">Category</th>
                {CHANNELS.map((c) => (
                  <th key={c} className="text-center py-2 px-3 capitalize">{c.replace("_", "-")}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {PREF_KINDS.map((k) => {
                const meta = kindMeta(k);
                const Icon = meta.icon;
                return (
                  <tr key={k}>
                    <td className="py-2 pr-4">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-soft-gray" aria-hidden />
                        <span className="text-paper">{meta.label}</span>
                      </span>
                    </td>
                    {CHANNELS.map((c) => {
                      const on = isEnabled(k, c);
                      return (
                        <td key={c} className="text-center py-2 px-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={upsertM.isPending}
                              onChange={(e) => upsertM.mutate({ kind: k, channel: c, enabled: e.target.checked })}
                              className="h-4 w-4 accent-gold"
                              aria-label={`${meta.label} via ${c}`}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
