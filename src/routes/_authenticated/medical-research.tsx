/** /medical-research — Medical Research · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Microscope } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/medical-research")({
  head: () => ({ meta: [{ title: "Medical Research — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Medical Research · v9.0"
      title="Medical Research"
      description="Research library, clinical literature, study management, notes, knowledge graph and AI research assistant."
      icon={Microscope}
      features={["Library","Clinical Literature","Studies","Notes","Knowledge Graph","AI Research"]}
    />
  ),
});
