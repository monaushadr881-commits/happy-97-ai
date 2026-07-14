import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/skills")({
  head: () => ({ meta: [{ title: "AI Skills Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="AI Skills Runtime"
      description="Skill registry, loader, marketplace, manager, categories, verification, updates and analytics."
      bullets={["Registry", "Loader", "Marketplace", "Manager", "Categories", "Verification", "Updates", "Analytics"]}
      apiHints={["skillsRuntimeService", "apiSkillsStatus"]}
    />
  ),
});
