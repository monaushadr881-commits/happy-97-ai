/** /hyperlocal/jobs — nearby jobs. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlSearchJobs } from "@/lib/hyperlocal-v1.functions";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/jobs")({
  head: () => ({ meta: [{ title: "Nearby Jobs — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Jobs,
});

function Jobs() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [applied, setApplied] = useState({ q: "", city: "" });
  const list = useQuery({ queryKey: ["hl", "jobs", applied], queryFn: () => hlSearchJobs({ data: { q: applied.q || undefined, city: applied.city || undefined, limit: 48 } }) });

  return (
    <>
      <PageHeader eyebrow="Jobs" title="Work near you" description="Part-time, full-time, internships and daily wage — all local, all verified." />
      <Panel className="p-4 mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={(e) => { e.preventDefault(); setApplied({ q, city }); }}>
          <Input placeholder="Title or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Button type="submit">Search</Button>
        </form>
      </Panel>
      {list.isLoading ? <div className="text-xs text-soft-gray">Loading…</div>
        : !list.data?.length ? <EmptyState icon={<Briefcase className="h-5 w-5" />} title="No jobs" description="Post one from My Listings." />
        : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.data.map((j) => (
              <Panel key={j.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-paper font-medium">{j.title}</div>
                  <Chip tone="info">{j.job_type}</Chip>
                </div>
                <div className="text-[11px] text-soft-gray mt-1">{j.category ?? "—"} · {j.city ?? "—"} {j.pincode ?? ""}</div>
                {j.description && <p className="text-xs text-soft-gray mt-2 line-clamp-3">{j.description}</p>}
                <div className="mt-2 text-[11px] text-gold/70">
                  {j.pay_min || j.pay_max ? `${j.currency ?? ""} ${j.pay_min ?? "?"} – ${j.pay_max ?? "?"}` : "Pay: on request"}
                </div>
              </Panel>
            ))}
          </div>
        )}
    </>
  );
}
