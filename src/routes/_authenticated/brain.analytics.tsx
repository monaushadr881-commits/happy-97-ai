import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/analytics")({
  head: () => ({ meta: [{ title: "Brain Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Brain Analytics" description="Conversation, capability, memory, execution, performance and failure analytics." bullets={["Conversation","Capability","Memory","Execution","Performance","Failure"]} apiHints={["apiBrainAnalytics"]} />,
});
