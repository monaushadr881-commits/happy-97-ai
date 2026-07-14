/** /knowledge/search — Universal search. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, EmptyState, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { kbSearchArticles } from "@/lib/knowledge-v1.functions";

export const Route = createFileRoute("/_authenticated/knowledge/search")({
  head: () => ({ meta: [{ title: "Search — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const [q, setQ] = useState("");
    const r = useQuery({
      queryKey: ["kb", "search", q],
      queryFn: () => kbSearchArticles({ data: { q: q || undefined, scope: "all" } }),
    });
    return (
      <>
        <PageHeader eyebrow="Research" title="Universal Knowledge Search"
          description="Search across every domain — general knowledge, science, technology, arts, religion, culture, business, law, medicine (educational)." />
        <Panel className="p-4 mb-6">
          <Input placeholder="Search articles, topics, references…" value={q} onChange={(e) => setQ(e.target.value)} />
        </Panel>
        {r.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Searching…</Panel>
          : (r.data ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="No matches" description="Try a broader query or browse the Library." /></Panel>
            : <div className="grid gap-3 md:grid-cols-2">
                {r.data!.map((a: any) => (
                  <Panel key={a.id} className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {a.is_public ? <Chip tone="success">Public</Chip> : <Chip>Company</Chip>}
                      <span className="text-[10px] uppercase tracking-widest text-soft-gray">{a.language}</span>
                    </div>
                    <div className="text-sm font-serif text-paper">{a.title}</div>
                    <div className="text-[12px] text-soft-gray mt-1 line-clamp-3">{a.summary}</div>
                  </Panel>
                ))}
              </div>}
      </>
    );
  },
});
