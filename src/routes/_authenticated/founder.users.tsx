/**
 * /founder/users — Access & Identity.
 * Founder identity, permissions, sessions view, and recent access audit.
 * Consumes: apiMe, apiRecentAudit, apiIsFounder.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { apiMe, apiRecentAudit, apiIsFounder } from "@/lib/api-v1.functions";
import { UserCircle2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/users")({
  head: () => ({ meta: [{ title: "Users — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderUsers,
});

function FounderUsers() {
  const me = useQuery({ queryKey: ["founder", "me"], queryFn: () => apiMe() });
  const founder = useQuery({ queryKey: ["founder", "is-founder"], queryFn: () => apiIsFounder() });
  const audit = useQuery({
    queryKey: ["founder", "users-audit"],
    queryFn: () => apiRecentAudit({ data: { limit: 25, action: "auth" } }),
  });

  const profile = (me.data ?? {}) as Record<string, unknown>;

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
            {profile.avatar_url ? (
              <img
                src={String(profile.avatar_url)}
                alt=""
                className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/30"
              />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
                <UserCircle2 className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-paper">{String(profile.full_name ?? profile.email ?? "Founder")}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{String(profile.email ?? "")}</div>
            </div>
          </div>
          <Hairline className="my-4" />
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2 text-sm">
            <dt className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">Role</dt>
            <dd className="text-paper">{founder.data ? "Founder" : "Standard"}</dd>
            {profile.phone_primary ? (
              <>
                <dt className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">Primary</dt>
                <dd className="numeric text-paper">{String(profile.phone_primary)}</dd>
              </>
            ) : null}
            {profile.phone_secondary ? (
              <>
                <dt className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">Secondary</dt>
                <dd className="numeric text-paper">{String(profile.phone_secondary)}</dd>
              </>
            ) : null}
          </dl>
          <Hairline className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Chip tone={founder.data ? "gold" : "neutral"}>{founder.data ? "Founder" : "Standard"}</Chip>
            <Chip tone="info">Session active</Chip>
            <Chip tone={founder.data ? "gold" : "neutral"}>{founder.data ? "Active" : "Pending"}</Chip>
          </div>
        </Panel>


        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Access Log</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {(Array.isArray(audit.data) ? audit.data : []).map((a: { id: string; action?: string; actor_id?: string | null; created_at?: string; entity_type?: string | null }) => (
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
            {!Array.isArray(audit.data) || !audit.data.length ? (
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
