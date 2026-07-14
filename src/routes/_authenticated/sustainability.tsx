/** /sustainability — Sustainability Platform · v15.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/sustainability")({
  head: () => ({ meta: [{ title: "Sustainability Platform — HAPPY v15.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Sustainability Platform · v15.0"
      title="Sustainability Platform"
      description="Carbon, energy, ESG tracking, sustainability goals, environmental reports, green analytics."
      icon={Leaf}
      features={["Carbon","Energy","ESG","Goals","Reports","Green Analytics"]}
    />
  ),
});
