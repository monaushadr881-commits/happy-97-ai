/** /notifications/history — Notification History · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications/history")({
  head: () => ({ meta: [{ title: "Notification History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Notification History"
      description="Full delivery history across all channels."
      icon={History}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
