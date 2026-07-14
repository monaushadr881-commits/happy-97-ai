/** /intelligence-exchange — Intelligence Exchange · v17.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/intelligence-exchange")({
  head: () => ({ meta: [{ title: "Intelligence Exchange — HAPPY v17.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Intelligence Exchange · v17.0"
      title="Intelligence Exchange"
      description="Capability, knowledge, workflow, template, automation marketplace and enterprise exchange."
      icon={Sparkles}
      features={["Capabilities","Knowledge","Workflows","Templates","Automation","Exchange"]}
    />
  ),
});
