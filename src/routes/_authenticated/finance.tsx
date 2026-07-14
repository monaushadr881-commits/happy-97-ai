/** /finance — v7.0 Financial OS surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Financial OS — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Financial Intelligence Platform · v7.0"
      title="Financial OS"
      description="General Ledger, AP/AR, Treasury, Cash Management, Budgeting, Forecasting, Tax/GST, Invoice, Expense, Revenue and Profitability engines — unified."
      icon={Landmark}
      features={finance finance Landmark Financial OS General Ledger, AP/AR, Treasury, Cash Management, Budgeting, Forecasting, Tax/GST, Invoice, Expense, Revenue and Profitability engines — unified. Financial Intelligence Platform ["General Ledger","Accounts Payable","Accounts Receivable","Treasury","Cash Management","Budget Planning","Forecasting","Tax Center","GST Center","Invoice Engine","Expense Engine","Revenue Engine","Profitability Engine"]}
    />
  ),
});
