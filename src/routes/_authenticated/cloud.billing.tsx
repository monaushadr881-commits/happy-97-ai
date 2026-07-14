/** /cloud/billing — v5.0 Enterprise Billing Platform. */
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/billing")({
  head: () => ({ meta: [{ title: "Cloud Billing — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Enterprise Billing Platform"
      description="Subscription lifecycle, trials, coupons, team billing, seat management, usage billing, GST invoices, payment history and billing analytics."
      icon={CreditCard}
      features={[
        "Subscriptions",
        "Trials",
        "Coupons",
        "Team Billing",
        "Seat Management",
        "Usage Billing",
        "GST Invoices",
        "Payment History",
        "Billing Analytics",
      ]}
    />
  ),
});
