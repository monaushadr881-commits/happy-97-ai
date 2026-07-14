/** /payments — v7.0 Global Payment Hub surface. */
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Global Payment Hub — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Payments Platform · v7.0"
      title="Global Payment Hub"
      description="Intelligent payment routing, gateway selection, settlement, refunds, subscriptions, wallet, loyalty, gift cards, coupons and promotions."
      icon={CreditCard}
      features={payments payments CreditCard Global Payment Hub Intelligent payment routing, gateway selection, settlement, refunds, subscriptions, wallet, loyalty, gift cards, coupons and promotions. Payments Platform ["Payment Routing","Gateway Selection","Settlement","Refunds","Subscriptions","Wallet","Loyalty","Gift Cards","Coupons","Promotions"]}
    />
  ),
});
