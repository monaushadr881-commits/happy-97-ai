/** /hyperlocal — Hyperlocal Intelligence OS (HIOS) layout. */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { HyperlocalNav } from "@/components/hyperlocal/HyperlocalNav";

export const Route = createFileRoute("/_authenticated/hyperlocal")({
  head: () => ({
    meta: [
      { title: "Hyperlocal — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Container className="py-6 md:py-10">
      <HyperlocalNav />
      <Outlet />
    </Container>
  ),
});
