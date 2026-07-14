import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({ meta: [{ title: "Business OS — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Operations"
      title="Business Operating System"
      icon={Building2}
      description="CRM, ERP, HRMS, Finance, Manufacturing, Inventory, Marketing and BI — unified in one AI-native cockpit for founders, CEOs and enterprise teams."
      features={["CRM", "ERP", "HRMS", "Manufacturing", "Inventory", "Finance", "GST & Invoicing", "Analytics", "Customer Support"]}
    />
  ),
});
