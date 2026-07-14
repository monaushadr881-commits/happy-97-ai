import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/tools/analytics")({
  head: () => ({ meta: [{ title: "Tool Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Tool Analytics"
      description="Usage, latency, failure and permission analytics per tool."
      bullets={["Usage", "Latency", "Failure rate", "Permission denials", "Family trends", "Cost per call"]}
      apiHints={["apiTrAnalytics"]}
    />
  ),
});
