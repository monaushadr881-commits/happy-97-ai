import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/tools/live")({
  head: () => ({ meta: [{ title: "Tool Runtime Live — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Live Tool Calls"
      description="In-flight tool executions with input, permission decision and sandbox status."
      bullets={["In-flight tools", "Permission decision", "Sandbox status", "Queue depth", "Health"]}
      apiHints={["apiToolExecLive", "apiToolExecQueue", "apiToolExecHealth"]}
    />
  ),
});
