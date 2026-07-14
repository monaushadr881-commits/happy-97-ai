/** /ecosystem — v6.0 Global Ecosystem surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/ecosystem")({
  head: () => ({ meta: [{ title: "Global Ecosystem — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Enterprise · v6.0"
      title="Global Ecosystem"
      description="A unified portal fabric for every external relationship — partners, vendors, suppliers, dealers, distributors, investors, customers and government."
      icon={Globe2}
      features={[
        "Partner Portal",
        "Vendor Portal",
        "Supplier Portal",
        "Dealer Portal",
        "Distributor Portal",
        "Investor Portal",
        "Customer Portal",
        "Government Portal",
      ]}
    />
  ),
});
