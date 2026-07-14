import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/memory/preferences")({
  head: () => ({ meta: [{ title: "Memory Preferences — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Preference Memory"
      description="Long-lived preferences HAPPY remembers about you — communication style, defaults, working hours, tone."
      bullets={["Communication style", "Default tone", "Working hours", "Language preferences", "Reply length", "Domain expertise"]}
      apiHints={["apiMemoryPreferences", "apiMemoryUpdatePreferences"]}
    />
  ),
});
