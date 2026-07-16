/** /wallet — thin alias → /founder/ops. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/wallet")({
  beforeLoad: () => { throw redirect({ to: "/founder/ops" }); },
});
