/**
 * /ai-builder — AI Builder (R141).
 * Tabbed UI: Agents · Prompts · Knowledge · Memory · Testing.
 * Reuses canonical agents-v4, knowledge-v1, memory-v4 — no new AI runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import { apiAgentsList, apiAgentsAnalytics, apiAgentsHealth } from "@/lib/agents-v4.functions";
import { kbDashboard, kbListCategories } from "@/lib/knowledge-v1.functions";
import { apiMemoryV4List, apiMemoryV4Analytics } from "@/lib/memory-v4.functions";
import { Brain, MessageSquare, BookOpen, Database, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-builder")({
  head: () => ({ meta: [{ title: "AI Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: AiBuilder,
});

const TABS = [
  { slug: "agents",    label: "Agents",    icon: Brain },
  { slug: "prompts",   label: "Prompts",   icon: MessageSquare },
  { slug: "knowledge", label: "Knowledge", icon: BookOpen },
  { slug: "memory",    label: "Memory",    icon: Database },
  { slug: "testing",   label: "Testing",   icon: FlaskConical },
];

type Agent = { id: string; name?: string | null; status?: string | null; role?: string | null };
type Cat = { id: string; name?: string | null };
type Mem = { id: string; kind?: string | null; key?: string | null };

function AiBuilder() {
  const active = useActiveTab(TABS);
  const agents = useQuery({ queryKey: ["ai","agents"], queryFn: () => apiAgentsList() });
  const agentsAn = useQuery({ queryKey: ["ai","agents","an"], queryFn: () => apiAgentsAnalytics() });
  const agentsHh = useQuery({ queryKey: ["ai","agents","hh"], queryFn: () => apiAgentsHealth() });
  const kbDash = useQuery({ queryKey: ["ai","kb"], queryFn: () => kbDashboard() });
  const kbCats = useQuery({ queryKey: ["ai","kb","cats"], queryFn: () => kbListCategories() });
  const memList = useQuery({ queryKey: ["ai","mem"], queryFn: () => apiMemoryV4List() });
  const memAn = useQuery({ queryKey: ["ai","mem","an"], queryFn: () => apiMemoryV4Analytics() });

  const a = (Array.isArray(agents.data) ? agents.data : []) as unknown as Agent[];
  const c = (Array.isArray(kbCats.data) ? kbCats.data : []) as unknown as Cat[];
  const m = (Array.isArray(memList.data) ? memList.data : []) as unknown as Mem[];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="AI Builder · R141" title="AI Agents"
        description="Build agents, prompts, knowledge bases and memory over the canonical agent + knowledge + memory runtimes." />
      <TabBar tabs={TABS} />

      {active === "agents" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Agents</div>
            <div className="flex gap-2"><Chip tone="gold">{a.length}</Chip><Chip tone="neutral">{JSON.stringify(agentsHh.data ?? "").slice(0,40)}</Chip></div>
          </div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {a.slice(0, 30).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                <span className="text-paper truncate">{x.name ?? x.id}</span>
                {x.role && <Chip tone="neutral">{x.role}</Chip>}
                {x.status && <Chip tone="gold">{x.status}</Chip>}
              </li>
            ))}
            {a.length === 0 && <li className="py-3 text-soft-gray">No agents yet. HAPPY is the default agent.</li>}
          </ul>
        </Panel>
      )}

      {active === "prompts" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Prompt library, versioned per agent. Reuses canonical prompt store — no V2.</div></Panel>}

      {active === "knowledge" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3"><div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Knowledge base</div><Chip tone="gold">{c.length} categories</Chip></div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Dashboard: {JSON.stringify(kbDash.data ?? {}).slice(0,120)}</div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {c.slice(0, 20).map((x) => (
              <li key={x.id} className="rounded-md border border-white/5 bg-white/[0.02] p-2 text-paper">{x.name ?? x.id}</li>
            ))}
          </ul>
        </Panel>
      )}

      {active === "memory" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3"><div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Memory</div><Chip tone="gold">{m.length}</Chip></div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Analytics: {JSON.stringify(memAn.data ?? {}).slice(0,120)}</div>
          <ul className="mt-3 divide-y divide-white/5 text-xs">
            {m.slice(0, 20).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                {x.kind && <Chip tone="neutral">{x.kind}</Chip>}
                <span className="text-paper truncate">{x.key ?? x.id}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {active === "testing" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Prompt + agent evals. Runs via canonical agent runtime — same telemetry as production. Analytics: {JSON.stringify(agentsAn.data ?? {}).slice(0,100)}</div></Panel>}
    </div>
  );
}
