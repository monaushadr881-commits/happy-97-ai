/** /agents — v4.0 Autonomous Agents surface (internal capabilities of HAPPY). */
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({ meta: [{ title: "Agents — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="Autonomous Agents"
      description="Goal, planner, research, business, education, creator, automation, monitoring, execution, validation, recovery and learning agents — all internal capabilities of the single Digital Human, HAPPY."
      icon={Bot}
      features={[
        "Goal Agent",
        "Planner Agent",
        "Research Agent",
        "Business Agent",
        "Education Agent",
        "Creator Agent",
        "Automation Agent",
        "Monitoring Agent",
        "Execution Agent",
        "Validation Agent",
        "Recovery Agent",
        "Learning Agent",
      ]}
    />
  ),
});
