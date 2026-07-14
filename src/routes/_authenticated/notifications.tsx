/** /notifications layout. */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
