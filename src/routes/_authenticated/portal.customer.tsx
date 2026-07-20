/**
 * R191 Batch 8 — Customer Portal
 *
 * Customer-facing self-service surface. NO new runtime, NO new tables,
 * NO duplicate UI framework. Reuses:
 *   - Business Runtime (bizUpdateCustomerProfile / bizUpdateCustomerAddress
 *     / bizSalesOrderTrack / bizSalesOrderTimeline)
 *   - Support Runtime (supportTicketCreate / supportReturnRequest /
 *     supportRefundRequest / supportCustomerFeedback / supportCustomerRating)
 *   - Design system primitives
 *
 * Every action funnels through the canonical pipeline
 * (adoptToCanonicalPipeline → withBrain → approval → audit → Mission Control).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useState as _use } from "react";
import { useMutation as useMut, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, MapPin, Package, RotateCcw, Wallet, MessageSquare, Star, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  bizUpdateCustomerProfile, bizUpdateCustomerAddress, bizSalesOrderTrack,
} from "@/lib/business/order-inventory-runtime.functions";
import {
  supportTicketCreate, supportReturnRequest, supportRefundRequest,
  supportCustomerFeedback, supportCustomerRating,
} from "@/lib/business/support-service-runtime.functions";
import { apiListCompanies } from "@/lib/api-v1.functions";

// keep imports used
void useMutation; void _use;

export const Route = createFileRoute("/_authenticated/portal/customer")({
  head: () => ({ meta: [
    { title: "Customer Portal — HAPPY" },
    { name: "description", content: "Self-service customer portal: profile, addresses, orders, tracking, invoices, returns, refunds, support and feedback." },
    { name: "robots", content: "noindex" },
  ]}),
  component: CustomerPortal,
});

type Company = { id: string; display_name?: string; legal_name?: string; slug?: string | null };

function CustomerPortal() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");

  const companies = useQuery({ queryKey: ["portal", "companies"], queryFn: () => apiListCompanies() });

  const track = useQuery({
    queryKey: ["portal", "customer", "track", orderId],
    queryFn: () => bizSalesOrderTrack({ data: { company_id: companyId, sales_order_id: orderId } as never }),
    enabled: !!companyId && !!orderId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["portal", "customer"] });

  const updateProfile = useMut({
    mutationFn: (v: { display_name: string; email?: string }) =>
      bizUpdateCustomerProfile({ data: { company_id: companyId, customer_id: customerId, display_name: v.display_name, email: v.email } as never }),
    onSuccess: () => { toast.success("Profile updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const addAddress = useMut({
    mutationFn: (v: { line1: string; city: string }) =>
      bizUpdateCustomerAddress({ data: { company_id: companyId, customer_id: customerId, line1: v.line1, city: v.city } as never }),
    onSuccess: () => { toast.success("Address saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const openTicket = useMut({
    mutationFn: (v: { subject: string; body: string }) =>
      supportTicketCreate({ data: {
        company_id: companyId, buyer_id: customerId, creator_id: customerId,
        subject: v.subject, body: v.body, priority: "normal",
      } as never }),
    onSuccess: () => toast.success("Support ticket opened"),
    onError: (e: Error) => toast.error(e.message),
  });
  const requestReturn = useMut({
    mutationFn: (v: { reason: string; sku: string; qty: number }) =>
      supportReturnRequest({ data: {
        company_id: companyId, order_id: orderId, customer_id: customerId,
        reason: v.reason, items: [{ sku: v.sku, qty: v.qty }],
      } as never }),
    onSuccess: () => toast.success("Return request submitted"),
    onError: (e: Error) => toast.error(e.message),
  });
  const requestRefund = useMut({
    mutationFn: (v: { amount_cents: number; reason: string }) =>
      supportRefundRequest({ data: {
        company_id: companyId, order_id: orderId, customer_id: customerId,
        amount_cents: v.amount_cents, currency: "INR", reason: v.reason,
      } as never }),
    onSuccess: () => toast.success("Refund request submitted"),
    onError: (e: Error) => toast.error(e.message),
  });
  const feedback = useMut({
    mutationFn: (v: { body: string }) =>
      supportCustomerFeedback({ data: { company_id: companyId, customer_id: customerId, body: v.body } as never }),
    onSuccess: () => toast.success("Feedback sent"),
    onError: (e: Error) => toast.error(e.message),
  });
  const rating = useMut({
    mutationFn: (v: { rating: number; comment: string }) =>
      supportCustomerRating({ data: { company_id: companyId, customer_id: customerId, rating: v.rating, comment: v.comment } as never }),
    onSuccess: () => toast.success("Rating recorded"),
    onError: (e: Error) => toast.error(e.message),
  });

  const disabled = !companyId || !customerId;

  return (
    <>
      <PageHeader
        eyebrow="Portal"
        title="Customer Portal"
        description="Self-service customer workspace — profile, addresses, orders, tracking, returns, refunds, support and feedback. All actions route through the canonical Business + Support runtimes."
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
            <Input placeholder="Customer id" value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="h-8 w-56 bg-white/[0.02] border-white/10 text-xs" />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">Order tracking</div>
            <Input placeholder="Order id"
              value={orderId} onChange={(e) => setOrderId(e.target.value)}
              className="h-8 w-56 bg-white/[0.02] border-white/10 text-xs" />
          </div>
          <Hairline />
          <div className="p-4 space-y-2 text-sm">
            {!orderId && <EmptyState icon={<Package className="h-5 w-5" />} title="Enter an order id" description="Paste your order id above to see live tracking." />}
            {orderId && track.isLoading && <div className="text-soft-gray text-xs">Loading…</div>}
            {orderId && track.data && (
              <pre className="text-[11px] text-soft-gray whitespace-pre-wrap break-all">
{JSON.stringify(track.data, null, 2)}
              </pre>
            )}
            {orderId && track.isError && <Chip tone="warning">Not found</Chip>}
          </div>
        </Panel>

        <Panel className="p-5 space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Self-service</h3>
          <Hairline />
          <PortalForm icon={<User className="h-4 w-4" />} label="Update profile"
            fields={["display name", "email"]}
            disabled={disabled} pending={updateProfile.isPending}
            onSubmit={(a, b) => updateProfile.mutate({ display_name: a, email: b || undefined })} />
          <PortalForm icon={<MapPin className="h-4 w-4" />} label="Add address"
            fields={["line 1", "city"]}
            disabled={disabled} pending={addAddress.isPending}
            onSubmit={(a, b) => addAddress.mutate({ line1: a, city: b })} />
          <PortalForm icon={<RotateCcw className="h-4 w-4" />} label="Request return"
            fields={["sku", "reason"]} numeric="qty"
            disabled={disabled || !orderId} pending={requestReturn.isPending}
            onSubmit={(a, b, n) => requestReturn.mutate({ sku: a, reason: b, qty: Math.max(1, Math.round(n)) })} />
          <PortalForm icon={<Wallet className="h-4 w-4" />} label="Request refund"
            fields={["reason"]} numeric="amount (₹)"
            disabled={disabled || !orderId} pending={requestRefund.isPending}
            onSubmit={(a, _b, n) => requestRefund.mutate({ reason: a, amount_cents: Math.round(n * 100) })} />
          <PortalForm icon={<MessageSquare className="h-4 w-4" />} label="Support ticket"
            fields={["subject", "message"]}
            disabled={disabled} pending={openTicket.isPending}
            onSubmit={(a, b) => openTicket.mutate({ subject: a, body: b || a })} />
          <PortalForm icon={<Bell className="h-4 w-4" />} label="Feedback"
            fields={["message"]}
            disabled={disabled} pending={feedback.isPending}
            onSubmit={(a) => feedback.mutate({ body: a })} />
          <PortalForm icon={<Star className="h-4 w-4" />} label="Rating (1–5)"
            fields={["comment"]} numeric="rating"
            disabled={disabled} pending={rating.isPending}
            onSubmit={(a, _b, n) => rating.mutate({ comment: a, rating: Math.max(1, Math.min(5, Math.round(n))) })} />
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
        disabled={!a || pending || disabled || (!!numeric && !n) || (two && !b && fields[1] !== "email" && fields[1] !== "message" && fields[1] !== "comment")}
        onClick={() => { onSubmit(a, b, numeric ? Number(n || 0) : 0); setA(""); setB(""); setN(""); }}
        className="w-full bg-gold/10 text-gold hover:bg-gold/20"
      >
        Submit
      </Button>
    </div>
  );
}
