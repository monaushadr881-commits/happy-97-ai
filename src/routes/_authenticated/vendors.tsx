/** /vendors — v6.0 Vendor Portal surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/vendors")({
  head: () => ({ meta: [{ title: "Vendor Portal — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Ecosystem · v6.0"
      title="Vendor Portal"
      description="Vendor onboarding, catalogue, purchase orders, invoices, payments and performance scoring across the supply chain."
      icon={Truck}
      features={["Onboarding","Catalogue","Purchase Orders","Invoices","Payments","Performance","Compliance","Analytics"]}
    />
  ),
});
