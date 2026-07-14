/** /knowledge/sources — document library. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState, Chip } from "@/design-system/primitives";
import { kbListDocuments } from "@/lib/knowledge-v1.functions";

export const Route = createFileRoute("/_authenticated/knowledge/sources")({
  head: () => ({ meta: [{ title: "Sources — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["kb", "docs"], queryFn: () => kbListDocuments({ data: {} }) });
    return (
      <>
        <PageHeader eyebrow="Sources" title="Source Documents"
          description="Books, research papers, policies, manuals, articles, approved uploads — the raw material powering the Knowledge Graph." />
        {q.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
          : (q.data ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="No documents yet" description="Company admins can add source documents from Enterprise → Content." /></Panel>
            : <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {q.data!.map((d: any) => (
                  <Panel key={d.id} className="p-5">
                    <div className="text-sm font-serif text-paper">{d.title}</div>
                    <div className="text-[11px] text-soft-gray mt-1">{d.mime_type ?? "—"} · {d.language}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(d.tags ?? []).slice(0, 6).map((t: string) => <Chip key={t}>{t}</Chip>)}
                    </div>
                  </Panel>
                ))}
              </div>}
      </>
    );
  },
});
