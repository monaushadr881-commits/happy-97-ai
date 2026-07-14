/** /enterprise-cloud — v5.0 roadmap placeholder (Enterprise Cloud). */
import { createFileRoute } from "@tanstack/react-router";
import { Cloud } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/enterprise-cloud")({
  head: () => ({ meta: [{ title: "Enterprise Cloud — HAPPY Roadmap v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Roadmap · v5.0"
      title="Enterprise Cloud"
      description="Reserved surface for enterprise SSO, organization management, partner and reseller portals, the integration hub and identity federation. Contracts are in place — services activate with v5.0."
      icon={Cloud}
      features={[
        "Enterprise SSO",
        "Organization Management",
        "Partner Portal",
        "Reseller Portal",
        "Enterprise Marketplace",
        "Integration Hub",
        "Identity Federation",
      ]}
    />
  ),
});
