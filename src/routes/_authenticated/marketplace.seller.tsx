/** /marketplace/seller — Seller Center. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Hairline, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { marketCreateListing, marketMyListings, marketUpdateListing, commerceSellerStats } from "@/lib/cmos-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketplace/seller")({
  head: () => ({ meta: [{ title: "Seller Center — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: SellerCenter,
});

function money(cents: number, cur: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(cents / 100);
}

function SellerCenter() {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ["cmos", "seller", "stats"], queryFn: () => commerceSellerStats() });
  const mine = useQuery({ queryKey: ["cmos", "seller", "mine"], queryFn: () => marketMyListings() });
  const [f, setF] = useState({ title: "", description: "", price: "1000", currency: "USD", category: "" });
  const create = useMutation({
    mutationFn: () => marketCreateListing({
      data: { title: f.title, description: f.description, price_cents: Number(f.price) || 0,
        currency: f.currency, category: f.category || undefined, status: "draft" },
    }),
    onSuccess: () => { toast.success("Listing created"); setF({ ...f, title: "", description: "" }); qc.invalidateQueries({ queryKey: ["cmos", "seller"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });
  const publish = useMutation({
    mutationFn: (id: string) => marketUpdateListing({ data: { id, patch: { status: "active" } } }),
    onSuccess: () => { toast.success("Published"); qc.invalidateQueries({ queryKey: ["cmos", "seller"] }); },
  });

  const s = stats.data;
  return (
    <>
      <PageHeader eyebrow="Marketplace" title="Seller Center"
        description="Manage your catalog, pricing, inventory sync, orders and payouts. You own every listing." />
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          ["Listings", s?.total_listings], ["Active", s?.active_listings],
          ["Orders", s?.total_orders], ["Gross", s ? money(s.gross_cents ?? 0, "USD") : "—"],
        ].map(([k, v]) => (
          <Panel key={String(k)} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{k}</div>
            <div className="text-3xl font-serif text-paper mt-2">{v ?? "—"}</div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">New listing</div>
        <Hairline className="mb-3" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Input placeholder="Category (optional)" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <Input placeholder="Price (cents)" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <Input placeholder="Currency (USD)" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} />
        </div>
        <Textarea className="mt-3 min-h-20" placeholder="Description"
          value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex justify-end mt-3">
          <Button onClick={() => create.mutate()} disabled={!f.title.trim() || create.isPending}>Create draft</Button>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">My catalog</div>
        <Hairline className="mb-3" />
        {mine.isLoading ? <div className="text-xs text-soft-gray">Loading…</div>
          : (mine.data ?? []).length === 0
            ? <EmptyState title="No listings yet" description="Create your first listing above." />
            : <div className="divide-y divide-white/5">
                {mine.data!.map((l: any) => (
                  <div key={l.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-paper">{l.title}</div>
                      <div className="text-[11px] text-soft-gray">{l.status} · {money(l.price_cents, l.currency)} · ★ {Number(l.rating_avg).toFixed(1)} ({l.rating_count})</div>
                    </div>
                    {l.status !== "active" && (
                      <Button size="sm" variant="outline" onClick={() => publish.mutate(l.id)}>Publish</Button>
                    )}
                  </div>
                ))}
              </div>}
      </Panel>
    </>
  );
}
