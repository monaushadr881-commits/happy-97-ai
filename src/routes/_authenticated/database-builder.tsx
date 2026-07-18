/**
 * /database-builder — Database Builder (R141).
 * Tabbed UI: Entities · Relations · Indexes · Validation · Preview.
 * Reuses canonical schema surface (BuilderV1List) — no new runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import { BuilderV1List } from "@/lib/builder-v1.functions";
import { Database, GitBranch, ListTree, ShieldCheck, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/database-builder")({
  head: () => ({ meta: [{ title: "Database Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: DB,
});

const TABS = [
  { slug: "entities",   label: "Entities",   icon: Database },
  { slug: "relations",  label: "Relations",  icon: GitBranch },
  { slug: "indexes",    label: "Indexes",    icon: ListTree },
  { slug: "validation", label: "Validation", icon: ShieldCheck },
  { slug: "preview",    label: "Preview",    icon: Eye },
];

type Row = { id: string; name?: string | null; kind?: string | null };

function DB() {
  const active = useActiveTab(TABS);
  const list = useQuery({ queryKey: ["db","list"], queryFn: () => BuilderV1List() });
  const rows = (Array.isArray(list.data) ? list.data : []) as unknown as Row[];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="Database Builder · R141" title="Database"
        description="Design entities, relations, indexes and validation on the canonical Universal Builder runtime — synced with the Data API." />
      <TabBar tabs={TABS} />

      {active === "entities" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3"><div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Entities</div><Chip tone="gold">{rows.length}</Chip></div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {rows.slice(0, 30).map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <span className="text-paper truncate">{r.name ?? r.id}</span>
                {r.kind && <Chip tone="neutral">{r.kind}</Chip>}
              </li>
            ))}
            {rows.length === 0 && <li className="py-3 text-soft-gray">No custom entities yet. Ask HAPPY to design a schema.</li>}
          </ul>
        </Panel>
      )}

      {active === "relations"  && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">1-to-1, 1-to-many, many-to-many. Canonical FK owner.</div></Panel>}
      {active === "indexes"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">B-tree, unique, partial and GIN indexes suggested by HAPPY.</div></Panel>}
      {active === "validation" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Column-level constraints, check expressions, RLS templates.</div></Panel>}
      {active === "preview"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Live row browser powered by the Data API — RLS enforced.</div></Panel>}
    </div>
  );
}
