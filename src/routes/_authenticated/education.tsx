/**
 * /education — HAPPY AI Education Operating System (Education OS).
 * The world's first AI-native education platform. HAPPY is the AI Teacher,
 * Professor, Mentor, Tutor and Coach — these are teaching modes, not roles.
 * No teacher entity exists in the database or the UI.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { EducationProvider } from "@/components/education/EducationContext";
import { EducationNav } from "@/components/education/EducationNav";

export const Route = createFileRoute("/_authenticated/education")({
  head: () => ({
    meta: [
      { title: "Education OS — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EducationLayout,
});

function EducationLayout() {
  return (
    <EducationProvider>
      <Container className="py-6 md:py-10">
        <EducationNav />
        <Outlet />
      </Container>
    </EducationProvider>
  );
}
