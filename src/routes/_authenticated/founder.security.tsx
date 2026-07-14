/**
 * /founder/security — Security & Audit Console.
 * Consumes opsSecuritySummary + opsSecurityAudit + apiRecentAudit.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Chip, Hairline } from "@/design-system/primitives";
import { opsSecuritySummary, opsSecurityAudit } from "@/lib/ops-v1.functions";
import { ShieldCheck, ShieldAlert, KeyRound, Webhook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/security")({
  head: () => ({ meta: [{ title: "Security — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderSecurity,
});

function FounderSecurity() {
  const summary = useQuery({ queryKey: ["sec", "summary"], queryFn: () => opsSecuritySummary(), refetchInterval: 30_000 });
  const timeline = useQuery({ queryKey: ["sec", "audit"], queryFn: () => opsSecurityAudit({ data: { limit: 30 } }) });

  const s = (summary.data ?? {}) as Record<string, number | undefined>;

  return (
    <>
      <PageHeader eyebrow="Sovereign Security" title="Security Console" description="Threats, permission changes, sessions, API keys and webhook health." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Sessions" value={(s.active_sessions ?? 0).toLocaleString()} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Failed Logins · 24h" value={(s.failed_logins_24h ?? 0).toLocaleString()} icon={<ShieldAlert className="h-4 w-4" />} trend={s.failed_logins_24h ? "down" : "flat"} />
        <StatCard label="API Keys" value={(s.api_keys ?? 0).toLocaleString()} icon={<KeyRound className="h-4 w-4" />} />
        <StatCard label="Webhook Deliveries · 24h" value={(s.webhook_deliveries_24h ?? 0).toLocaleString()} icon={<Webhook className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Security Timeline</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {((timeline.data ?? []) as Array<{ id: string; action?: string; entity_type?: string | null; actor_id?: string | null; created_at?: string; severity?: string | null }>).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">
                  <span className="text-gold">{e.action}</span>
                  {e.entity_type ? <span className="text-soft-gray"> · {e.entity_type}</span> : null}
                </div>
                <div className="text-[11px] text-soft-gray">{e.actor_id ?? "system"}</div>
              </div>
              <div className="flex items-center gap-2">
                {e.severity && (
                  <Chip tone={e.severity === "critical" ? "danger" : e.severity === "high" ? "warning" : "info"}>{e.severity}</Chip>
                )}
                <time className="numeric text-[11px] text-soft-gray">
                  {e.created_at ? new Date(e.created_at).toLocaleString() : ""}
                </time>
              </div>
            </li>
          ))}
          {!(timeline.data as unknown[] | undefined)?.length && <li className="py-3 text-xs text-soft-gray">No security events.</li>}
        </ul>
      </Panel>
    </>
  );
}
