/** /notifications/archive — Archived · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Archive } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications/archive")({
  head: () => ({ meta: [{ title: "Archived — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Archived"
      description="Archived notifications with restore & delete."
      icon={Archive}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
