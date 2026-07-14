/** /roadmap — public documentation of the HAPPY v2.0 – v6.0 roadmap. */
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: RoadmapDoc,
});

const PHASES = [
  {
    version: "v2.0",
    title: "AI Agent OS & Developer Platform",
    route: "/agent-os",
    items: [
      "Multi-Agent System", "Autonomous Task Engine", "Workflow Automation",
      "Plugin Marketplace", "Developer Platform", "SDK", "Public APIs",
      "AI Skills Marketplace", "Prompt Marketplace", "Enterprise Extensions",
    ],
  },
  {
    version: "v3.0",
    title: "Enterprise Intelligence",
    route: "/intelligence",
    items: [
      "Predictive Analytics", "Executive AI Advisor", "Business Forecasting",
      "Scenario Planning", "AI Reports", "AI Insights", "Decision Intelligence",
    ],
  },
  {
    version: "v4.0",
    title: "Global Platform",
    route: "/global",
    items: [
      "Localization", "Regional Settings", "Compliance Engine", "Tax Engine",
      "Currency Engine", "Timezone Engine", "Country Profiles", "Global Expansion Center",
    ],
  },
  {
    version: "v5.0",
    title: "Enterprise Cloud",
    route: "/enterprise-cloud",
    items: [
      "Enterprise SSO", "Organization Management", "Partner Portal", "Reseller Portal",
      "Enterprise Marketplace", "Integration Hub", "Identity Federation",
    ],
  },
  {
    version: "v6.0",
    title: "Autonomous Enterprise",
    route: "/autonomous",
    items: [
      "Robotics Integration", "IoT Integration", "Smart Factory", "Digital Twin",
      "AI Operations", "Enterprise Automation", "AI Process Manager",
    ],
  },
];

function RoadmapDoc() {
  return (
    <div className="p-6 lg:p-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-soft-gray hover:text-paper transition-colors mb-8">
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow">Documentation</p>
            <h1 className="font-display text-3xl lg:text-4xl tracking-tight">HAPPY Roadmap — v2.0 to v6.0</h1>
          </div>
        </div>
        <p className="text-sm text-soft-gray leading-relaxed max-w-2xl">
          Every roadmap module is already integrated into the HAPPY platform architecture: routes,
          navigation, feature flags, permissions, service interfaces and API contracts are reserved
          today. When each phase begins, implementation replaces internals only — no redesign is
          required.
        </p>

        <div className="mt-10 space-y-4">
          {PHASES.map((p) => (
            <Link
              key={p.version}
              to={p.route}
              className="block rounded-2xl border border-white/5 bg-charcoal p-5 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">{p.version}</p>
                  <h3 className="font-display text-lg tracking-tight text-paper">{p.title}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Reserved</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.items.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-paper/80">
                    {f}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
