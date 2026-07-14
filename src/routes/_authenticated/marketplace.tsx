import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Extend"
      title="Marketplace"
      icon={Store}
      description="Apps, agents, plugins and workflows — a curated marketplace where the HAPPY ecosystem grows with the community."
      features={["Apps", "Agents", "Plugins", "Workflows", "Templates", "Revenue Share", "Verified Publishers"]}
    />
  ),
});
