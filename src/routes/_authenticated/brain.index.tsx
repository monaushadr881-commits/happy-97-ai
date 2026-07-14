import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/")({
  head: () => ({ meta: [{ title: "Enterprise Brain — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Enterprise Brain"
      description="HAPPY's single unified brain — orchestrates intent, memory, reasoning, planning, execution, validation, reflection and learning through one Digital Human."
      bullets={["Intent Router", "Context Collector", "Memory Coordinator", "Capability Coordinator", "Reasoning Engine", "Planning Engine", "Execution Engine", "Validation Engine", "Reflection Engine", "Learning Engine", "Analytics Engine", "Safety Engine"]}
      apiHints={["brainService", "apiBrainStatus", "apiBrainProcess"]}
    />
  ),
});
