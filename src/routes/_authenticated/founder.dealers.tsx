/**
 * /founder/dealers — Dealer & Distributor Sales Network.
 *
 * R191 Batch 1. Real UI over the canonical Partner runtime. Every mutation
 * routes through `partner.functions.ts` → adoptToCanonicalPipeline → withBrain
 * → R158 approval (for registration/KYC/exclusive territory) → audit →
 * Mission Control. No new dashboard framework; reuses `design-system/primitives`
 * and shadcn UI like the other founder pages.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  dealerRegister, dealerKycSubmit, dealerOrderRecord, dealerLedgerEntry,
  dealerDocumentUpload, dealerTerritoryAssign, dealerPerformanceRecord,
  dealerNotificationSend, dealerReportGenerate,
  distributorRegister, distributorOrderRecord, distributorLedgerEntry,
  distributorTerritoryAssign, distributorDocumentUpload,
  dealerNetworkList, dealerNetworkHealth,
} from "@/lib/partner/partner.functions";
import { apiListCompanies } from "@/lib/api-v1.functions";
import { Handshake, Truck, Plus, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/founder/dealers")({
  head: () => ({ meta: [
    { title: "Dealers & Distributors — Founder" },
    { name: "robots", content: "noindex" },
  ]}),
  component: FounderDealers,
});

type Row = { id: string; name: string; kind: string; tags: string[] | null; metadata: Record<string, unknown> | null; created_at: string };
type Company = { id: string; display_name?: string; legal_name?: string; slug?: string | null };

function FounderDealers() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dealer" | "distributor">("dealer");
  const [companyId, setCompanyId] = useState<string>("");

  const companies = useQuery({ queryKey: ["founder", "companies"], queryFn: () => apiListCompanies() });
  const health    = useQuery({ queryKey: ["founder", "dealer-network", "health"], queryFn: () => dealerNetworkHealth() });
  const list      = useQuery({
    queryKey: ["founder", "dealer-network", tab],
    queryFn: () => dealerNetworkList({ data: { kind: tab, limit: 100 } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["founder", "dealer-network"] });
  };

  const registerDealer = useMutation({
    mutationFn: (v: { dealer_ref: string; name: string; territory?: string }) =>
      dealerRegister({ data: { ...v, company_id: companyId } }),
    onSuccess: (r) => { toast.success(r.status === "pending_approval" ? "Dealer submitted for approval" : "Dealer registered"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const registerDistributor = useMutation({
    mutationFn: (v: { distributor_ref: string; name: string; region?: string }) =>
      distributorRegister({ data: { ...v, company_id: companyId } }),
    onSuccess: (r) => { toast.success(r.status === "pending_approval" ? "Distributor submitted for approval" : "Distributor registered"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const recordOrder = useMutation({
    mutationFn: (v: { ref: string; order_ref: string; amount_cents: number }) =>
      tab === "dealer"
        ? dealerOrderRecord({ data: { dealer_ref: v.ref, order_ref: v.order_ref, amount_cents: v.amount_cents, company_id: companyId } })
        : distributorOrderRecord({ data: { distributor_ref: v.ref, order_ref: v.order_ref, amount_cents: v.amount_cents, company_id: companyId } }),
    onSuccess: () => { toast.success("Order recorded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const recordLedger = useMutation({
    mutationFn: (v: { ref: string; entry_ref: string; entry_type: "invoice" | "payment"; amount_cents: number }) =>
      tab === "dealer"
        ? dealerLedgerEntry({ data: { dealer_ref: v.ref, entry_ref: v.entry_ref, entry_type: v.entry_type, amount_cents: v.amount_cents, company_id: companyId } })
        : distributorLedgerEntry({ data: { distributor_ref: v.ref, entry_ref: v.entry_ref, entry_type: v.entry_type, amount_cents: v.amount_cents, company_id: companyId } }),
    onSuccess: () => { toast.success("Ledger entry recorded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadDoc = useMutation({
    mutationFn: (v: { ref: string; document_ref: string; doc_type: "agreement" | "kyc" | "other" }) =>
      tab === "dealer"
        ? dealerDocumentUpload({ data: { dealer_ref: v.ref, document_ref: v.document_ref, doc_type: v.doc_type, company_id: companyId } })
        : distributorDocumentUpload({ data: { distributor_ref: v.ref, document_ref: v.document_ref, doc_type: v.doc_type, company_id: companyId } }),
    onSuccess: () => { toast.success("Document logged"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignTerritory = useMutation({
    mutationFn: (v: { ref: string; territory: string; exclusive: boolean }) =>
      tab === "dealer"
        ? dealerTerritoryAssign({ data: { dealer_ref: v.ref, territory: v.territory, exclusive: v.exclusive, company_id: companyId } })
        : distributorTerritoryAssign({ data: { distributor_ref: v.ref, region: v.territory, exclusive: v.exclusive, company_id: companyId } }),
    onSuccess: (r) => { toast.success(r.status === "pending_approval" ? "Exclusive territory pending approval" : "Territory assigned"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitKyc = useMutation({
    mutationFn: (v: { dealer_ref: string; gstin?: string }) =>
      dealerKycSubmit({ data: { ...v, company_id: companyId } }),
    onSuccess: () => { toast.success("KYC submitted for approval"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const recordPerf = useMutation({
    mutationFn: (v: { dealer_ref: string; period: string; achieved_cents: number; target_cents: number }) =>
      dealerPerformanceRecord({ data: { ...v, company_id: companyId } }),
    onSuccess: () => { toast.success("Performance recorded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendNotification = useMutation({
    mutationFn: (v: { dealer_ref: string; subject: string; body: string }) =>
      dealerNotificationSend({ data: { ...v, company_id: companyId } }),
    onSuccess: () => toast.success("Notification queued"),
    onError: (e: Error) => toast.error(e.message),
  });

  const generateReport = useMutation({
    mutationFn: (v: { dealer_ref: string; report_type: "sales" | "ledger" | "performance"; period: string }) =>
      dealerReportGenerate({ data: { ...v, company_id: companyId } }),
    onSuccess: () => toast.success("Report generated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = ((list.data ?? []) as unknown as Row[]);
  const h = health.data as
    | { latest_activity_at: string | null; dealers: { total: number; orders: number; order_value_cents: number; pending_approval: number }; distributors: { total: number; orders: number; order_value_cents: number; pending_approval: number } }
    | undefined;
  const cur = tab === "dealer" ? h?.dealers : h?.distributors;

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Dealers & Distributors"
        description="Sales network runtime — registration, orders, ledger, KYC, documents, territories, performance, notifications, reports. All routed through the canonical Partner pipeline."
        actions={
          <div className="flex items-center gap-2">
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
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <StatCard icon={<Handshake className="h-4 w-4" />} label="Total" value={cur?.total ?? 0} />
        <StatCard icon={<Truck className="h-4 w-4" />}    label="Orders" value={cur?.orders ?? 0} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Order Value" value={formatINR(cur?.order_value_cents ?? 0)} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Pending Approvals" value={cur?.pending_approval ?? 0} />
      </div>

      <div className="mb-3 flex gap-1">
        {(["dealer", "distributor"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${tab === k ? "bg-gold/10 text-gold" : "text-soft-gray hover:bg-white/5 hover:text-paper"}`}
          >
            {k === "dealer" ? "Dealers" : "Distributors"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-0 overflow-hidden">
          <ul className="divide-y divide-white/5">
            {rows.map((r) => {
              const md = (r.metadata ?? {}) as { payload?: { action?: string; name?: string; status?: string } };
              const action = md.payload?.action ?? "activity";
              return (
                <li key={r.id} className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{md.payload?.name ?? r.name.replace(/^partner\.(dealer|distributor):[^:]+:/, "")}</div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{action} · {new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <Chip tone={md.payload?.status === "pending" ? "warning" : "gold"}>{md.payload?.status ?? action}</Chip>
                </li>
              );
            })}
            {!rows.length && (
              <li className="p-6">
                <EmptyState
                  icon={tab === "dealer" ? <Handshake className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  title={`No ${tab}s yet`}
                  description={`Register the first ${tab} to activate the sales network.`}
                />
              </li>
            )}
          </ul>
        </Panel>

        <Panel className="p-5 space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Actions</h3>
          <Hairline />

          <RegisterDialog
            tab={tab}
            disabled={!companyId}
            pending={registerDealer.isPending || registerDistributor.isPending}
            onSubmit={(v) => {
              if (tab === "dealer") registerDealer.mutate({ dealer_ref: v.ref, name: v.name, territory: v.location });
              else registerDistributor.mutate({ distributor_ref: v.ref, name: v.name, region: v.location });
            }}
          />

          <TwoFieldForm
            label="Order"
            fields={["ref (dealer/distributor)", "order ref"]}
            numeric="amount (₹)"
            pending={recordOrder.isPending}
            disabled={!companyId}
            onSubmit={(a, b, n) => recordOrder.mutate({ ref: a, order_ref: b, amount_cents: Math.round(n * 100) })}
          />

          <TwoFieldForm
            label="Payment (ledger)"
            fields={["ref", "entry ref"]}
            numeric="amount (₹)"
            pending={recordLedger.isPending}
            disabled={!companyId}
            onSubmit={(a, b, n) => recordLedger.mutate({ ref: a, entry_ref: b, entry_type: "payment", amount_cents: Math.round(n * 100) })}
          />

          <TwoFieldForm
            label="Document"
            fields={["ref", "document ref"]}
            pending={uploadDoc.isPending}
            disabled={!companyId}
            onSubmit={(a, b) => uploadDoc.mutate({ ref: a, document_ref: b, doc_type: "agreement" })}
          />

          <TwoFieldForm
            label="Territory (exclusive)"
            fields={["ref", "territory / region"]}
            pending={assignTerritory.isPending}
            disabled={!companyId}
            onSubmit={(a, b) => assignTerritory.mutate({ ref: a, territory: b, exclusive: true })}
          />

          {tab === "dealer" && (
            <>
              <TwoFieldForm
                label="KYC"
                fields={["dealer ref", "GSTIN"]}
                pending={submitKyc.isPending}
                disabled={!companyId}
                onSubmit={(a, b) => submitKyc.mutate({ dealer_ref: a, gstin: b })}
              />
              <TwoFieldForm
                label="Performance"
                fields={["dealer ref", "period (YYYY-MM)"]}
                numeric="achieved (₹)"
                pending={recordPerf.isPending}
                disabled={!companyId}
                onSubmit={(a, b, n) => recordPerf.mutate({ dealer_ref: a, period: b, achieved_cents: Math.round(n * 100), target_cents: 0 })}
              />
              <TwoFieldForm
                label="Notification"
                fields={["dealer ref", "subject"]}
                pending={sendNotification.isPending}
                disabled={!companyId}
                onSubmit={(a, b) => sendNotification.mutate({ dealer_ref: a, subject: b, body: b })}
              />
              <TwoFieldForm
                label="Report"
                fields={["dealer ref", "period (YYYY-MM)"]}
                pending={generateReport.isPending}
                disabled={!companyId}
                onSubmit={(a, b) => generateReport.mutate({ dealer_ref: a, report_type: "sales", period: b })}
              />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

function formatINR(cents: number) {
  return `₹ ${(cents / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-soft-gray">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-gold/10 text-gold">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.15em]">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-medium text-paper">{value}</div>
    </Panel>
  );
}

function RegisterDialog({
  tab, disabled, pending, onSubmit,
}: {
  tab: "dealer" | "distributor"; disabled: boolean; pending: boolean;
  onSubmit: (v: { ref: string; name: string; location: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState(""); const [name, setName] = useState(""); const [loc, setLoc] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="w-full bg-gold text-obsidian hover:bg-gold-bright">
          <Plus className="h-4 w-4 mr-1" /> Register {tab === "dealer" ? "Dealer" : "Distributor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-obsidian border-white/10">
        <DialogHeader><DialogTitle className="text-paper">Register {tab === "dealer" ? "Dealer" : "Distributor"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder={`${tab} reference (unique)`} value={ref} onChange={(e) => setRef(e.target.value)} className="bg-white/[0.02] border-white/10" />
          <Input placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/[0.02] border-white/10" />
          <Input placeholder={tab === "dealer" ? "Territory" : "Region"} value={loc} onChange={(e) => setLoc(e.target.value)} className="bg-white/[0.02] border-white/10" />
        </div>
        <DialogFooter>
          <Button
            disabled={!ref || !name || pending}
            onClick={() => { onSubmit({ ref, name, location: loc }); setOpen(false); setRef(""); setName(""); setLoc(""); }}
            className="bg-gold text-obsidian hover:bg-gold-bright"
          >
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TwoFieldForm({
  label, fields, numeric, pending, disabled, onSubmit,
}: {
  label: string; fields: [string, string]; numeric?: string; pending: boolean; disabled: boolean;
  onSubmit: (a: string, b: string, n: number) => void;
}) {
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [n, setN] = useState("");
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{label}</div>
      <Input placeholder={fields[0]} value={a} onChange={(e) => setA(e.target.value)} className="bg-white/[0.02] border-white/10" />
      <Input placeholder={fields[1]} value={b} onChange={(e) => setB(e.target.value)} className="bg-white/[0.02] border-white/10" />
      {numeric && <Input placeholder={numeric} inputMode="decimal" value={n} onChange={(e) => setN(e.target.value)} className="bg-white/[0.02] border-white/10" />}
      <Button
        size="sm"
        disabled={!a || !b || pending || disabled || (!!numeric && !n)}
        onClick={() => { onSubmit(a, b, numeric ? Number(n || 0) : 0); setA(""); setB(""); setN(""); }}
        className="w-full bg-gold/10 text-gold hover:bg-gold/20"
      >
        Submit
      </Button>
    </div>
  );
}
