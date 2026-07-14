/** /plugins/store — Plugin Marketplace (reserved). */
import { createFileRoute } from "@tanstack/react-router";
import { Store, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plugins/store")({
  head: () => ({ meta: [{ title: "Plugin Store — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: PluginStore,
});

const CATEGORIES = ["All", "Business", "Education", "Creator", "Automation", "Analytics", "Voice", "Integrations"] as const;

const PLACEHOLDERS = [
  { name: "Stripe Payments", category: "Business", desc: "Sync invoices and revenue into HAPPY." },
  { name: "Notion Sync", category: "Knowledge", desc: "Two-way sync for pages and databases." },
  { name: "Zapier Bridge", category: "Automation", desc: "Trigger 6,000+ downstream apps." },
  { name: "Google Calendar", category: "Business", desc: "Meetings, blocks, and reminders." },
  { name: "HubSpot CRM", category: "Business", desc: "Contacts, deals, and pipeline sync." },
  { name: "Slack Presence", category: "Integrations", desc: "Bring HAPPY into Slack channels." },
];

function PluginStore() {
  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-soft-gray/60" />
          <input
            type="search"
            placeholder="Search plugins…"
            aria-label="Search plugins"
            disabled
            className="w-full rounded-lg border border-white/5 bg-charcoal pl-9 pr-3 py-2 text-sm text-paper/90 placeholder:text-soft-gray/60 focus:outline-none focus:border-gold/40 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              disabled
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                i === 0 ? "border-gold/40 bg-gold/10 text-gold" : "border-white/5 bg-charcoal text-soft-gray/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLACEHOLDERS.map((p) => (
          <article key={p.name} className="rounded-xl border border-white/5 bg-charcoal p-4 hover:border-gold/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base truncate">{p.name}</h3>
                <p className="text-[11px] text-soft-gray/70">{p.category}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-soft-gray leading-relaxed">{p.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-soft-gray/60">
                <Sparkles className="h-3 w-3 text-gold" /> Reserved
              </span>
              <button disabled className="rounded-md border border-white/5 px-3 py-1 text-[11px] text-soft-gray/60">
                Install
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="text-[11px] text-soft-gray/60">
        Catalog rendered from the reserved <code>apiSearchPluginStore</code> contract. Live listings ship
        with the plugin runtime.
      </p>
    </div>
  );
}
