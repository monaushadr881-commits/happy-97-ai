/** /workforce — v6.0 AI Workforce surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/workforce")({
  head: () => ({ meta: [{ title: "AI Workforce — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Enterprise · v6.0"
      title="AI Workforce"
      description="Every enterprise capability delivered as an internal specialisation of the single Digital Human — Business, Finance, Sales, Marketing, Education, Research, Creator, Legal, HR, Support, Operations, Manufacturing, Logistics, Analytics and Founder."
      icon={Users}
      features={[
        "Business",
        "Finance",
        "Sales",
        "Marketing",
        "Education",
        "Research",
        "Creator",
        "Legal",
        "HR",
        "Support",
        "Operations",
        "Manufacturing",
        "Logistics",
        "Analytics",
        "Founder",
      ]}
    />
  ),
});
