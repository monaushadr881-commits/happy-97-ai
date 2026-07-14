/** /messages — unified messaging surface. */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { MarketplaceNav } from "@/components/cmos/MarketplaceNav";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <Container className="py-6 md:py-10">
      <MarketplaceNav />
      <Outlet />
    </Container>
  ),
});
