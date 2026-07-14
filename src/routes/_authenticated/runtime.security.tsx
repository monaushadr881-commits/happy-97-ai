import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/security")({
  head: () => ({ meta: [{ title: "Runtime Security — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Security"
      description="Reuses v1.0 RBAC, RLS, permissions, audit and feature flags. Displays runtime security posture only."
      bullets={["RBAC", "RLS", "Permissions", "Audit", "Feature Flags", "Supabase Auth"]}
      apiHints={["securityRuntimeService", "apiSecurityStatus"]}
    />
  ),
});
