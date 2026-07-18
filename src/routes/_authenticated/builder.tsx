/**
 * /builder — Universal Builder hub (R141).
 * Tabbed surface for 6 canonical builder families. No new runtime, no Builder V2.
 * Reuses BuilderV1*, AppBuilderV1*, WebsiteBuilderV1*, apiWfList, v17ApiFabric*, apiAgents*.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import { BuilderV1List, BuilderV1Analytics } from "@/lib/builder-v1.functions";
import { WebsiteBuilderV1List } from "@/lib/website-builder-v1.functions";
import { AppBuilderV1List } from "@/lib/app-builder-v1.functions";
import { apiWfList } from "@/lib/workflow-engine-v3.functions";
import { v17ApiFabricList } from "@/lib/api-fabric-v17.functions";
import { apiAgentsList } from "@/lib/agents-v4.functions";
import { Wand2, Globe, Smartphone, Workflow, Database, Boxes, Brain } from "lucide-react";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({ meta: [{ title: "Universal Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Builder,
});

const TABS = [
  { slug: "overview",  label: "Overview",   icon: Wand2 },
  { slug: "websites",  label: "Websites",   icon: Globe },
  { slug: "apps",      label: "Apps",       icon: Smartphone },
  { slug: "workflows", label: "Workflows",  icon: Workflow },
  { slug: "database",  label: "Database",   icon: Database },
  { slug: "api",       label: "API",        icon: Boxes },
  { slug: "ai",        label: "AI Agents",  icon: Brain },
];

function Row({ items, empty }: { items: Array<{ id: string; name?: string | null; label?: string | null; status?: string | null }>; empty: string }) {
  if (!items.length) return <div className="text-xs text-soft-gray py-3">{empty}</div>;
  return (
    <ul className="divide-y divide-white/5 text-xs">
      {items.slice(0, 30).map((x) => (
        <li key={x.id} className="flex items-center gap-3 py-2">
          <span className="text-paper truncate">{x.name ?? x.label ?? x.id}</span>
          {x.status && <Chip tone="gold">{x.status}</Chip>}
        </li>
      ))}
    </ul>
  );
}

function Builder() {
  const active = useActiveTab(TABS);
  const analytics = useQuery({ queryKey: ["builder","analytics"], queryFn: () => BuilderV1Analytics() });
  const sites = useQuery({ queryKey: ["builder","sites"], queryFn: () => WebsiteBuilderV1List() });
  const apps = useQuery({ queryKey: ["builder","apps"], queryFn: () => AppBuilderV1List() });
  const wf = useQuery({ queryKey: ["builder","wf"], queryFn: () => apiWfList() });
  const universal = useQuery({ queryKey: ["builder","universal"], queryFn: () => BuilderV1List() });
  const api = useQuery({ queryKey: ["builder","api"], queryFn: () => v17ApiFabricList() });
  const ai = useQuery({ queryKey: ["builder","ai"], queryFn: () => apiAgentsList() });

  const asRows = (v: unknown) => (Array.isArray(v) ? v : []) as Array<{ id: string; name?: string | null; label?: string | null; status?: string | null }>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="Universal Builder · R141" title="Universal Builder"
        description="One AI-native builder for every product surface — websites, apps, workflows, database, APIs and agents. Extends canonical builder-v1 owners." />
      <TabBar tabs={TABS} />

      {active === "overview" && (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Universal</div><div className="text-3xl font-serif text-paper mt-2">{asRows(universal.data).length}</div></Panel>
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Analytics</div><div className="text-xs text-soft-gray mt-2 truncate">{JSON.stringify(analytics.data ?? {}).slice(0, 80)}</div></Panel>
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Health</div><Chip tone="gold">operational</Chip></Panel>
          <Panel className="p-5 md:col-span-3">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Jump to specialised builder</div>
            <Hairline className="mb-3" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { to: "/websites", label: "Website Builder", icon: Globe },
                { to: "/app-builder", label: "App Builder", icon: Smartphone },
                { to: "/workflows", label: "Workflow Builder", icon: Workflow },
                { to: "/database-builder", label: "Database Builder", icon: Database },
                { to: "/api-fabric", label: "API Builder", icon: Boxes },
                { to: "/ai-builder", label: "AI Builder", icon: Brain },
              ].map((s) => (
                <Link key={s.to} to={s.to} className="group rounded-md border border-white/5 bg-white/[0.02] p-4 hover:border-gold/30">
                  <s.icon className="h-5 w-5 text-gold mb-3" />
                  <div className="text-sm text-paper">{s.label}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {active === "websites"  && <Panel className="p-5 mt-4"><Row items={asRows(sites.data)}     empty="No websites yet." /></Panel>}
      {active === "apps"      && <Panel className="p-5 mt-4"><Row items={asRows(apps.data)}      empty="No apps yet." /></Panel>}
      {active === "workflows" && <Panel className="p-5 mt-4"><Row items={asRows(wf.data)}        empty="No workflows yet." /></Panel>}
      {active === "database"  && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Open the <Link to="/database-builder" className="text-gold underline">Database Builder</Link> for entities, relations, indexes, validation and preview.</div></Panel>}
      {active === "api"       && <Panel className="p-5 mt-4"><Row items={asRows(api.data)}       empty="No API endpoints yet." /></Panel>}
      {active === "ai"        && <Panel className="p-5 mt-4"><Row items={asRows(ai.data)}        empty="No agents yet." /></Panel>}
    </div>
  );
}
