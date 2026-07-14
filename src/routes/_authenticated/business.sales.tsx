/** /business/sales — Orders, Invoices, Payments, Revenue. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListSalesOrders, bizListInvoices, bizListPayments } from "@/lib/business-v1.functions";
import { ShoppingCart, Receipt, CreditCard, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/sales")({
  head: () => ({ meta: [{ title: "Sales — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Sales,
});

type Order = { id: string; number: string | null; status: string | null; total_cents: number | null; currency: string | null; ordered_at: string | null };
type Invoice = { id: string; number: string | null; status: string | null; total_cents: number | null; amount_paid_cents: number | null; currency: string | null; issued_at: string | null; due_at: string | null };
type Payment = { id: string; amount_cents: number | null; provider: string | null; status: string | null; received_at: string | null };

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Sales() {
  const { companyId, companies } = useBusiness();
  const so = useQuery({ queryKey: ["biz", "so", companyId], enabled: !!companyId, queryFn: () => bizListSalesOrders({ data: { company_id: companyId!, limit: 100 } }) });
  const inv = useQuery({ queryKey: ["biz", "inv", companyId], enabled: !!companyId, queryFn: () => bizListInvoices({ data: { company_id: companyId!, limit: 100 } }) });
  const pay = useQuery({ queryKey: ["biz", "pay", companyId], enabled: !!companyId, queryFn: () => bizListPayments({ data: { company_id: companyId!, limit: 100 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Sales" /><NoCompany hasAny={companies.length > 0} /></>);
  const orders = (so.data ?? []) as unknown as Order[];
  const invoices = (inv.data ?? []) as unknown as Invoice[];
  const payments = (pay.data ?? []) as unknown as Payment[];
  const revenue = orders.reduce((a, o) => a + (o.total_cents ?? 0), 0);
  const collected = payments.filter((p) => p.status === "succeeded" || p.status === "paid").reduce((a, p) => a + (p.amount_cents ?? 0), 0);
  const receivable = invoices.reduce((a, i) => a + Math.max(0, (i.total_cents ?? 0) - (i.amount_paid_cents ?? 0)), 0);

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Sales Management" description="Quotations, orders, invoices, collections and revenue analytics." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Orders" value={orders.length.toLocaleString()} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Order Revenue" value={money(revenue)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Receivable" value={money(receivable)} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Collected" value={money(collected)} icon={<CreditCard className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Sales Orders</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {orders.slice(0, 12).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{o.number ?? o.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{o.ordered_at ? new Date(o.ordered_at).toLocaleDateString() : "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{money(o.total_cents ?? 0)}</span>
                  <Chip tone={o.status === "fulfilled" ? "success" : o.status === "cancelled" ? "danger" : "info"}>{o.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!orders.length && <li className="py-2 text-xs text-soft-gray">No orders.</li>}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Invoices</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {invoices.slice(0, 12).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{i.number ?? i.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">Due {i.due_at ? new Date(i.due_at).toLocaleDateString() : "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{money(i.total_cents ?? 0)}</span>
                  <Chip tone={i.status === "paid" ? "success" : i.status === "overdue" ? "danger" : "warning"}>{i.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!invoices.length && <li className="py-2 text-xs text-soft-gray">No invoices.</li>}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Collections</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {payments.slice(0, 10).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="text-paper">{p.provider ?? "manual"}</div>
                <div className="text-[11px] text-soft-gray">{p.received_at ? new Date(p.received_at).toLocaleString() : "—"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="numeric text-paper">{money(p.amount_cents ?? 0)}</span>
                <Chip tone={p.status === "succeeded" || p.status === "paid" ? "success" : "info"}>{p.status ?? "—"}</Chip>
              </div>
            </li>
          ))}
          {!payments.length && <li className="py-2 text-xs text-soft-gray">No payments.</li>}
        </ul>
      </Panel>
    </>
  );
}
