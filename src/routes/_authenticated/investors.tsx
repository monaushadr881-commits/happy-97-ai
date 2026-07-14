/** /investors — v6.0 Investor Portal surface. */
import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/investors")({
  head: () => ({ meta: [{ title: "Investor Portal — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Ecosystem · v6.0"
      title="Investor Portal"
      description="Cap table, financial reporting, board updates, KPIs, forecasts and secure data room for every investor stakeholder."
      icon={LineChart}
      features={["Cap Table","Financial Reports","Board Updates","KPIs","Forecasts","Data Room","Notices","Analytics"]}
    />
  ),
});
