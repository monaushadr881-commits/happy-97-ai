/** /marketplace/orders — Buyer Center. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { commerceMyOrders } from "@/lib/cmos-v1.functions";
import { VirtualTable, type VirtualTableColumn } from "@/components/ui/virtual-table";

type Order = { id: string; currency: string; amount_cents: number; status: string; created_at: string };

export const Route = createFileRoute("/_authenticated/marketplace/orders")({
  head: () => ({ meta: [{ title: "My orders — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["cmos", "orders"], queryFn: () => commerceMyOrders() });
    const rows = (q.data ?? []) as Order[];

    const columns: VirtualTableColumn<Order>[] = [
      { key: "id", header: "Order", cell: (o) => <span className="text-paper truncate">{o.id.slice(0, 8)}…</span> },
      {
        key: "amount",
        header: "Amount",
        cell: (o) => (
          <span className="text-soft-gray">
            {new Intl.NumberFormat(undefined, { style: "currency", currency: o.currency }).format(o.amount_cents / 100)}
          </span>
        ),
      },
      { key: "status", header: "Status", cell: (o) => <span className="text-soft-gray">{o.status}</span> },
      { key: "created", header: "Date", cell: (o) => <span className="text-soft-gray">{new Date(o.created_at).toLocaleDateString()}</span> },
    ];

    return (
      <>
        <PageHeader eyebrow="Buyer Center" title="My Orders" description="Every order is auditable and belongs to you." />
        {q.isLoading ? (
          <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
        ) : rows.length === 0 ? (
          <Panel className="p-8"><EmptyState title="No orders yet" description="Buy something from the marketplace to see it here." /></Panel>
        ) : (
          <Panel className="p-0 overflow-hidden">
            <VirtualTable
              rows={rows}
              columns={columns}
              getRowKey={(o) => o.id}
              rowHeight={44}
              height={560}
              ariaLabel="My orders"
              className="border-0 bg-transparent"
            />
          </Panel>
        )}
      </>
    );
  },
});
