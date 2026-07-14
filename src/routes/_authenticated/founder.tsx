import { createFileRoute } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/founder")({
  head: () => ({ meta: [{ title: "Founder — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Sovereign"
      title="Founder Dashboard"
      icon={Crown}
      description="Complete authority over the HAPPY ecosystem — companies, brands, users, AI, revenue, systems and strategy in one command surface."
      features={["Global Analytics", "Revenue", "User Growth", "System Health", "AI Health", "Companies", "Brands", "Automation", "Security"]}
    />
  ),
});
