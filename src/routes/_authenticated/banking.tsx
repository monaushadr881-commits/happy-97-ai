/** /banking — v7.0 Banking Integration surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/banking")({
  head: () => ({ meta: [{ title: "Banking Integration — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Banking Platform · v7.0"
      title="Banking Integration"
      description="Bank accounts, statement import, reconciliation, virtual accounts, payment gateway hub, payouts, collections and full UPI/NEFT/RTGS/SWIFT rails."
      icon={Banknote}
      features={["Bank Accounts","Statement Import","Reconciliation","Virtual Accounts","Payment Gateway Hub","Payout Engine","Collection Engine","UPI","NEFT","RTGS","SWIFT","International Payments"]}
    />
  ),
});
