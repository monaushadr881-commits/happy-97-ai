/** /cloud/deployments — v5.0 Production Deployment Center. */
import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/deployments")({
  head: () => ({ meta: [{ title: "Deployments — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Production Deployment Center"
      description="Deployments, rollbacks, releases, canary and blue/green strategies, health checks and release notes — production-grade delivery for HAPPY."
      icon={Rocket}
      features={[
        "Deployments",
        "Rollbacks",
        "Releases",
        "Release Notes",
        "Health Checks",
        "Canary",
        "Blue/Green",
        "Environments",
        "Deployment Analytics",
      ]}
    />
  ),
});
