import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/planning")({
  head: () => ({ meta: [{ title: "Brain Planning — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Planning Engine" description="Task, timeline, priority, milestone, retry and rollback planning." bullets={["Task","Timeline","Execution","Priority","Scenario","Milestones","Retry","Rollback"]} apiHints={["apiBrainPlan"]} />,
});
