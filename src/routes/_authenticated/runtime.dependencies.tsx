import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/dependencies")({
  head: () => ({ meta: [{ title: "Runtime Dependencies — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Plan Dependencies"
      description="Layered dependency graph for the active plan. Each layer executes in parallel; layers execute in order."
      bullets={["Dependency graph", "Layered execution", "Critical path", "Blocked steps"]}
      apiHints={["apiPlannerDependencies", "apiPlannerPrioritise"]}
    />
  ),
});
