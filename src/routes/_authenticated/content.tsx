/** /content — AI Content · Universal Builder · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [{ title: "AI Content — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Builder · v1.0"
      title="AI Content"
      description="Business plans, invoices, GST bills, contracts, emails, blogs, SEO copy."
      icon={PenLine}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
