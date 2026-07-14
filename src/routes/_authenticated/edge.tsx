/** /edge — Edge AI Platform · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/edge")({
  head: () => ({ meta: [{ title: "Edge AI Platform — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Edge AI Platform · v11.0"
      title="Edge AI Platform"
      description="Edge dashboard, runtime, nodes, applications, monitoring, analytics, deployment and synchronization."
      icon={Cpu}
      features={["Dashboard","Runtime","Nodes","Apps","Monitoring","Analytics","Deployment","Sync"]}
    />
  ),
});
