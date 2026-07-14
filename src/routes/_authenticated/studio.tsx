/**
 * /studio — HAPPY Creator OS layout.
 * The unified AI-native Creative Operating System. One identity (HAPPY),
 * many studios (image, voice, presentation, copy, marketing, brand).
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { CreatorNav } from "@/components/creator/CreatorNav";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [
    { title: "Creator OS — HAPPY X" },
    { name: "robots", content: "noindex" },
  ]}),
  component: CreatorLayout,
});

function CreatorLayout() {
  return (
    <Container className="py-6 md:py-10">
      <CreatorNav />
      <Outlet />
    </Container>
  );
}
