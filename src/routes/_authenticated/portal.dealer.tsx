/**
 * R191 Batch 8 — Dealer Portal
 *
 * Dealer-facing self-service surface. NO new runtime, NO new tables,
 * NO duplicate UI framework. Reuses:
 *   - Partner Runtime (dealerOrderRecord / dealerLedgerEntry /
 *     dealerNotificationSend / dealerReportGenerate / dealerNetworkList)
 *   - Support Runtime (supportTicketCreate)
 *   - Design system primitives (PageHeader / Panel / Chip / EmptyState)
 *
 * Every action funnels through the canonical pipeline
 * (adoptToCanonicalPipeline → withBrain → approval → audit → Mission Control).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Handshake, ShoppingBag, Receipt, MessageSquare, FileText, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  dealerOrderRecord, dealerLedgerEntry, dealerDocumentUpload,
  dealerNotificationSend, dealerReportGenerate, dealerNetworkList,
} from "@/lib/partner/partner.functions";
import { supportTicketCreate } from "@/lib/business/support-service-runtime.functions";
import { apiListCompanies } from "@/lib/api-v1.functions";

export const Route = createFileRoute("/_authenticated/portal/dealer")({
  head: () => ({ meta: [
    { title: "Dealer Portal — HAPPY" },
    { name: "description", content: "Self-service portal for dealers: orders, invoices, payments, ledger, documents, support, notifications and performance." },
    { name: "robots", content: "noindex" },
  ]}),
  component: DealerPortal,
});

type Row = { id: string; name: string; created_at: string; metadata: Record<string, unknown> | null };
type Company = { id: string; display_name?: string; legal_name?: string; slug?: string | null };

function DealerPortal() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState("");
  const [dealerRef, setDealerRef] = useState("");

  const companies = useQuery({ queryKey: ["portal", "companies"], queryFn: () => apiListCompanies() });
  const activity  = useQuery({
    queryKey: ["portal", "dealer", "activity"],
    queryFn: () => dealerNetworkList({ data: { kind: "dealer", limit: 50 } }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["portal", "dealer"] });

  const placeOrder = useMutation({
    mutationFn: (v: { order_ref: string; amount_cents: number }) =>
      dealerOrderRecord({ data: { dealer_ref: dealerRef, order_ref: v.order_ref, amount_cents: v.amount_cents, company_id: companyId } }),
    onSuccess: (r) => { toast.success(r.status === "pending_approval" ? "Order pending approval" : "Order placed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const recordPayment = useMutation({
    mutationFn: (v: { entry_ref: string; amount_cents: number }) =>
      dealerLedgerEntry({ data: { dealer_ref: dealerRef, entry_ref: v.entry_ref, entry_type: "payment", amount_cents: v.amount_cents, company_id: companyId } }),
    onSuccess: () => { toast.success("Payment recorded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const uploadDoc = useMutation({
    mutationFn: (v: { document_ref: string }) =>
      dealerDocumentUpload({ data: { dealer_ref: dealerRef, document_ref: v.document_ref, doc_type: "agreement", company_id: companyId } }),
    onSuccess: () => { toast.success("Document uploaded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const openTicket = useMutation({
    mutationFn: (v: { subject: string; body: string }) =>
      supportTicketCreate({ data: {
        company_id: companyId, buyer_id: companyId, creator_id: companyId,
        subject: v.subject, body: v.body, priority: "normal",
      } as never }),
    onSuccess: () => { toast.success("Support ticket opened"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const sendNotif = useMutation({
    mutationFn: (v: { subject: string }) =>
      dealerNotificationSend({ data: { dealer_ref: dealerRef, subject: v.subject, body: v.subject, company_id: companyId } }),
    onSuccess: () => toast.success("Notification sent"),
    onError: (e: Error) => toast.error(e.message),
  });
  const genReport = useMutation({
    mutationFn: (v: { period: string }) =>
      dealerReportGenerate({ data: { dealer_ref: dealerRef, report_type: "sales", period: v.period, company_id: companyId } }),
    onSuccess: () => toast.success("Report generated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = ((activity.data ?? []) as unknown as Row[])
    .filter((r) => !dealerRef || r.name.includes(dealerRef));

  const disabled = !companyId || !dealerRef;

  return (
    <>
      <PageHeader
        eyebrow="Portal"
        title="Dealer Portal"
        description="Self-service dealer workspace — orders, invoices, payments, ledger, documents, notifications and support. All actions route through the canonical Partner + Support runtimes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-paper"
            >
              <option value="">Select company…</option>
              {((companies.data ?? []) as unknown as Company[]).map((c) => (
                <option key={c.id} value={c.id}>{c.display_name ?? c.legal_name ?? c.slug ?? c.id.slice(0, 8)}</option>
              ))}
            </select>
            <Input
              placeholder="Your dealer ref"
              value={dealerRef}
              onChange={(e) => setDealerRef(e.target.value)}
              className="h-8 w-44 bg-white/[0.02] border-white/10 text-xs"
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">Recent activity</div>
            <Chip tone="gold">{rows.length}</Chip>
          </div>
          <Hairline />
          <ul className="divide-y divide-white/5">
            {rows.map((r) => {
              const md = (r.metadata ?? {}) as { payload?: { action?: string; status?: string; name?: string } };
              return (
                <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-paper text-sm">{md.payload?.name ?? r.name.replace(/^partner\.dealer:[^:]+:/, "")}</div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">
                      {md.payload?.action ?? "activity"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Chip tone={md.payload?.status === "pending" ? "warning" : "gold"}>{md.payload?.status ?? "ok"}</Chip>
                </li>
              );
            })}
            {!rows.length && (
              <li className="p-6">
                <EmptyState icon={<Handshake className="h-5 w-5" />} title="No activity yet" description="Place an order or upload a document to get started." />
              </li>
            )}
          </ul>
        </Panel>

        <Panel className="p-5 space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Quick actions</h3>
          <Hairline />
          <PortalForm
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Place order"
            fields={["order ref"]}
            numeric="amount (₹)"
            disabled={disabled}
            pending={placeOrder.isPending}
            onSubmit={(a, _b, n) => placeOrder.mutate({ order_ref: a, amount_cents: Math.round(n * 100) })}
          />
          <PortalForm
            icon={<Receipt className="h-4 w-4" />}
            label="Record payment"
            fields={["payment ref"]}
            numeric="amount (₹)"
            disabled={disabled}
            pending={recordPayment.isPending}
            onSubmit={(a, _b, n) => recordPayment.mutate({ entry_ref: a, amount_cents: Math.round(n * 100) })}
          />
          <PortalForm
            icon={<FileText className="h-4 w-4" />}
            label="Upload document"
            fields={["document ref"]}
            disabled={disabled}
            pending={uploadDoc.isPending}
            onSubmit={(a) => uploadDoc.mutate({ document_ref: a })}
          />
          <PortalForm
            icon={<MessageSquare className="h-4 w-4" />}
            label="Open support ticket"
            fields={["subject", "message"]}
            disabled={disabled}
            pending={openTicket.isPending}
            onSubmit={(a, b) => openTicket.mutate({ subject: a, body: b || a })}
          />
          <PortalForm
            icon={<Bell className="h-4 w-4" />}
            label="Send notification"
            fields={["subject"]}
            disabled={disabled}
            pending={sendNotif.isPending}
            onSubmit={(a) => sendNotif.mutate({ subject: a })}
          />
          <PortalForm
            icon={<FileText className="h-4 w-4" />}
            label="Generate report"
            fields={["period YYYY-MM"]}
            disabled={disabled}
            pending={genReport.isPending}
            onSubmit={(a) => genReport.mutate({ period: a })}
          />
        </Panel>
      </div>
    </>
  );
}

function PortalForm({
  icon, label, fields, numeric, pending, disabled, onSubmit,
}: {
  icon: React.ReactNode; label: string; fields: string[]; numeric?: string;
  pending: boolean; disabled: boolean;
  onSubmit: (a: string, b: string, n: number) => void;
}) {
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [n, setN] = useState("");
  const two = fields.length > 1;
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] p-3 space-y-2">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-soft-gray">
        <span className="text-gold">{icon}</span>{label}
      </div>
      <Input placeholder={fields[0]} value={a} onChange={(e) => setA(e.target.value)} className="bg-white/[0.02] border-white/10 h-9" />
      {two && <Input placeholder={fields[1]} value={b} onChange={(e) => setB(e.target.value)} className="bg-white/[0.02] border-white/10 h-9" />}
      {numeric && <Input placeholder={numeric} inputMode="decimal" value={n} onChange={(e) => setN(e.target.value)} className="bg-white/[0.02] border-white/10 h-9" />}
      <Button
        size="sm"
        disabled={!a || pending || disabled || (!!numeric && !n) || (two && !b)}
        onClick={() => { onSubmit(a, b, numeric ? Number(n || 0) : 0); setA(""); setB(""); setN(""); }}
        className="w-full bg-gold/10 text-gold hover:bg-gold/20"
      >
        Submit
      </Button>
    </div>
  );
}
