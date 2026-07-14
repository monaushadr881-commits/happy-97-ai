/** /knowledge — dashboard. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { kbDashboard } from "@/lib/knowledge-v1.functions";
import { Search, Library, Sparkles, FileStack, Landmark, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/knowledge/")({
  head: () => ({ meta: [{ title: "Knowledge OS — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: KnowledgeDashboard,
});

const SURFACES = [
  { to: "/knowledge/search", label: "Universal Search", icon: Search, desc: "Semantic, concept and reference search across every domain." },
  { to: "/knowledge/library", label: "Library", icon: Library, desc: "Public & company articles, categorised and cited." },
  { to: "/knowledge/ask", label: "Ask HAPPY", icon: Sparkles, desc: "Attributed answers with viewpoints separated from facts." },
  { to: "/knowledge/sources", label: "Sources", icon: FileStack, desc: "Documents, uploads and citations powering the graph." },
  { to: "/knowledge/religion-culture", label: "Religion & Culture", icon: Landmark, desc: "Respectful, multi-tradition, multi-viewpoint knowledge." },
  { to: "/knowledge/moderation", label: "Moderation", icon: ShieldCheck, desc: "Drafts, approval workflow, publishing." },
];

function KnowledgeDashboard() {
  const d = useQuery({ queryKey: ["kb", "dashboard"], queryFn: () => kbDashboard() });
  const s = d.data;
  return (
    <>
      <PageHeader eyebrow="Knowledge OS" title="World Knowledge Intelligence"
        description="The central knowledge layer for HAPPY X — powering Education, Business, Creator, Digital Human, Community and Marketplace with cited, versioned, multi-viewpoint knowledge." />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          ["Public articles", s?.public_articles],
          ["Categories", s?.categories],
          ["Source documents", s?.documents],
          ["Drafts in review", s?.drafts],
        ].map(([k, v]) => (
          <Panel key={String(k)} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{k}</div>
            <div className="text-3xl font-serif text-paper mt-2">{v ?? "—"}</div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Surfaces</div>
        <Hairline className="mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((x) => (
            <Link key={x.to} to={x.to}
              className="group rounded-md border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-gold/30 hover:bg-gold/[0.03]">
              <x.icon className="h-5 w-5 text-gold mb-3" />
              <div className="text-sm text-paper font-medium">{x.label}</div>
              <div className="text-[11px] text-soft-gray mt-1">{x.desc}</div>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
