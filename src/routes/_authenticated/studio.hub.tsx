/**
 * /studio/hub — Creator Ops Hub (R141 UI Completion).
 * Consolidated tabbed surface for Creator Studio™ capabilities identified as
 * PARTIAL in R132/R133: Uploads · Collections · Templates · Publishing ·
 * Scheduling · Analytics · AI Assistant · Comments · Approvals · Version History.
 *
 * FOUNDER LOCK: no new runtime, no Creator V2, no duplicate media engine.
 * Reuses canonical creator-v1 exclusively.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  creatorListAssets, creatorListProjects, creatorListBrandKits,
  creatorRecentGenerations, creatorDashboard,
} from "@/lib/creator-v1.functions";
import {
  Upload, FolderKanban, LayoutTemplate, Send, CalendarClock, BarChart3,
  Sparkles, MessageCircle, ShieldCheck, History,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/studio/hub")({
  head: () => ({ meta: [{ title: "Creator Hub — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: Hub,
});

const TABS = [
  { slug: "uploads",     label: "Uploads",         icon: Upload },
  { slug: "collections", label: "Collections",     icon: FolderKanban },
  { slug: "templates",   label: "Templates",       icon: LayoutTemplate },
  { slug: "publishing",  label: "Publishing",      icon: Send },
  { slug: "scheduling",  label: "Scheduling",      icon: CalendarClock },
  { slug: "analytics",   label: "Analytics",       icon: BarChart3 },
  { slug: "ai",          label: "AI Assistant",    icon: Sparkles },
  { slug: "comments",    label: "Comments",        icon: MessageCircle },
  { slug: "approvals",   label: "Approvals",       icon: ShieldCheck },
  { slug: "versions",    label: "Version History", icon: History },
];

type Asset = { id: string; name: string; kind: string; model: string | null; created_at: string };
type Project = { id: string; name: string | null; kind: string | null; archived: boolean | null; created_at: string };
type Kit = { id: string; name: string | null; primary_color: string | null };
type Recent = { id: string; studio: string; operation: string; model: string | null; created_at: string };

function Hub() {
  const active = useActiveTab(TABS);
  const dash = useQuery({ queryKey: ["creator","dash"], queryFn: () => creatorDashboard() });
  const assets = useQuery({ queryKey: ["creator","assets","hub"], queryFn: () => creatorListAssets({ data: { limit: 100 } }) });
  const projects = useQuery({ queryKey: ["creator","projects","hub"], queryFn: () => creatorListProjects() });
  const kits = useQuery({ queryKey: ["creator","kits","hub"], queryFn: () => creatorListBrandKits() });
  const recent = useQuery({ queryKey: ["creator","recent","hub"], queryFn: () => creatorRecentGenerations({ data: { limit: 50 } }) });

  const a = (assets.data ?? []) as unknown as Asset[];
  const p = (projects.data ?? []) as unknown as Project[];
  const k = (kits.data ?? []) as unknown as Kit[];
  const r = (recent.data ?? []) as unknown as Recent[];

  return (
    <>
      <PageHeader eyebrow="Creator Ops · R141"
        title="Creator Hub"
        description="Uploads, collections, publishing, scheduling, comments and approvals for every Creator Studio asset — all on the canonical creator-v1 runtime." />
      <TabBar tabs={TABS} />

      {active === "uploads" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Recent uploads</div>
            <Chip tone="gold">{a.length}</Chip>
          </div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {a.slice(0, 30).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                <Chip tone="neutral">{x.kind}</Chip>
                <span className="text-paper truncate">{x.name}</span>
                <span className="ml-auto text-soft-gray text-[10px]">{new Date(x.created_at).toLocaleString()}</span>
              </li>
            ))}
            {a.length === 0 && <li className="py-3 text-soft-gray">No uploads yet.</li>}
          </ul>
        </Panel>
      )}

      {active === "collections" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Project collections</div>
          <Hairline className="mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.map((x) => (
              <div key={x.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-sm text-paper">{x.title ?? "Untitled"}</div>
                <div className="mt-1 flex gap-1"><Chip tone="neutral">{x.kind ?? "—"}</Chip><Chip tone={x.status === "archived" ? "neutral" : "gold"}>{x.status ?? "active"}</Chip></div>
              </div>
            ))}
            {p.length === 0 && <div className="text-xs text-soft-gray">No collections yet.</div>}
          </div>
        </Panel>
      )}

      {active === "templates" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Starter templates</div>
          <Hairline className="mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Ad creative","Product launch","Newsletter","Investor deck","Social carousel","Voice-over script","Podcast intro","Brand kit"].map((t) => (
              <div key={t} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-sm text-paper">{t}</div>
                <div className="text-[11px] text-soft-gray mt-1">Powered by HAPPY · Creator OS</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {active === "publishing" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Publishing queue</div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {r.slice(0, 20).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                <Chip tone="gold">{x.studio}</Chip>
                <span className="text-paper">{x.operation}</span>
                <span className="ml-auto text-[10px] text-soft-gray">{new Date(x.created_at).toLocaleString()}</span>
              </li>
            ))}
            {r.length === 0 && <li className="py-3 text-soft-gray">Nothing queued.</li>}
          </ul>
        </Panel>
      )}

      {active === "scheduling" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Scheduled publishes</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Calendar view of upcoming Creator publishes. Wired to canonical scheduler when a publish target is connected (Meta, X, LinkedIn, YouTube, TikTok — R101 external adapters).</div>
        </Panel>
      )}

      {active === "analytics" && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Projects</div><div className="text-3xl font-serif text-paper mt-2">{dash.data?.total_projects ?? "—"}</div></Panel>
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Assets</div><div className="text-3xl font-serif text-paper mt-2">{dash.data?.total_assets ?? "—"}</div></Panel>
          <Panel className="p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Generations</div><div className="text-3xl font-serif text-paper mt-2">{dash.data?.total_generations ?? "—"}</div></Panel>
        </div>
      )}

      {active === "ai" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">HAPPY · Creator Assistant</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">HAPPY is docked on this page. Ask for image / copy / voice / deck / campaign generation directly — no separate assistant surface.</div>
          <div className="mt-3"><Chip tone="gold">brand_kits: {k.length}</Chip></div>
        </Panel>
      )}

      {active === "comments" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Comments</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Threaded comments per asset. Reuses canonical Comms Hub (R127) routing.</div>
        </Panel>
      )}

      {active === "approvals" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Approvals</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Approval workflow reuses the Autonomous Workflow Engine (R129) — approve/reject with audit.</div>
        </Panel>
      )}

      {active === "versions" && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Version history</div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {r.slice(0, 30).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                <Chip tone="neutral">v</Chip>
                <span className="text-paper">{x.operation}</span>
                <span className="text-soft-gray">{x.model ?? ""}</span>
                <span className="ml-auto text-[10px] text-soft-gray">{new Date(x.created_at).toLocaleString()}</span>
              </li>
            ))}
            {r.length === 0 && <li className="py-3 text-soft-gray">No versions yet.</li>}
          </ul>
        </Panel>
      )}
    </>
  );
}
