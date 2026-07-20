/**
 * /founder/users — Access & Identity.
 * Suspense/loader adopted via canonical `definedQuery` + `ensureCanonicalMany`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { apiMe, apiRecentAudit, apiIsFounder } from "@/lib/api-v1.functions";
import { UserCircle2, ShieldAlert } from "lucide-react";
import { definedQuery, ensureCanonicalMany } from "@/lib/founder/suspense-query";

const meQ = definedQuery(["founder", "me"], () => apiMe());
const isFounderQ = definedQuery(["founder", "is-founder"], () => apiIsFounder());
const auditQ = definedQuery(
  ["founder", "users-audit"],
  () => apiRecentAudit({ data: { limit: 25, action: "auth" } }),
);

export const Route = createFileRoute("/_authenticated/founder/users")({
  head: () => ({ meta: [{ title: "Users — Founder" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    ensureCanonicalMany(context.queryClient, [meQ, isFounderQ], [auditQ]),
  component: FounderUsers,
});

function FounderUsers() {
  const { data: me } = useSuspenseQuery(meQ);
  const { data: founder } = useSuspenseQuery(isFounderQ);
  const { data: audit } = useSuspenseQuery(auditQ);

  const profile = (me ?? {}) as Record<string, unknown>;

  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Users & Access"
        description="Sovereign view of identities, roles, sessions and access history across the ecosystem."
      />

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-paper">{String(profile.full_name ?? profile.email ?? "Founder")}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{String(profile.email ?? "")}</div>
            </div>
          </div>
          <Hairline className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Chip tone={founder ? "gold" : "neutral"}>{founder ? "Founder" : "Standard"}</Chip>
            <Chip tone="info">Session active</Chip>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Access Log</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {(Array.isArray(audit) ? audit : []).map((a: { id: string; action?: string; actor_id?: string | null; created_at?: string; entity_type?: string | null }) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">
                    <span className="text-gold">{a.action}</span>
                    {a.entity_type ? <span className="text-soft-gray"> · {a.entity_type}</span> : null}
                  </div>
                  <div className="text-[11px] text-soft-gray">{a.actor_id ?? "system"}</div>
                </div>
                <time className="numeric text-[11px] text-soft-gray">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                </time>
              </li>
            ))}
            {!Array.isArray(audit) || !audit.length ? (
              <li className="py-6">
                <EmptyState title="No access events yet" description="Sign-ins, MFA changes and impersonations will appear here." />
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>
    </>
  );
}
