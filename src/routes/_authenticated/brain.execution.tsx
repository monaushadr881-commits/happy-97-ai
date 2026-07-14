import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/execution")({
  head: () => ({ meta: [{ title: "Brain Execution — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Execution Engine" description="Sequential, parallel, retry, rollback, timeout and cancellation." bullets={["Sequential","Parallel","Retry","Rollback","Timeout","Cancel","Dependency Graph","Queue","History"]} apiHints={["apiBrainExecute"]} />,
});
