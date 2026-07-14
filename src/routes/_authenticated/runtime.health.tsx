import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/health")({
  head: () => ({ meta: [{ title: "Runtime Health — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Health"
      description="Live health signal for the autonomous runtime, per-capability and per-tool."
      bullets={["Health signal", "Success rate", "Capability health", "Tool health", "Workflow health"]}
      apiHints={["apiEngineHealth", "apiToolEngineHealth", "apiWfHealth"]}
    />
  ),
});
