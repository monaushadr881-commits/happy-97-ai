/** /erp — thin alias → /enterprise/business. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/erp")({
  beforeLoad: () => { throw redirect({ to: "/enterprise/business" }); },
});
