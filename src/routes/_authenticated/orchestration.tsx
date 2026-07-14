/** /orchestration — Global Orchestration · v12.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/orchestration")({
  head: () => ({ meta: [{ title: "Global Orchestration — HAPPY v12.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Orchestration · v12.0"
      title="Global Orchestration"
      description="Capability router, runtime scheduler, execution planner, dependency graph, task queue, workflow router, priority scheduler and load balancer."
      icon={GitBranch}
      features={["Capability Router","Runtime Scheduler","Execution Planner","Dependency Graph","Task Queue","Workflow Router","Priority","Load Balancer"]}
    />
  ),
});
