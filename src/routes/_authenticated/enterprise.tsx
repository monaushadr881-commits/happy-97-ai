import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/enterprise")({
  head: () => ({ meta: [{ title: "Enterprise — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Governance"
      title="Enterprise Control Center"
      icon={Shield}
      description="Multi-company, multi-brand, RBAC, MFA, audit logs, privacy and compliance — enterprise controls built in from day one."
      features={["Multi-Company", "Multi-Brand", "RBAC", "MFA", "Audit Logs", "Privacy Center", "Backup & Restore", "SSO", "Data Residency"]}
    />
  ),
});
