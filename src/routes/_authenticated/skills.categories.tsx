import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/skills/categories")({
  head: () => ({ meta: [{ title: "Skill Categories — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Skill Categories"
      description="Skills grouped by domain for discoverability."
      bullets={["Business", "Education", "Research", "Coding", "Finance & Legal", "Healthcare & Agriculture", "Sales & Support", "Presentation & Writing"]}
      apiHints={["apiSkillsCategories"]}
    />
  ),
});
