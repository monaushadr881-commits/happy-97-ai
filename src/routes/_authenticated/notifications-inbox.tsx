/** /notifications/inbox — Notification Inbox · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications-inbox")({
  head: () => ({ meta: [{ title: "Notification Inbox — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Notification Inbox"
      description="Live inbox with timeline, filters, bulk actions and priority tagging."
      icon={Inbox}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
