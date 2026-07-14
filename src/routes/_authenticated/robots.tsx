/** /robots — Robot Fleet · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Cog } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/robots")({
  head: () => ({ meta: [{ title: "Robot Fleet — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Robot Fleet · v11.0"
      title="Robot Fleet"
      description="Live registry of every robot with health, missions and telemetry."
      icon={Cog}
      features={["Fleet Registry","Live Telemetry","Mission Feed","Health"]}
    />
  ),
});
