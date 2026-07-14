/** /notifications — Notification Center. */
import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notification Center — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Notification Center"
      description="Universal inbox, unread & read counters, archive, starred, pinned, priority, categories, search."
      icon={Bell}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
