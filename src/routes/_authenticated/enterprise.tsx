/**
 * /enterprise — Enterprise Control Center layout.
 * Provides company context + persistent sub-navigation to every child route.
 * Every child consumes only the versioned API (api-v1 + enterprise-v1).
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { EnterpriseProvider } from "@/components/enterprise/EnterpriseContext";
import { EnterpriseNav } from "@/components/enterprise/EnterpriseNav";

export const Route = createFileRoute("/_authenticated/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise Control Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnterpriseLayout,
});

function EnterpriseLayout() {
  return (
    <EnterpriseProvider>
      <Container className="py-6 md:py-10">
        <EnterpriseNav />
        <Outlet />
      </Container>
    </EnterpriseProvider>
  );
}
