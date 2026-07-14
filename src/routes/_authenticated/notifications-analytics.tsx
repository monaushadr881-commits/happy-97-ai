/** /notifications/analytics — Analytics · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications-analytics")({
  head: () => ({ meta: [{ title: "Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Analytics"
      description="Delivered, opened, clicked, engagement & channel performance."
      icon={BarChart3}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
