/** /marketplace/sales — Seller sales history. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { commerceMySales } from "@/lib/cmos-v1.functions";

export const Route = createFileRoute("/_authenticated/marketplace/sales")({
  head: () => ({ meta: [{ title: "Sales — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["cmos", "sales"], queryFn: () => commerceMySales() });
    return (
      <>
        <PageHeader eyebrow="Seller" title="Sales" description="All marketplace sales for your account." />
        {q.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
          : (q.data ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="No sales yet" description="Publish listings to start selling." /></Panel>
            : <Panel className="p-5">
                <div className="divide-y divide-white/5">
                  {q.data!.map((o: any) => (
                    <div key={o.id} className="py-3 grid grid-cols-4 gap-3 text-xs">
                      <div className="text-paper truncate">{o.id.slice(0, 8)}…</div>
                      <div className="text-soft-gray">{new Intl.NumberFormat(undefined, { style: "currency", currency: o.currency }).format(o.amount_cents / 100)}</div>
                      <div className="text-soft-gray">{o.status}</div>
                      <div className="text-soft-gray">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </Panel>}
      </>
    );
  },
});
