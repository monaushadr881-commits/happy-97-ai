/** /cloud/models — v5.0 AI Model Management. */
import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/models")({
  head: () => ({ meta: [{ title: "AI Models — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="AI Model Management"
      description="OpenAI, Anthropic, Google, Azure OpenAI, local and custom models — provider failover, routing, and cost analytics unified through the Enterprise Brain."
      icon={Cpu}
      features={[
        "OpenAI",
        "Anthropic",
        "Google",
        "Azure OpenAI",
        "Local Models",
        "Custom Models",
        "Provider Failover",
        "Routing Policies",
        "Cost Analytics",
      ]}
    />
  ),
});
