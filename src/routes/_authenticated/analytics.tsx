/** /analytics — thin alias → /founder/analytics. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analytics")({
  beforeLoad: () => { throw redirect({ to: "/founder/analytics" }); },
});
