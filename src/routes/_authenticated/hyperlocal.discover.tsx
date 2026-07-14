/** /hyperlocal/discover — universal hyperlocal search. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlSearchBusinesses, hlSearchJobs, hlSearchEvents, hlSearchAlerts } from "@/lib/hyperlocal-v1.functions";
import { Search, Store, Briefcase, CalendarDays, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/discover")({
  head: () => ({ meta: [{ title: "Discover Nearby — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Discover,
});

function Discover() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [applied, setApplied] = useState({ q: "", city: "", pincode: "" });

  const args = { data: { q: applied.q || undefined, city: applied.city || undefined, pincode: applied.pincode || undefined, limit: 24 } } as const;
  const biz = useQuery({ queryKey: ["hl", "discover", "biz", applied], queryFn: () => hlSearchBusinesses(args) });
  const jobs = useQuery({ queryKey: ["hl", "discover", "jobs", applied], queryFn: () => hlSearchJobs(args) });
  const events = useQuery({ queryKey: ["hl", "discover", "events", applied], queryFn: () => hlSearchEvents(args) });
  const alerts = useQuery({ queryKey: ["hl", "discover", "alerts", applied], queryFn: () => hlSearchAlerts(args) });

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Nearby, in one search"
        description="Filter by city or pincode. Enable location on the Privacy tab for radius-based results."
      />

      <Panel className="p-4 mb-6">
        <form
          className="grid gap-3 md:grid-cols-[1fr_180px_140px_auto]"
          onSubmit={(e) => { e.preventDefault(); setApplied({ q, city, pincode }); }}
        >
          <Input placeholder="What are you looking for?" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          <Button type="submit" className="gap-2"><Search className="h-4 w-4" /> Search</Button>
        </form>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResultPanel title="Businesses" icon={<Store className="h-4 w-4 text-gold" />} loading={biz.isLoading} empty={!biz.data?.length}>
          {biz.data?.map((b) => (
            <div key={b.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3 mb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-paper">{b.name}</div>
                {b.verified && <Chip tone="gold">Verified</Chip>}
              </div>
              <div className="text-[11px] text-soft-gray mt-1">{b.category} · {b.city ?? "—"} {b.pincode ?? ""}</div>
              {b.distance_km != null && <div className="text-[11px] text-gold/70 mt-1">{b.distance_km.toFixed(1)} km away</div>}
            </div>
          ))}
        </ResultPanel>

        <ResultPanel title="Jobs" icon={<Briefcase className="h-4 w-4 text-gold" />} loading={jobs.isLoading} empty={!jobs.data?.length}>
          {jobs.data?.map((j) => (
            <div key={j.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3 mb-2">
              <div className="text-sm text-paper">{j.title}</div>
              <div className="text-[11px] text-soft-gray mt-1">{j.job_type} · {j.city ?? "—"} {j.pincode ?? ""}</div>
            </div>
          ))}
        </ResultPanel>

        <ResultPanel title="Events" icon={<CalendarDays className="h-4 w-4 text-gold" />} loading={events.isLoading} empty={!events.data?.length}>
          {events.data?.map((e) => (
            <div key={e.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3 mb-2">
              <div className="text-sm text-paper">{e.title}</div>
              <div className="text-[11px] text-soft-gray mt-1">{new Date(e.starts_at).toLocaleString()} · {e.city ?? "—"}</div>
            </div>
          ))}
        </ResultPanel>

        <ResultPanel title="Alerts" icon={<Bell className="h-4 w-4 text-gold" />} loading={alerts.isLoading} empty={!alerts.data?.length}>
          {alerts.data?.map((a) => (
            <div key={a.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3 mb-2">
              <div className="flex items-center gap-2">
                <Chip tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>{a.severity}</Chip>
                <span className="text-sm text-paper">{a.title}</span>
              </div>
              <div className="text-[11px] text-soft-gray mt-1">{a.kind} · {a.city ?? "—"} {a.pincode ?? ""}</div>
            </div>
          ))}
        </ResultPanel>
      </div>
    </>
  );
}

function ResultPanel({ title, icon, loading, empty, children }: { title: string; icon: React.ReactNode; loading: boolean; empty: boolean; children: React.ReactNode }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 mb-3">{icon}<div className="text-xs uppercase tracking-[0.2em] text-soft-gray">{title}</div></div>
      {loading ? <div className="text-xs text-soft-gray">Loading…</div>
        : empty ? <EmptyState title="No matches" description="Try a broader city or pincode." />
        : <div>{children}</div>}
    </Panel>
  );
}
