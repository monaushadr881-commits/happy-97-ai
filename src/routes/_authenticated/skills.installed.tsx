import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/skills/installed")({
  head: () => ({ meta: [{ title: "Installed Skills — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Installed Skills"
      description="Manage installed skills, permissions and updates."
      bullets={["Installed inventory", "Permission scopes", "Update checker", "Rollback", "Analytics", "Uninstall"]}
      apiHints={["apiSkillsInstalled", "apiSkillsCheckUpdates", "apiSkillsUpdate", "apiSkillsPermissions", "apiSkillsUninstall"]}
    />
  ),
});
