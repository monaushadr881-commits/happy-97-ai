/** /hrms — thin alias → /enterprise/people. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hrms")({
  beforeLoad: () => { throw redirect({ to: "/enterprise/people" }); },
});
