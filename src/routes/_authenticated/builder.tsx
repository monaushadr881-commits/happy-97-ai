/** /builder — Universal Builder · Universal Builder · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Wand2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({ meta: [{ title: "Universal Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Builder · v1.0"
      title="Universal Builder"
      description="No-code / low-code AI builder for websites, apps, ERP, CRM, HRMS, LMS, marketplaces and more."
      icon={Wand2}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
