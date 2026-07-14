/** /community — Community OS layout. */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { CommunityNav } from "@/components/cmos/CommunityNav";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <Container className="py-6 md:py-10">
      <CommunityNav />
      <Outlet />
    </Container>
  ),
});
