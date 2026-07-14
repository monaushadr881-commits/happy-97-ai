/**
 * /founder/system — System control.
 * Feature flags, integrations, languages, DB counts. Consumes API + ops layers only.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import {
  apiFeatureFlags, apiListIntegrations, apiLanguages,
} from "@/lib/api-v1.functions";
import { opsDbSchemaCounts } from "@/lib/ops-v1.functions";
import { Flag, Plug, Globe2, Database } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/system")({
  head: () => ({ meta: [{ title: "System — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderSystem,
});

function FounderSystem() {
  const flags = useQuery({ queryKey: ["sys", "flags"], queryFn: () => apiFeatureFlags() });
  const integrations = useQuery({ queryKey: ["sys", "integrations"], queryFn: () => apiListIntegrations() });
  const languages = useQuery({ queryKey: ["sys", "langs"], queryFn: () => apiLanguages() });
  const dbCounts = useQuery({ queryKey: ["sys", "db"], queryFn: () => opsDbSchemaCounts() });

  return (
    <>
      <PageHeader eyebrow="Control" title="System" description="Feature flags, integrations, localisation and schema — the founder's control plane." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Feature Flags</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((flags.data ?? []) as Array<{ id: string; key: string; enabled?: boolean; rollout?: number | null }>).map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{f.key}</div>
                  {f.rollout != null && <div className="text-[11px] text-soft-gray">{f.rollout}% rollout</div>}
                </div>
                <Chip tone={f.enabled ? "success" : "neutral"}>{f.enabled ? "on" : "off"}</Chip>
              </li>
            ))}
            {!(flags.data as unknown[] | undefined)?.length && <li className="py-2 text-xs text-soft-gray">No flags defined.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2"><Plug className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Integrations</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((integrations.data ?? []) as Array<{ id: string; provider: string; status?: string }>).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-paper">{i.provider}</span>
                <Chip tone={i.status === "connected" ? "success" : "neutral"}>{i.status ?? "—"}</Chip>
              </li>
            ))}
            {!(integrations.data as unknown[] | undefined)?.length && <li className="py-2 text-xs text-soft-gray">No integrations configured.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Languages</h2>
          </div>
          <Hairline className="my-4" />
          <div className="flex flex-wrap gap-2">
            {((languages.data ?? []) as Array<{ code: string; name: string }>).map((l) => (
              <Chip key={l.code}>{l.code} · {l.name}</Chip>
            ))}
            {!(languages.data as unknown[] | undefined)?.length && <p className="text-xs text-soft-gray">No languages seeded.</p>}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2"><Database className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Schema Snapshot</h2>
          </div>
          <Hairline className="my-4" />
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries((dbCounts.data ?? {}) as Record<string, unknown>).slice(0, 10).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-3 py-2">
                <dt className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{k}</dt>
                <dd className="numeric text-paper">{typeof v === "number" ? v.toLocaleString() : String(v ?? "—")}</dd>
              </div>
            ))}
            {!dbCounts.data && <p className="col-span-2 text-xs text-soft-gray">No schema stats.</p>}
          </dl>
        </Panel>
      </div>
    </>
  );
}
