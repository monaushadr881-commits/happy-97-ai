/** /credits — thin alias → /founder/ops. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/credits")({
  beforeLoad: () => { throw redirect({ to: "/founder/ops" }); },
});
