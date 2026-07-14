/** /customer360 — v7.0 Customer 360 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { UserSearch } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/customer360")({
  head: () => ({ meta: [{ title: "Customer 360 — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Customer Experience Platform · v7.0"
      title="Customer 360"
      description="Complete customer experience — 360 view, journey, analytics, health, loyalty, rewards, feedback, surveys and support."
      icon={UserSearch}
      features={["Customer 360","Customer Journey","Customer Analytics","Customer Health","Customer Loyalty","Rewards","Feedback","Surveys","Support"]}
    />
  ),
});
