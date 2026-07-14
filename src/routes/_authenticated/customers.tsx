/** /customers — v6.0 Customer Portal surface. */
import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customer Portal — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Ecosystem · v6.0"
      title="Customer Portal"
      description="A single pane for every customer — orders, invoices, support, knowledge, feedback, success plans and health scoring."
      icon={UsersRound}
      features={["Orders","Invoices","Support","Knowledge","Feedback","Success Plans","Health Score","Analytics"]}
    />
  ),
});
