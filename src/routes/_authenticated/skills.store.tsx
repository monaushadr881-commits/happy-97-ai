import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/skills/store")({
  head: () => ({ meta: [{ title: "Skills Store — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Skills Store"
      description="Browse, search and install verified enterprise skills."
      bullets={["Search & filter", "Category browse", "Ratings & reviews", "Verified badge", "One-click install", "Version pinning"]}
      apiHints={["apiSkillsStore", "apiSkillsDetail", "apiSkillsInstall", "apiSkillsRatings"]}
    />
  ),
});
