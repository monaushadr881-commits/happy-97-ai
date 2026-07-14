/** /hyperlocal/events — nearby events. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlSearchEvents } from "@/lib/hyperlocal-v1.functions";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/events")({
  head: () => ({ meta: [{ title: "Nearby Events — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Events,
});

function Events() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [applied, setApplied] = useState({ q: "", city: "" });
  const list = useQuery({ queryKey: ["hl", "events", applied], queryFn: () => hlSearchEvents({ data: { q: applied.q || undefined, city: applied.city || undefined, limit: 48 } }) });

  return (
    <>
      <PageHeader eyebrow="Events" title="What's happening around you" description="Religious, educational, business, government and cultural events." />
      <Panel className="p-4 mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={(e) => { e.preventDefault(); setApplied({ q, city }); }}>
          <Input placeholder="Title or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Button type="submit">Search</Button>
        </form>
      </Panel>
      {list.isLoading ? <div className="text-xs text-soft-gray">Loading…</div>
        : !list.data?.length ? <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No events" description="Nothing coming up in this area." />
        : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.data.map((e) => (
              <Panel key={e.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-paper font-medium">{e.title}</div>
                  {e.category && <Chip tone="gold">{e.category}</Chip>}
                </div>
                <div className="text-[11px] text-soft-gray mt-1">{new Date(e.starts_at).toLocaleString()}</div>
                <div className="text-[11px] text-soft-gray">{e.venue ?? [e.city, e.pincode].filter(Boolean).join(" ")}</div>
                {e.description && <p className="text-xs text-soft-gray mt-2 line-clamp-3">{e.description}</p>}
              </Panel>
            ))}
          </div>
        )}
    </>
  );
}
