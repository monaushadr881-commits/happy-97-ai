/** /agent-os — v2.0 roadmap placeholder (Agent OS & Developer Platform). */
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/agent-os")({
  head: () => ({ meta: [{ title: "Agent OS — HAPPY Roadmap v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Roadmap · v2.0"
      title="Agent OS & Developer Platform"
      description="Reserved surface for autonomous agents, workflow automation and the HAPPY developer ecosystem. Navigation, permissions, feature flags and API contracts are already wired — activation ships with v2.0."
      icon={Bot}
      features={[
        "Multi-Agent System",
        "Autonomous Task Engine",
        "Workflow Automation",
        "Plugin Marketplace",
        "Developer Platform",
        "HAPPY SDK",
        "Public APIs",
        "AI Skills Marketplace",
        "Prompt Marketplace",
        "Enterprise Extensions",
      ]}
    />
  ),
});
