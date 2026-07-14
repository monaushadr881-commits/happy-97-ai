/** /insights — Global Insight Engine · v15.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Global Insight Engine — HAPPY v15.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Insight Engine · v15.0"
      title="Global Insight Engine"
      description="Executive, market, customer, business, knowledge insights plus trend and forecast intelligence."
      icon={LineChart}
      features={["Executive","Market","Customer","Business","Knowledge","Trends","Forecast"]}
    />
  ),
});
