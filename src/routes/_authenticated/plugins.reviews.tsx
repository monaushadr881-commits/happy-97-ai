import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/plugins/reviews")({
  head: () => ({ meta: [{ title: "Plugin Reviews — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Reviews & Community"
      description="Ratings, verified reviews and workspace testimonials for every listed plugin."
      bullets={["Ratings & reviews", "Verified installs", "Response threads", "Report abuse", "Analytics", "Featured picks"]}
      apiHints={["apiPluginListReviews", "apiPluginSubmitReview"]}
    />
  ),
});
