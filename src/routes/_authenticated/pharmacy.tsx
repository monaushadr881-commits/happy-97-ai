/** /pharmacy — Pharmacy OS · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy OS — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Pharmacy OS · v9.0"
      title="Pharmacy OS"
      description="Medicine inventory, prescription management, drug database, expiry & batch tracking, billing, stock alerts and supplier management."
      icon={Pill}
      features={["Inventory","Prescriptions","Drug Database","Expiry Tracking","Batch Tracking","Billing","Stock Alerts","Suppliers"]}
    />
  ),
});
