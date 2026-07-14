import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/skills/settings")({
  head: () => ({ meta: [{ title: "Skill Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Skill Settings"
      description="Marketplace defaults, auto-update policy, verification requirements and analytics opt-in."
      bullets={["Auto-update", "Verification required", "Permission defaults", "Analytics opt-in", "Regional visibility", "Publisher allow-list"]}
      apiHints={["apiSkillsSettings", "apiSkillsUpdateSettings"]}
    />
  ),
});
