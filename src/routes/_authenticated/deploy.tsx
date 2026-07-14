/** /deploy — Deploy · Universal Builder · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/deploy")({
  head: () => ({ meta: [{ title: "Deploy — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Builder · v1.0"
      title="Deploy"
      description="Deploy websites, apps, backends, databases with SSL, CDN & analytics."
      icon={Rocket}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
