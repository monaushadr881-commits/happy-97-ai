/** /knowledge — Knowledge OS layout. */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { KnowledgeNav } from "@/components/knowledge/KnowledgeNav";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <Container className="py-6 md:py-10">
      <KnowledgeNav />
      <Outlet />
    </Container>
  ),
});
