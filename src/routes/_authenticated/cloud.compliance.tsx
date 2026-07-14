/** /cloud/compliance — v5.0 Enterprise Compliance. */
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/compliance")({
  head: () => ({ meta: [{ title: "Cloud Compliance — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Enterprise Compliance"
      description="SOC, ISO and GDPR readiness, audit exports, retention policies and privacy controls — reusing HAPPY RBAC, RLS and audit primitives."
      icon={ShieldCheck}
      features={[
        "SOC Readiness",
        "ISO Readiness",
        "GDPR Readiness",
        "Audit Exports",
        "Retention Policies",
        "Privacy Controls",
        "Data Residency",
      ]}
    />
  ),
});
