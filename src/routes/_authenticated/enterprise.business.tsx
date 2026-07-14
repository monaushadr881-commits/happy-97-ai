/** /enterprise/business — CRM · ERP · Orders · Invoices · Revenue. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListOrders, entListInvoices } from "@/lib/enterprise-v1.functions";
import { ShoppingCart, Receipt, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/business")({
  head: () => ({ meta: [{ title: "Business — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Business,
});

type Order = { id: string; order_number?: string; status?: string; total_cents?: number; currency?: string; created_at?: string };
type Invoice = { id: string; invoice_number?: string; status?: string; total_cents?: number; currency?: string; issued_at?: string };

function Business() {
  const { companyId, companies } = useEnterprise();
  const orders = useQuery({ queryKey: ["ent", "orders", companyId], enabled: !!companyId, queryFn: () => entListOrders({ data: { company_id: companyId!, limit: 50 } }) });
  const invoices = useQuery({ queryKey: ["ent", "invoices", companyId], enabled: !!companyId, queryFn: () => entListInvoices({ data: { company_id: companyId!, limit: 50 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business" title="Business" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const oRows = (orders.data ?? []) as Order[];
  const iRows = (invoices.data ?? []) as Invoice[];
  const revenue = oRows.reduce((a, o) => a + (o.total_cents ?? 0), 0);
  const receivable = iRows.filter((i) => i.status !== "paid").reduce((a, i) => a + (i.total_cents ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Business" title="Business Modules" description="CRM, ERP, orders, invoices and revenue — the operating ledger of the company." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Orders" value={oRows.length.toLocaleString()} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Order Revenue" value={`$${(revenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Invoices" value={iRows.length.toLocaleString()} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Receivable" value={`$${(receivable / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<Receipt className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Orders</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {oRows.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{o.order_number ?? o.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{o.created_at ? new Date(o.created_at).toLocaleString() : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{o.currency ?? "$"} {((o.total_cents ?? 0) / 100).toFixed(2)}</span>
                  <Chip tone={o.status === "fulfilled" ? "success" : o.status === "cancelled" ? "danger" : "info"}>{o.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!oRows.length && <li className="py-2 text-xs text-soft-gray">No orders.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Invoices</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {iRows.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{i.invoice_number ?? i.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{i.issued_at ? new Date(i.issued_at).toLocaleString() : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{i.currency ?? "$"} {((i.total_cents ?? 0) / 100).toFixed(2)}</span>
                  <Chip tone={i.status === "paid" ? "success" : i.status === "overdue" ? "danger" : "warning"}>{i.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!iRows.length && <li className="py-2 text-xs text-soft-gray">No invoices.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
