/** /plugins/settings — Plugin ecosystem settings (reserved). */
import { createFileRoute } from "@tanstack/react-router";
import { Settings, ShieldCheck, BarChart3, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plugins/settings")({
  head: () => ({ meta: [{ title: "Plugin Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: PluginSettings,
});

const GROUPS = [
  {
    icon: ShieldCheck,
    title: "Permissions",
    desc: "Default scopes granted to newly installed plugins.",
    controls: ["Require approval for all permissions", "Restrict data-access scopes", "Founder-only publish"],
  },
  {
    icon: RefreshCw,
    title: "Updates",
    desc: "How HAPPY handles new plugin versions.",
    controls: ["Auto-update patch releases", "Notify on major versions", "Roll back on failure"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Telemetry captured about plugin usage.",
    controls: ["Anonymous usage metrics", "Error reporting", "Marketplace insights"],
  },
];

function PluginSettings() {
  return (
    <div className="mt-8 space-y-4">
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-xl border border-white/5 bg-charcoal p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <g.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base">{g.title}</h3>
              <p className="text-xs text-soft-gray mt-1">{g.desc}</p>
              <ul className="mt-3 space-y-2">
                {g.controls.map((c) => (
                  <li key={c} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                    <span className="text-xs text-paper/90">{c}</span>
                    <span aria-hidden className="h-5 w-9 rounded-full bg-white/5 border border-white/10 relative">
                      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-soft-gray/60" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent p-4 flex items-start gap-3">
        <Settings className="h-4 w-4 text-gold mt-0.5" />
        <p className="text-xs text-soft-gray">
          Controls are visual placeholders wired to reserved <code>apiUpdatePluginSettings</code>. Values
          persist once the plugin runtime activates.
        </p>
      </div>
    </div>
  );
}
