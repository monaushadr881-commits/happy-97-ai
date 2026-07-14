/** /education/search — universal search across the Education OS. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { eduSearch } from "@/lib/education-v1.functions";

export const Route = createFileRoute("/_authenticated/education/search")({
  head: () => ({ meta: [{ title: "Search — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Search,
});

function Search() {
  const [q, setQ] = useState("");
  const res = useQuery({
    queryKey: ["edu", "search", q],
    enabled: q.trim().length >= 2,
    queryFn: () => eduSearch({ data: { q: q.trim(), limit: 10 } }),
  });
  const d = res.data;

  const bucket = (label: string, items: Array<{ id: string; [k: string]: unknown }>, render: (i: { id: string; [k: string]: unknown }) => React.ReactNode) => (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{label}</h3>
        <Chip tone="info">{items.length}</Chip>
      </div>
      <Hairline className="my-3" />
      {items.length ? <ul className="divide-y divide-white/5">{items.map((i) => <li key={i.id} className="py-2 text-sm text-paper">{render(i)}</li>)}</ul>
      : <p className="text-xs text-soft-gray">Nothing found.</p>}
    </Panel>
  );

  return (
    <>
      <PageHeader eyebrow="Education OS" title="Universal search" description="Courses, lessons, notes, flashcards, uploads — one search box." />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anything…" className="max-w-lg" />
      {q.trim().length < 2 ? (
        <Panel className="mt-6 p-6 text-sm text-soft-gray">Type at least two characters to search.</Panel>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bucket("Courses", (d?.courses ?? []) as Array<{ id: string; title?: string; level?: string }>, (i) => <>{i.title} <span className="text-[11px] text-soft-gray">{i.level ?? ""}</span></>)}
          {bucket("Lessons", (d?.lessons ?? []) as Array<{ id: string; title?: string }>, (i) => <>{i.title}</>)}
          {bucket("Notes", (d?.notes ?? []) as Array<{ id: string; title?: string; body?: string }>, (i) => <>{i.title ?? (i.body as string)?.slice(0, 60)}</>)}
          {bucket("Flashcards", (d?.flashcards ?? []) as Array<{ id: string; front?: string; deck?: string }>, (i) => <>{i.front} <span className="text-[11px] text-soft-gray">{i.deck ?? ""}</span></>)}
          {bucket("Uploads", (d?.uploads ?? []) as Array<{ id: string; title?: string; kind?: string }>, (i) => <>{i.title} <span className="text-[11px] text-soft-gray">{i.kind}</span></>)}
        </div>
      )}
    </>
  );
}
