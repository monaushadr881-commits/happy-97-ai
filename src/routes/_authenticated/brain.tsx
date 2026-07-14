import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/brain")({
  head: () => ({ meta: [{ title: "Enterprise Brain — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
