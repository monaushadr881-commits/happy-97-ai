import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/collaboration/live")({
  head: () => ({ meta: [{ title: "Live Collaboration — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Live Collaboration Graph"
      description="Real-time view of capability selection, dependency graph, execution queue and consensus status for the active session."
      bullets={["Capability timeline", "Execution queue", "Dependency graph", "Consensus status", "Conflict resolution", "Shared context stream"]}
      apiHints={["apiCollabLive", "apiCollabSharedContext", "apiCollabSharedMemory", "apiCollabConsensus"]}
    />
  ),
});
