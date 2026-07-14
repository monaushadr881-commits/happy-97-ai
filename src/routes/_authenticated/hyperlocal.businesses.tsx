/** /hyperlocal/businesses — browse verified businesses. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlSearchBusinesses } from "@/lib/hyperlocal-v1.functions";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hyperlocal/businesses")({
  head: () => ({ meta: [{ title: "Nearby Businesses — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Businesses,
});

function Businesses() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState(false);
  const [applied, setApplied] = useState({ q: "", city: "", category: "", verified: false });

  const list = useQuery({
    queryKey: ["hl", "businesses", applied],
    queryFn: () => hlSearchBusinesses({ data: {
      q: applied.q || undefined,
      city: applied.city || undefined,
      category: applied.category || undefined,
      verified_only: applied.verified,
      limit: 48,
    } }),
  });

  return (
    <>
      <PageHeader eyebrow="Businesses" title="Verified & nearby" description="Filter by category, city or verification status." />

      <Panel className="p-4 mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto_auto]" onSubmit={(e) => { e.preventDefault(); setApplied({ q, city, category, verified }); }}>
          <Input placeholder="Search name / description" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-soft-gray"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Verified only</label>
          <Button type="submit">Apply</Button>
        </form>
      </Panel>

      {list.isLoading ? (
        <div className="text-xs text-soft-gray">Loading…</div>
      ) : !list.data?.length ? (
        <EmptyState title="No businesses" description="Try widening filters or add a listing under My Listings." icon={<Store className="h-5 w-5" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.data.map((b) => (
            <Panel key={b.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-paper font-medium">{b.name}</div>
                {b.verified && <Chip tone="gold">Verified</Chip>}
              </div>
              <div className="text-[11px] text-soft-gray mt-1">{b.category}{b.subcategory ? ` · ${b.subcategory}` : ""}</div>
              <div className="text-[11px] text-soft-gray mt-1">{b.address ?? [b.city, b.pincode].filter(Boolean).join(" ")}</div>
              {b.description && <p className="text-xs text-soft-gray mt-2 line-clamp-3">{b.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gold/70">
                {b.rating_avg ? <span>★ {Number(b.rating_avg).toFixed(1)} ({b.rating_count})</span> : <span className="text-soft-gray">No ratings yet</span>}
                {b.phone && <a href={`tel:${b.phone}`} className="ml-auto rounded border border-white/10 px-2 py-0.5 hover:border-gold/30">Call</a>}
                {b.whatsapp && <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded border border-white/10 px-2 py-0.5 hover:border-gold/30">WhatsApp</a>}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
