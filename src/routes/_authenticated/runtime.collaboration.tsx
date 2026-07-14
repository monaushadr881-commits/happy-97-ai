import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/collaboration")({
  head: () => ({ meta: [{ title: "Collaboration Engine — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Collaboration Engine"
      description="Capability coordinator, shared context/memory, consensus, conflict resolver, priority resolver, response composer, timeline, analytics — one Digital Human."
      bullets={["Coordinator", "Shared Context", "Shared Memory", "Consensus", "Conflict Resolver", "Priority Resolver", "Response Composer", "Timeline", "Analytics"]}
      apiHints={["collaborationRuntimeService", "apiCollaborationStatus"]}
    />
  ),
});
