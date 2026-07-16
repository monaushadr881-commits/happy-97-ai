/** /library — thin alias → /education/library. Reuses existing implementation. */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/library")({
  beforeLoad: () => { throw redirect({ to: "/education/library" }); },
});
