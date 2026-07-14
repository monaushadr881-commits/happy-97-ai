import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/history")({
  head: () => ({ meta: [{ title: "Runtime History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime History"
      description="Rolling in-memory log of capability executions with status, stage traces and audit."
      bullets={["Rolling log", "Status", "Stage traces", "Latency", "Recovery", "Audit"]}
      apiHints={["apiEngineHistory", "apiEngineExecutions"]}
    />
  ),
});
