/**
 * /business/finance — Finance & Accounting (ERP finance surface).
 * R140: Full sub-tab UI (Overview · Accounts · Ledger · Invoices · Payments ·
 * Expenses · Taxes · Reports) over canonical bizList* server functions.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  bizListAccounts, bizListLedger, bizListExpenses, bizListTaxRates,
  bizListInvoices, bizListPayments,
} from "@/lib/business-v1.functions";
import {
  Wallet, BookOpen, Landmark, FileText, CreditCard, Receipt, Percent, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/finance")({
  head: () => ({ meta: [{ title: "Finance — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Finance,
});

type Account = { id: string; code: string | null; name: string | null; kind: string | null; currency: string | null; is_active: boolean };
type Entry   = { id: string; account_id: string | null; debit_cents: number | null; credit_cents: number | null; currency: string | null; entry_date: string | null; memo: string | null };
type Expense = { id: string; category: string | null; vendor: string | null; amount_cents: number | null; currency: string | null; status: string | null; spent_on: string | null };
type Tax     = { id: string; code: string | null; name: string | null; rate_bps: number | null; country: string | null; region: string | null; is_active: boolean };
type Invoice = { id: string; invoice_number: string | null; total_cents: number | null; currency: string | null; status: string | null; issued_at: string | null; due_at: string | null };
type Payment = { id: string; amount_cents: number | null; currency: string | null; status: string | null; method: string | null; received_at: string | null };

const TABS = [
  { slug: "overview", label: "Overview", icon: Wallet },
  { slug: "accounts", label: "Accounts", icon: BookOpen },
  { slug: "ledger",   label: "Ledger",   icon: BookOpen },
  { slug: "invoices", label: "Invoices", icon: FileText },
  { slug: "payments", label: "Payments", icon: CreditCard },
  { slug: "expenses", label: "Expenses", icon: Receipt },
  { slug: "taxes",    label: "Taxes",    icon: Percent },
  { slug: "reports",  label: "Reports",  icon: BarChart3 },
];

function money(cents: number | null | undefined) {
  return `$${(((cents ?? 0)) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Finance() {
  const { companyId, companies } = useBusiness();
  const active = useActiveTab(TABS);

  const accts = useQuery({ queryKey: ["biz","coa",companyId],      enabled: !!companyId, queryFn: () => bizListAccounts({ data: { company_id: companyId!, limit: 200 } }) });
  const ledg  = useQuery({ queryKey: ["biz","ledger",companyId],   enabled: !!companyId, queryFn: () => bizListLedger({ data: { company_id: companyId!, limit: 300 } }) });
  const exps  = useQuery({ queryKey: ["biz","expenses",companyId], enabled: !!companyId, queryFn: () => bizListExpenses({ data: { company_id: companyId!, limit: 200 } }) });
  const taxes = useQuery({ queryKey: ["biz","tax",companyId],      enabled: !!companyId, queryFn: () => bizListTaxRates({ data: { company_id: companyId!, limit: 100 } }) });
  const invs  = useQuery({ queryKey: ["biz","invs",companyId],     enabled: !!companyId, queryFn: () => bizListInvoices({ data: { company_id: companyId!, limit: 200 } }) });
  const pays  = useQuery({ queryKey: ["biz","pays",companyId],     enabled: !!companyId, queryFn: () => bizListPayments({ data: { company_id: companyId!, limit: 200 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Finance" /><NoCompany hasAny={companies.length > 0} /></>);

  const a  = (accts.data ?? []) as unknown as Account[];
  const l  = (ledg.data  ?? []) as unknown as Entry[];
  const e  = (exps.data  ?? []) as unknown as Expense[];
  const t  = (taxes.data ?? []) as unknown as Tax[];
  const iv = (invs.data  ?? []) as unknown as Invoice[];
  const py = (pays.data  ?? []) as unknown as Payment[];

  const debit    = l.reduce((s, r) => s + (r.debit_cents  ?? 0), 0);
  const credit   = l.reduce((s, r) => s + (r.credit_cents ?? 0), 0);
  const expTotal = e.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const invTotal = iv.reduce((s, r) => s + (r.total_cents ?? 0), 0);
  const payTotal = py.reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Finance &amp; Accounting" description="Accounts, ledger, invoices, payments, expenses, taxes and executive reports." />
      <TabBar tabs={TABS} ariaLabel="Finance sections" />

      {active === "overview" && (
        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Accounts" value={a.length.toLocaleString()} icon={<BookOpen className="h-4 w-4" />} />
          <StatCard label="Debits"   value={money(debit)}  icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Credits"  value={money(credit)} />
          <StatCard label="Net"      value={money(credit - debit)} />
          <StatCard label="Invoiced" value={money(invTotal)} icon={<FileText className="h-4 w-4" />} />
          <StatCard label="Collected" value={money(payTotal)} icon={<CreditCard className="h-4 w-4" />} />
          <StatCard label="Expenses" value={money(expTotal)} icon={<Landmark className="h-4 w-4" />} />
          <StatCard label="Tax Rates" value={t.length.toLocaleString()} icon={<Percent className="h-4 w-4" />} />
        </section>
      )}

      {active === "accounts" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Chart of Accounts</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {a.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.code ?? "—"} · {r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.kind ?? "—"} · {r.currency ?? "—"}</div>
                </div>
                <Chip tone={r.is_active ? "success" : "info"}>{r.is_active ? "active" : "inactive"}</Chip>
              </li>
            ))}
            {!a.length && <li className="py-3 text-xs text-soft-gray">No accounts.</li>}
          </ul>
        </Panel>
      )}

      {active === "ledger" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">General Ledger</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {l.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.memo ?? "Entry"}</div>
                  <div className="text-[11px] text-soft-gray">{r.entry_date ?? "—"}</div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="numeric text-paper">Dr {money(r.debit_cents)}</span>
                  <span className="numeric text-paper">Cr {money(r.credit_cents)}</span>
                </div>
              </li>
            ))}
            {!l.length && <li className="py-3 text-xs text-soft-gray">No entries.</li>}
          </ul>
        </Panel>
      )}

      {active === "invoices" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Invoices</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {iv.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.invoice_number ?? r.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">issued {r.issued_at ?? "—"} · due {r.due_at ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="numeric text-paper">{money(r.total_cents)}</span>
                  <Chip tone={r.status === "paid" ? "success" : r.status === "overdue" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!iv.length && <li className="py-3 text-xs text-soft-gray">No invoices.</li>}
          </ul>
        </Panel>
      )}

      {active === "payments" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Payments Received</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {py.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.method ?? "payment"}</div>
                  <div className="text-[11px] text-soft-gray">{r.received_at ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="numeric text-paper">{money(r.amount_cents)}</span>
                  <Chip tone={r.status === "settled" ? "success" : r.status === "failed" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!py.length && <li className="py-3 text-xs text-soft-gray">No payments.</li>}
          </ul>
        </Panel>
      )}

      {active === "expenses" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Expenses</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {e.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.category ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.vendor ?? "—"} · {r.spent_on ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="numeric text-paper">{money(r.amount_cents)}</span>
                  <Chip tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!e.length && <li className="py-3 text-xs text-soft-gray">No expenses.</li>}
          </ul>
        </Panel>
      )}

      {active === "taxes" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Tax Rates</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {t.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.code ?? "—"} · {r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{[r.region, r.country].filter(Boolean).join(", ") || "—"}</div>
                </div>
                <span className="numeric text-paper">{((r.rate_bps ?? 0) / 100).toFixed(2)}%</span>
              </li>
            ))}
            {!t.length && <li className="py-3 text-xs text-soft-gray">No tax rates.</li>}
          </ul>
        </Panel>
      )}

      {active === "reports" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel className="p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Trial Balance (window)</h2>
            <Hairline className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-soft-gray">Debits</span>
              <span className="numeric text-paper">{money(debit)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-soft-gray">Credits</span>
              <span className="numeric text-paper">{money(credit)}</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-white/5 pt-2">
              <span className="text-xs text-soft-gray">Net</span>
              <span className="numeric text-gold">{money(credit - debit)}</span>
            </div>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">P&amp;L Snapshot</h2>
            <Hairline className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-soft-gray">Revenue collected</span>
              <span className="numeric text-paper">{money(payTotal)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-soft-gray">Expenses</span>
              <span className="numeric text-paper">{money(expTotal)}</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-white/5 pt-2">
              <span className="text-xs text-soft-gray">Profit</span>
              <span className="numeric text-gold">{money(payTotal - expTotal)}</span>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
