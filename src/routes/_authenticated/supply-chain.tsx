/** /supply-chain — v7.0 Supply Chain OS surface. */
import { createFileRoute } from "@tanstack/react-router";
import { PackageSearch } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/supply-chain")({
  head: () => ({ meta: [{ title: "Supply Chain OS — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Supply Chain Platform · v7.0"
      title="Supply Chain OS"
      description="End-to-end supply chain — procurement, supplier network, purchase / demand / production planning, logistics, transportation, shipment tracking and delivery analytics."
      icon={PackageSearch}
      features={["Supply Chain","Procurement","Supplier Network","Purchase Planning","Demand Planning","Production Planning","Logistics","Transportation","Shipment Tracking","Delivery Analytics"]}
    />
  ),
});
