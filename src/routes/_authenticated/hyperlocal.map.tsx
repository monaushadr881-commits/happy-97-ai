/** /hyperlocal/map — placeholder map view with list clustering. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { hlSearchBusinesses } from "@/lib/hyperlocal-v1.functions";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/map")({
  head: () => ({ meta: [{ title: "Hyperlocal Map — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: MapView,
});

function MapView() {
  const list = useQuery({ queryKey: ["hl", "map"], queryFn: () => hlSearchBusinesses({ data: { limit: 100 } }) });
  const rows = list.data ?? [];
  const grouped = new Map<string, typeof rows>();
  rows.forEach((r) => {
    const key = r.city || r.pincode || "Unknown";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  return (
    <>
      <PageHeader
        eyebrow="Map"
        title="Cluster view"
        description="A live map layer plugs in here. Until then, listings cluster by city / pincode."
      />
      <Panel className="p-8 mb-6 border-dashed border border-gold/15 bg-gold/[0.02] text-center">
        <MapPin className="h-6 w-6 text-gold mx-auto mb-3" />
        <div className="text-sm text-paper">Map layer ready to plug in</div>
        <div className="text-[11px] text-soft-gray mt-1">Connect a maps provider under Enterprise → Integrations to enable directions, routing and travel time.</div>
      </Panel>
      {!rows.length ? <EmptyState title="No geo-located listings" />
        : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[...grouped.entries()].map(([k, items]) => (
              <Panel key={k} className="p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">{k}</div>
                <div className="text-2xl font-serif text-paper">{items.length}</div>
                <div className="text-[11px] text-soft-gray mt-1">listings</div>
              </Panel>
            ))}
          </div>
        )}
    </>
  );
}
