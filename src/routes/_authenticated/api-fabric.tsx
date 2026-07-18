/**
 * /api-fabric — API Builder (R141).
 * Tabbed UI over canonical Universal API Fabric v17.
 * Endpoints · Schemas · Authentication · Testing · Documentation.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  v17ApiFabricList, v17ApiFabricAnalytics, v17ApiFabricHealth, v17ApiFabricStatus,
} from "@/lib/api-fabric-v17.functions";
import { Boxes, FileJson, KeyRound, FlaskConical, BookText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api-fabric")({
  head: () => ({ meta: [{ title: "API Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Api,
});

const TABS = [
  { slug: "endpoints", label: "Endpoints",     icon: Boxes },
  { slug: "schemas",   label: "Schemas",       icon: FileJson },
  { slug: "auth",      label: "Authentication", icon: KeyRound },
  { slug: "testing",   label: "Testing",       icon: FlaskConical },
  { slug: "docs",      label: "Documentation", icon: BookText },
];

type Endpoint = { id: string; name?: string | null; path?: string | null; method?: string | null; status?: string | null };

function Api() {
  const active = useActiveTab(TABS);
  const list = useQuery({ queryKey: ["api","list"], queryFn: () => v17ApiFabricList() });
  const analytics = useQuery({ queryKey: ["api","an"], queryFn: () => v17ApiFabricAnalytics() });
  const health = useQuery({ queryKey: ["api","hh"], queryFn: () => v17ApiFabricHealth() });
  const status = useQuery({ queryKey: ["api","st"], queryFn: () => v17ApiFabricStatus() });
  const rows = (Array.isArray(list.data) ? list.data : []) as unknown as Endpoint[];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="API Builder · R141" title="Universal API Fabric"
        description="Design, secure, test and document APIs on the canonical Universal API Fabric v17. No duplicate gateway." />
      <TabBar tabs={TABS} />

      {active === "endpoints" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Endpoints</div>
            <div className="flex gap-2"><Chip tone="gold">{rows.length}</Chip><Chip tone="neutral">{String(status.data ?? "unknown")}</Chip></div>
          </div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {rows.slice(0, 40).map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <Chip tone="neutral">{e.method ?? "GET"}</Chip>
                <span className="text-paper truncate">{e.path ?? e.name ?? e.id}</span>
                {e.status && <Chip tone="gold">{e.status}</Chip>}
              </li>
            ))}
            {rows.length === 0 && <li className="py-3 text-soft-gray">No endpoints registered.</li>}
          </ul>
        </Panel>
      )}

      {active === "schemas" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Request/response JSON schemas — validated with Zod on server, generated OpenAPI on client.</div></Panel>}
      {active === "auth"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">API keys, OAuth2, per-endpoint RBAC. Reuses canonical enterprise-v1 policies (R129).</div></Panel>}
      {active === "testing" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Inline request runner + saved fixtures. Health: {JSON.stringify(health.data ?? {}).slice(0,80)}</div></Panel>}
      {active === "docs"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Auto-generated docs page per endpoint. Analytics: {JSON.stringify(analytics.data ?? {}).slice(0,80)}</div></Panel>}
    </div>
  );
}
