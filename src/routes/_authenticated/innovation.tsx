/** /innovation — Innovation Platform · v15.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/innovation")({
  head: () => ({ meta: [{ title: "Innovation Platform — HAPPY v15.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Innovation Platform · v15.0"
      title="Innovation Platform"
      description="Innovation pipeline, labs, patents, partners and analytics."
      icon={Lightbulb}
      features={["Pipeline","Labs","Patents","Partners","Analytics"]}
    />
  ),
});
