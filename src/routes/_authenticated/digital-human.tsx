/**
 * /digital-human — HAPPY Digital Human OS (HDHOS).
 * The signature surface of HAPPY X. One identity, many modes.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { DigitalHumanProvider } from "@/components/digital-human/DigitalHumanContext";
import { DigitalHumanNav } from "@/components/digital-human/DigitalHumanNav";

export const Route = createFileRoute("/_authenticated/digital-human")({
  head: () => ({ meta: [
    { title: "HAPPY Digital Human — HAPPY X" },
    { name: "robots", content: "noindex" },
  ]}),
  component: DigitalHumanLayout,
});

function DigitalHumanLayout() {
  return (
    <DigitalHumanProvider>
      <Container className="py-6 md:py-10">
        <DigitalHumanNav />
        <Outlet />
      </Container>
    </DigitalHumanProvider>
  );
}
