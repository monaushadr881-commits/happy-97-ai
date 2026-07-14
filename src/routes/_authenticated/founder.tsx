/**
 * /founder — Founder Command Center layout.
 * Renders sub-navigation and the Cmd+K palette; children render inside <Outlet/>.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { FounderNav } from "@/components/founder/FounderNav";
import { CommandPalette } from "@/components/founder/CommandPalette";

export const Route = createFileRoute("/_authenticated/founder")({
  head: () => ({
    meta: [
      { title: "Founder Command Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FounderLayout,
});

function FounderLayout() {
  return (
    <Container className="py-6 md:py-10">
      <FounderNav />
      <Outlet />
      <CommandPalette />
    </Container>
  );
}
