/** /support — thin alias → /enterprise/comms. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/support")({
  beforeLoad: () => { throw redirect({ to: "/enterprise/comms" }); },
});
