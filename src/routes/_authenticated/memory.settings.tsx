import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/memory/settings")({
  head: () => ({ meta: [{ title: "Memory Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Memory Settings"
      description="Privacy, encryption, retention and expiry controls for every memory scope."
      bullets={["Encryption at rest", "Retention windows", "Auto-expiry rules", "Privacy tiers", "Export & delete", "Audit trail"]}
      apiHints={["apiMemorySettings", "apiMemoryUpdateSettings", "apiMemoryDelete"]}
    />
  ),
});
