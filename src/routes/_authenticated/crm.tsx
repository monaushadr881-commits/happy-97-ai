/** /crm — thin alias → /business/crm. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/crm")({
  beforeLoad: () => { throw redirect({ to: "/business/crm" }); },
});
