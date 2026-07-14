/** /knowledge/library — browse articles. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState, Chip } from "@/design-system/primitives";
import { kbSearchArticles, kbListCategories } from "@/lib/knowledge-v1.functions";

export const Route = createFileRoute("/_authenticated/knowledge/library")({
  head: () => ({ meta: [{ title: "Library — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const cats = useQuery({ queryKey: ["kb", "cats"], queryFn: () => kbListCategories() });
    const arts = useQuery({ queryKey: ["kb", "public"], queryFn: () => kbSearchArticles({ data: { scope: "public" } }) });
    return (
      <>
        <PageHeader eyebrow="Library" title="Public Knowledge"
          description="Curated, cited and versioned. Company knowledge remains isolated until explicitly published." />
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <Panel className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-soft-gray mb-2">Categories</div>
            <div className="space-y-1 text-xs">
              {(cats.data ?? []).slice(0, 60).map((c: any) => (
                <div key={c.id} className="text-soft-gray">{c.name}</div>
              ))}
              {cats.data?.length === 0 && <div className="text-soft-gray">No categories yet.</div>}
            </div>
          </Panel>
          <div className="grid gap-3 md:grid-cols-2">
            {arts.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
              : (arts.data ?? []).length === 0
                ? <Panel className="p-8 md:col-span-2"><EmptyState title="No public articles yet" description="Company admins can publish articles to make them public." /></Panel>
                : arts.data!.map((a: any) => (
                  <Panel key={a.id} className="p-5">
                    <Chip tone="success">Public</Chip>
                    <div className="text-sm font-serif text-paper mt-2">{a.title}</div>
                    <div className="text-[12px] text-soft-gray mt-1 line-clamp-3">{a.summary}</div>
                  </Panel>
                ))}
          </div>
        </div>
      </>
    );
  },
});
