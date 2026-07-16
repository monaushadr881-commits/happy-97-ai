/** /admin — thin alias → /founder. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => { throw redirect({ to: "/founder" }); },
});
