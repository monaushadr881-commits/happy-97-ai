/** /learning — thin alias → /education. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/learning")({
  beforeLoad: () => { throw redirect({ to: "/education" }); },
});
