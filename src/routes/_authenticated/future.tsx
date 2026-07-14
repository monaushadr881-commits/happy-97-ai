/** /future — Future Readiness Center · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/future")({
  head: () => ({ meta: [{ title: "Future Readiness Center — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Future Readiness Center · v14.0"
      title="Future Readiness Center"
      description="Technology radar, capability roadmap, innovation pipeline, future trends, research tracker and platform evolution."
      icon={Rocket}
      features={["Radar","Roadmap","Innovation","Trends","Research","Evolution"]}
    />
  ),
});
