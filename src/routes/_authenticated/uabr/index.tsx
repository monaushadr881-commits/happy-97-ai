import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/uabr/")({
  beforeLoad: () => { throw redirect({ to: "/uabr/dashboard" }); },
});
