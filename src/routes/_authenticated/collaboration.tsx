/** /collaboration — Global Collaboration · v12.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/collaboration")({
  head: () => ({ meta: [{ title: "Global Collaboration — HAPPY v12.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Collaboration · v12.0"
      title="Global Collaboration"
      description="Workspace network, cross-company and cross-brand collaboration, projects, knowledge sharing, enterprise messaging, meetings and approvals."
      icon={UsersRound}
      features={["Workspace Network","Cross-Company","Cross-Brand","Projects","Knowledge Sharing","Messaging","Meetings","Approvals"]}
    />
  ),
});
