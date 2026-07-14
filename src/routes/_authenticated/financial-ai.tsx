/** /financial-ai — v7.0 Enterprise Financial AI surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/financial-ai")({
  head: () => ({ meta: [{ title: "Enterprise Financial AI — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Financial AI Platform · v7.0"
      title="Enterprise Financial AI"
      description="AI CFO with cash flow, investment, budget, tax, revenue, profit and overall business advisory — powered by the Enterprise Brain."
      icon={Wallet}
      features={financial-ai financial-ai Wallet Enterprise Financial AI AI CFO with cash flow, investment, budget, tax, revenue, profit and overall business advisory — powered by the Enterprise Brain. Financial AI Platform ["AI CFO","Cash Flow Advisor","Investment Advisor","Budget Advisor","Tax Advisor","Revenue Advisor","Profit Advisor","Business Advisor"]}
    />
  ),
});
