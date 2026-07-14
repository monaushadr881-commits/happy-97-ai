/**
 * /business — HAPPY Business Operating System (Business OS)
 * Unified CRM, ERP, HRMS, Inventory, Manufacturing, Finance, Automation.
 * Company-scoped, service-layer only; all data via api-v1 + business-v1.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { BusinessProvider } from "@/components/business/BusinessContext";
import { BusinessNav } from "@/components/business/BusinessNav";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({
    meta: [
      { title: "Business OS — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessLayout,
});

function BusinessLayout() {
  return (
    <BusinessProvider>
      <Container className="py-6 md:py-10">
        <BusinessNav />
        <Outlet />
      </Container>
    </BusinessProvider>
  );
}
