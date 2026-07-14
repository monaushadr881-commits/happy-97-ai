/** /market-intelligence — v7.0 Global Market Intelligence surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/market-intelligence")({
  head: () => ({ meta: [{ title: "Global Market Intelligence — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Market Intelligence Platform · v7.0"
      title="Global Market Intelligence"
      description="Competitor, pricing, demand and consumer trend intelligence with regional analytics, opportunity detection and risk intelligence."
      icon={Radar}
      features={["Competitor Analytics","Pricing Intelligence","Demand Intelligence","Consumer Trends","Regional Analytics","Opportunity Detection","Risk Intelligence"]}
    />
  ),
});
