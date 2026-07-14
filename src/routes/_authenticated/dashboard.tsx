import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  GraduationCap,
  Building2,
  Palette,
  Shield,
  BookOpen,
  Users,
  Store,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "AI Sessions", value: "12,480", delta: "+18.2%", icon: Sparkles },
  { label: "Active Users", value: "4,213", delta: "+9.1%", icon: Users },
  { label: "System Health", value: "99.98%", delta: "Optimal", icon: Activity },
  { label: "Automations", value: "1,204", delta: "+42", icon: Zap },
];

const modules = [
  { title: "HAPPY AI Assistant", desc: "Human-centered conversational intelligence.", url: "/assistant", icon: Sparkles },
  { title: "Education", desc: "KG → PhD, competitive exams, 3D classrooms.", url: "/education", icon: GraduationCap },
  { title: "Business OS", desc: "CRM · ERP · HRMS · Finance · Analytics.", url: "/business", icon: Building2 },
  { title: "Creator Studio", desc: "Design, video, audio, brand — one canvas.", url: "/studio", icon: Palette },
  { title: "Enterprise", desc: "Multi-company, multi-brand, governance.", url: "/enterprise", icon: Shield },
  { title: "Knowledge", desc: "Culture, religion, philosophy, science.", url: "/knowledge", icon: BookOpen },
  { title: "Community", desc: "Verified spaces for humans + brands.", url: "/community", icon: Users },
  { title: "Marketplace", desc: "Apps, agents, plugins, workflows.", url: "/marketplace", icon: Store },
];

function Dashboard() {
  return (
    <div className="p-6 lg:p-10 space-y-10">
      <div>
        <p className="eyebrow mb-3">Executive Console</p>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight">
          Good to see you.
        </h1>
        <p className="mt-3 text-sm text-soft-gray max-w-xl">
          Your platform overview across every HAPPY X module. All systems calibrated.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="group relative rounded-2xl border border-white/5 bg-charcoal p-6 hover:border-gold/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="h-9 w-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <k.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-gold/70 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {k.delta}
              </span>
            </div>
            <p className="font-mono text-3xl tracking-tight text-paper">{k.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-soft-gray">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="eyebrow mb-2">Modules</p>
            <h2 className="font-display text-2xl tracking-tight">The HAPPY X Ecosystem</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <Link
              key={m.title}
              to={m.url}
              className="group relative rounded-2xl border border-white/5 bg-charcoal p-6 hover:border-gold/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-obsidian transition-colors">
                  <m.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-soft-gray group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-display text-base font-medium tracking-tight">{m.title}</h3>
              <p className="mt-1 text-xs text-soft-gray leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
