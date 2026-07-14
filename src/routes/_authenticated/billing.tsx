/** /billing — v4.0 Subscriptions & Billing surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="Subscriptions & Billing"
      description="Plans, invoices, coupons, trials, renewals, GST, taxes, proration, usage and team billing — unified for the HAPPY platform."
      icon={Receipt}
      features={[
        "Plans",
        "Billing",
        "Invoices",
        "Coupons",
        "Trials",
        "Renewals",
        "GST & Taxes",
        "Proration",
        "Usage Billing",
        "Team Billing",
      ]}
    />
  ),
});
