/** /domains layout. */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({ meta: [{ title: "Domains — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
