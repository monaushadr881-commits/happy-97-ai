import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/runtime")({
  head: () => ({ meta: [{ title: "Agent Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Agent Runtime"
      description="Runtime manager for HAPPY's internal capabilities: business, education, knowledge, creator, research, support, founder, automation. One Digital Human — many capabilities."
      bullets={["Capability registry", "Scheduler", "Executor", "Task dispatcher", "Execution queue", "Capability context", "Cancel & retry", "Health"]}
      apiHints={["apiArStatus", "apiArCapabilities", "apiArSchedule", "apiArDispatch", "apiArExecute", "apiArQueue", "apiArContext", "apiArCancel"]}
    />
  ),
});
