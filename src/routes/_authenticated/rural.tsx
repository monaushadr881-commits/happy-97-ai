/** /rural — Rural Development · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Trees } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/rural")({
  head: () => ({ meta: [{ title: "Rural Development — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Rural Development · v8.0"
      title="Rural Development"
      description="Village dashboards, agriculture, farmer services, crop and weather intelligence, water resources, livestock and market prices."
      icon={Trees}
      features={["Village Dashboard","Agriculture","Farmer Services","Crop Intelligence","Weather","Water Resources","Livestock","Market Prices"]}
    />
  ),
});
