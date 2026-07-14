/** /observability — Observability 2.0 · v12.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/observability")({
  head: () => ({ meta: [{ title: "Observability 2.0 — HAPPY v12.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Observability 2.0 · v12.0"
      title="Observability 2.0"
      description="Global, AI, business, cloud, security and performance monitoring with realtime analytics and a unified dashboard."
      icon={Gauge}
      features={["Global","AI","Business","Cloud","Security","Performance","Realtime","Unified"]}
    />
  ),
});
