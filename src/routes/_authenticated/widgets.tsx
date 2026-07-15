/** /widgets — UUE v5.0 · Widget platform. */
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/widgets")({
  head: () => ({ meta: [{ title: "Widgets — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Widgets"
      description="Weather, calendar, tasks, goals, analytics, revenue, stocks, crypto, news and AI widgets for the dynamic dashboard."
      icon={LayoutDashboard}
      features={["Weather","Calendar","Tasks","Goals","Analytics","Revenue","Stocks","Crypto","News","Founder","AI"]}
    />
  ),
});
