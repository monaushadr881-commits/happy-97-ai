/** /marketplace — Browse. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, EmptyState, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { marketBrowse, commercePurchase } from "@/lib/cmos-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketplace/")({
  head: () => ({ meta: [{ title: "Marketplace — Browse — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: BrowsePage,
});

function money(cents: number, cur: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(cents / 100);
}

function BrowsePage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["cmos", "market", "browse", q],
    queryFn: () => marketBrowse({ data: { q: q || undefined } }),
  });
  const buy = useMutation({
    mutationFn: (id: string) => commercePurchase({ data: { listing_id: id, provider: "mock" } }),
    onSuccess: () => { toast.success("Order created (pending)"); qc.invalidateQueries({ queryKey: ["cmos", "orders"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Purchase failed"),
  });
  return (
    <>
      <PageHeader eyebrow="Marketplace" title="Discover"
        description="Digital & physical products, courses, templates, AI agents, prompt packs, plugins, brand assets, subscriptions and services." />
      <Panel className="p-4 mb-6 flex gap-2">
        <Input placeholder="Search listings…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Panel>
      {list.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
        : (list.data ?? []).length === 0
          ? <Panel className="p-8"><EmptyState title="No listings yet" description="Sellers can publish from the Seller Center." /></Panel>
          : <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {list.data!.map((l: any) => (
                <Panel key={l.id} className="p-5">
                  {l.cover_url && <img src={l.cover_url} alt="" className="rounded-md mb-3 aspect-video object-cover" />}
                  <div className="text-sm font-serif text-paper">{l.title}</div>
                  <div className="text-[11px] text-soft-gray mt-1 line-clamp-2">{l.description}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gold">{money(l.price_cents, l.currency)}</div>
                    {l.category && <Chip>{l.category}</Chip>}
                  </div>
                  <Button className="mt-3 w-full" size="sm" onClick={() => buy.mutate(l.id)} disabled={buy.isPending}>
                    Buy
                  </Button>
                </Panel>
              ))}
            </div>}
    </>
  );
}
