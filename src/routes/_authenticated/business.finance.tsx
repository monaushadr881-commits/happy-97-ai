/** /business/finance — CoA, Ledger, Expenses, Tax. Suspense-adopted inner. */
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListAccounts, bizListLedger, bizListExpenses, bizListTaxRates } from "@/lib/business-v1.functions";
import { Wallet, BookOpen, Landmark } from "lucide-react";
import { definedQuery } from "@/lib/founder/suspense-query";

export const Route = createFileRoute("/_authenticated/business/finance")({
  head: () => ({ meta: [{ title: "Finance — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Finance,
});

type Account = { id: string; code: string | null; name: string | null; kind: string | null; currency: string | null; is_active: boolean };
type Entry = { id: string; account_id: string | null; debit_cents: number | null; credit_cents: number | null; currency: string | null; entry_date: string | null; memo: string | null };
type Expense = { id: string; category: string | null; vendor: string | null; amount_cents: number | null; currency: string | null; status: string | null; spent_on: string | null };
type Tax = { id: string; code: string | null; name: string | null; rate_bps: number | null; country: string | null; region: string | null; is_active: boolean };

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Finance() {
  const { companyId, companies } = useBusiness();
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Finance" /><NoCompany hasAny={companies.length > 0} /></>);
  return <FinanceInner companyId={companyId} />;
}

function FinanceInner({ companyId }: { companyId: string }) {
  const acctsQ = definedQuery(["biz", "coa", companyId], () => bizListAccounts({ data: { company_id: companyId, limit: 200 } }));
  const ledgQ  = definedQuery(["biz", "ledger", companyId], () => bizListLedger({ data: { company_id: companyId, limit: 200 } }));
  const expsQ  = definedQuery(["biz", "expenses", companyId], () => bizListExpenses({ data: { company_id: companyId, limit: 100 } }));
  const taxQ   = definedQuery(["biz", "tax", companyId], () => bizListTaxRates({ data: { company_id: companyId, limit: 50 } }));

  const { data: accts } = useSuspenseQuery(acctsQ);
  const { data: ledg }  = useSuspenseQuery(ledgQ);
  const { data: exps }  = useSuspenseQuery(expsQ);
  const { data: taxes } = useSuspenseQuery(taxQ);

  const a = (accts ?? []) as unknown as Account[];
  const l = (ledg ?? []) as unknown as Entry[];
  const e = (exps ?? []) as unknown as Expense[];
  const t = (taxes ?? []) as unknown as Tax[];
  const debit = l.reduce((s, r) => s + (r.debit_cents ?? 0), 0);
  const credit = l.reduce((s, r) => s + (r.credit_cents ?? 0), 0);
  const expenseTotal = e.reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Finance & Accounting" description="Chart of accounts, general ledger, expenses, GST/VAT, budgets and reports." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Accounts" value={a.length.toLocaleString()} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="Ledger Debits" value={money(debit)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Ledger Credits" value={money(credit)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Expenses" value={money(expenseTotal)} icon={<Landmark className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Chart of Accounts</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {a.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.code ?? "—"} · {r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.kind ?? "—"} · {r.currency ?? "—"}</div>
                </div>
                <Chip tone={r.is_active ? "success" : "info"}>{r.is_active ? "active" : "inactive"}</Chip>
              </li>
            ))}
            {!a.length && <li className="py-2 text-xs text-soft-gray">No accounts.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Journal Entries</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {l.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.memo ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.entry_date ?? "—"}</div>
                </div>
                <div className="text-xs numeric">
                  <span className="text-emerald-400">+{money(r.debit_cents ?? 0)}</span>
                  <span className="text-soft-gray"> / </span>
                  <span className="text-red-400">-{money(r.credit_cents ?? 0)}</span>
                </div>
              </li>
            ))}
            {!l.length && <li className="py-2 text-xs text-soft-gray">No entries.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Expenses</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {e.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.vendor ?? r.category ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.spent_on ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{money(r.amount_cents ?? 0)}</span>
                  <Chip tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!e.length && <li className="py-2 text-xs text-soft-gray">No expenses.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Tax Rates (GST / VAT)</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {t.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.code ?? "—"} · {r.country ?? "—"}{r.region ? ` · ${r.region}` : ""}</div>
                </div>
                <span className="numeric text-paper">{((r.rate_bps ?? 0) / 100).toFixed(2)}%</span>
              </li>
            ))}
            {!t.length && <li className="py-2 text-xs text-soft-gray">No tax rates configured.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
