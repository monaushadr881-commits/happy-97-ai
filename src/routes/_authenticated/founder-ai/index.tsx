import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/founder-ai/")({
  beforeLoad: () => { throw redirect({ to: "/founder-ai/dashboard" }); },
});
