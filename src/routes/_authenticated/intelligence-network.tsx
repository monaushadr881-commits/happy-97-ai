/** /intelligence-network — Intelligence Network · v13.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/intelligence-network")({
  head: () => ({ meta: [{ title: "Intelligence Network — HAPPY v13.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Intelligence Network · v13.0"
      title="Intelligence Network"
      description="Live intelligence network view across every HAPPY module and runtime."
      icon={Network}
      features={["Live Topology","Nodes","Edges","Signal Flow"]}
    />
  ),
});
