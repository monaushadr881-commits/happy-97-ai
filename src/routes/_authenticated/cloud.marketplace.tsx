/** /cloud/marketplace — v5.0 AI Agent & Enterprise App Marketplace. */
import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/marketplace")({
  head: () => ({ meta: [{ title: "Cloud Marketplace — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="AI Agent & App Marketplace"
      description="Browse, install and configure AI agents and enterprise apps across Android, iOS, Windows, macOS, Linux and Web — with ratings, versioning, permissions and billing."
      icon={Store}
      features={[
        "Browse Agents",
        "Install Agents",
        "Configure Agents",
        "Ratings",
        "Versioning",
        "Permissions",
        "Billing Support",
        "Android",
        "iOS",
        "Windows",
        "macOS",
        "Linux",
        "Web",
      ]}
    />
  ),
});
