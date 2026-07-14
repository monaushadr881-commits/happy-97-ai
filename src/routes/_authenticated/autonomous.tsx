/** /autonomous — v6.0 roadmap placeholder (Autonomous Enterprise). */
import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/autonomous")({
  head: () => ({ meta: [{ title: "Autonomous — HAPPY Roadmap v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Roadmap · v6.0"
      title="Autonomous Enterprise"
      description="Reserved surface for robotics, IoT, smart factory, digital twin, AI operations, enterprise automation and the AI process manager. Contracts are in place — orchestration activates with v6.0."
      icon={Cpu}
      features={[
        "Robotics Integration",
        "IoT Integration",
        "Smart Factory",
        "Digital Twin",
        "AI Operations",
        "Enterprise Automation",
        "AI Process Manager",
      ]}
    />
  ),
});
