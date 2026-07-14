/** /hyperlocal — HIOS dashboard. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { hlDashboard } from "@/lib/hyperlocal-v1.functions";
import { Search, Store, Briefcase, CalendarDays, Bell, Sparkles, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/")({
  head: () => ({ meta: [{ title: "Hyperlocal OS — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: HyperlocalDashboard,
});

const SURFACES = [
  { to: "/hyperlocal/discover", label: "Discover Nearby", icon: Search, desc: "Businesses, services, events and alerts around you." },
  { to: "/hyperlocal/businesses", label: "Businesses", icon: Store, desc: "Verified hyperlocal business profiles." },
  { to: "/hyperlocal/jobs", label: "Jobs", icon: Briefcase, desc: "Part-time, full-time and daily-wage jobs near you." },
  { to: "/hyperlocal/events", label: "Events", icon: CalendarDays, desc: "Local, cultural, religious and business events." },
  { to: "/hyperlocal/alerts", label: "Alerts", icon: Bell, desc: "Community, emergency and offer alerts." },
  { to: "/hyperlocal/ask", label: "Ask HAPPY", icon: Sparkles, desc: "Hyperlocal recommendations with transparent sources." },
  { to: "/hyperlocal/map", label: "Map View", icon: MapPin, desc: "Visualise nearby listings on a map." },
  { to: "/hyperlocal/manage", label: "My Listings", icon: ShieldCheck, desc: "Manage your own businesses, jobs and events." },
];

function HyperlocalDashboard() {
  const d = useQuery({ queryKey: ["hl", "dashboard"], queryFn: () => hlDashboard() });
  const s = d.data;
  return (
    <>
      <PageHeader
        eyebrow="Hyperlocal Intelligence OS"
        title="AAS PAAS — nearby, verified, AI-powered"
        description="Discover verified businesses, services, jobs, events and community alerts around you. Location is always opt-in; HAPPY presents recommendations transparently."
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          ["Active businesses", s?.businesses],
          ["Open jobs", s?.jobs],
          ["Upcoming events", s?.events],
          ["Active alerts", s?.alerts],
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
