import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/live")({
  head: () => ({ meta: [{ title: "Runtime Live — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Live Executions"
      description="Real-time stream of active capability dispatches, in-flight tool calls, and pipeline stages for the single Digital Human."
      bullets={["Live pipeline stages", "Active capabilities", "In-flight tool calls", "Memory footprint", "Scheduler queue", "Health signals"]}
      apiHints={["apiRtLive", "apiRtStatus", "apiRtHealth"]}
    />
  ),
});
