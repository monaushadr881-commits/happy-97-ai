/**
 * HAPPY Enterprise Edition — Pricing Experience v5.0 Luxury Enterprise
 * Additive layer. Renders below PricingExperience v4.0.
 * Frontend-only. No backend / service / API modifications.
 */
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bot, Mic, Presentation, PenTool, ArrowRight, ArrowRightLeft, Sparkles,
  GraduationCap, Briefcase, Building2, Factory, Landmark, Users, Search,
  Check, Shield, Globe, Cpu, Database, Layers, TrendingUp, Rocket, Palette,
  Code2, Stethoscope, Hospital, LineChart, Calendar, Phone, MessageSquare,
  Mail, PlayCircle, Video, Award, Lock, HeartHandshake, ChevronDown, Zap,
  Trophy, Radio, Volume2, Puzzle,
} from "lucide-react";

/* ─────────────── shared ─────────────── */
const PLANS = ["Free", "Starter", "Pro", "Business", "Enterprise"] as const;
type PlanName = typeof PLANS[number];

const Section = ({ id, eyebrow, title, kicker, children }: {
  id: string; eyebrow: string; title: string; kicker?: string; children: ReactNode;
}) => (
  <section id={id} aria-labelledby={`${id}-h`} className="relative border-t border-gold/10 py-20">
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-charcoal/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold backdrop-blur">
          <Sparkles className="h-3 w-3" aria-hidden /> {eyebrow}
        </span>
        <h2 id={`${id}-h`} className="font-display text-3xl font-semibold tracking-tight text-paper md:text-5xl">{title}</h2>
        {kicker ? <p className="max-w-2xl text-[14.5px] leading-relaxed text-soft-gray md:text-base">{kicker}</p> : null}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  </section>
);

const Card = ({ className = "", children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-2xl border border-gold/15 bg-obsidian/60 p-5 backdrop-blur transition-all duration-300 hover:border-gold/35 hover:shadow-[0_0_40px_-20px_rgba(232,201,106,0.55)] ${className}`}>
    {children}
  </div>
);

const useCounter = (target: number, active: boolean, ms = 900) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return v;
};

/* ─────────────── 1. Interactive AI Sales Experience ─────────────── */
const SALES_MODES = [
  { id: "voice", label: "Voice", icon: Mic, copy: "Ask HAPPY out loud — plan questions, feature deep-dives, upgrade rationale." },
  { id: "text", label: "Text", icon: MessageSquare, copy: "Chat with HAPPY. Instant answers grounded in the live pricing catalog." },
  { id: "present", label: "Presentation", icon: Presentation, copy: "HAPPY presents each plan like an enterprise pitch deck." },
  { id: "board", label: "Whiteboard", icon: PenTool, copy: "Draw your org and HAPPY sketches the right rollout live." },
] as const;

const AISalesExperience = memo(function AISalesExperience() {
  const [mode, setMode] = useState<typeof SALES_MODES[number]["id"]>("voice");
  const active = SALES_MODES.find((m) => m.id === mode)!;
  const Icon = active.icon;
  return (
    <Section id="v5-sales" eyebrow="AI Sales" title="Meet HAPPY — your Digital Human sales advisor"
      kicker="Voice, text, presentation, whiteboard. HAPPY greets every visitor, explains every plan, recommends upgrades and answers pricing questions in real time.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl motion-safe:animate-pulse" aria-hidden />
          <div className="flex items-start gap-4">
            <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Bot className="h-8 w-8 text-gold" aria-hidden />
              <span className="absolute inset-0 rounded-full border border-gold/40 motion-safe:animate-ping" aria-hidden />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gold">HAPPY · Live · {active.label} mode</div>
              <p className="mt-1 text-[15px] leading-relaxed text-paper">
                "Hi — I'm HAPPY. Tell me your team size, industry and goals and I'll shortlist the right plan, features and rollout for you."
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SALES_MODES.map((m) => {
                  const MIcon = m.icon; const on = m.id === mode;
                  return (
                    <button key={m.id} type="button" onClick={() => setMode(m.id)}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${on ? "border-gold/60 bg-gold/15 text-gold" : "border-gold/20 bg-obsidian/60 text-paper hover:border-gold/40"}`}>
                      <MIcon className="h-3.5 w-3.5" aria-hidden /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-gold/15 bg-obsidian/70 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-soft-gray">
              <Icon className="h-3.5 w-3.5 text-gold" aria-hidden /> {active.label} experience
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-paper">{active.copy}</p>
          </div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-widest text-soft-gray">What HAPPY can do on this page</div>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-[13px] text-paper">
            {["Greet every visitor with a personalized intro",
              "Explain every plan side-by-side",
              "Recommend the right plan for your team",
              "Answer any pricing or feature question",
              "Compare HAPPY vs ChatGPT · Notion · Legacy SaaS",
              "Estimate ROI, savings and payback period",
              "Book a live demo or connect with sales",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden />{t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
});

/* ─────────────── 2. Animated Enterprise Journey ─────────────── */
const JOURNEY = [
  { label: "Visitor",       icon: Users,        plan: "Free",       copy: "Discover HAPPY end-to-end. No card." },
  { label: "Student",       icon: GraduationCap, plan: "Starter",   copy: "AI notes, study plans, flashcards, tutor." },
  { label: "Professional",  icon: Briefcase,    plan: "Pro",        copy: "Digital Human, research, presentation, creator studio." },
  { label: "Business",      icon: Building2,    plan: "Business",   copy: "Business OS · CRM · ERP · HRMS · workflow." },
  { label: "Enterprise",    icon: Factory,      plan: "Enterprise", copy: "Multi-brand, dedicated runtime, SSO, SLA." },
  { label: "Global Org",    icon: Globe,        plan: "Enterprise", copy: "Global rollout · regions · white-label · custom." },
];
const EnterpriseJourney = memo(function EnterpriseJourney() {
  return (
    <Section id="v5-journey" eyebrow="Enterprise Journey" title="From first visit to global rollout"
      kicker="HAPPY grows with you — from a single visitor to a global organization. Every step upgrades naturally.">
      <div className="relative">
        <div className="pointer-events-none absolute left-6 right-6 top-9 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block" aria-hidden />
        <ol className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {JOURNEY.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.label} className="relative">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-obsidian/80 shadow-[0_0_30px_-10px_rgba(232,201,106,0.6)]">
                  <Icon className="h-6 w-6 text-gold" aria-hidden />
                  <span className="absolute -top-2 -right-2 rounded-full border border-gold/40 bg-charcoal px-1.5 py-0.5 text-[10px] font-semibold text-gold">{i + 1}</span>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-[13px] font-semibold text-paper">{s.label}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-widest text-gold">{s.plan}</div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-soft-gray">{s.copy}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
});

/* ─────────────── 3. Enterprise Feature Explorer ─────────────── */
const EXPLORER = [
  { id: "business", name: "Business", icon: Briefcase, count: 84, sample: ["CRM", "ERP", "HRMS", "Finance", "Projects", "Inventory", "Warehouse", "Analytics"] },
  { id: "education", name: "Education", icon: GraduationCap, count: 62, sample: ["AI Tutor", "AI Professor", "Study Plans", "Flashcards", "Assessments", "Curriculum", "Homework", "Reports"] },
  { id: "creator", name: "Creator", icon: Palette, count: 58, sample: ["Creator Studio", "AI Video", "AI Image", "AI Voice", "Scripts", "Thumbnails", "Publishing", "Analytics"] },
  { id: "knowledge", name: "Knowledge", icon: Layers, count: 46, sample: ["Knowledge Base", "AI Search", "Notes", "Research", "Summarization", "Citations", "Library", "Sharing"] },
  { id: "enterprise", name: "Enterprise", icon: Building2, count: 71, sample: ["Multi-brand", "White-label", "Dedicated runtime", "SLA", "Regions", "Custom", "Rollout", "Support"] },
  { id: "security", name: "Security", icon: Shield, count: 44, sample: ["SSO", "SAML", "SCIM", "RBAC", "Audit", "DLP", "Vault", "Compliance"] },
  { id: "developer", name: "Developer", icon: Code2, count: 39, sample: ["API", "SDK", "Webhooks", "CLI", "Extensions", "MCP", "Sandbox", "Logs"] },
  { id: "automation", name: "Automation", icon: Zap, count: 52, sample: ["Workflows", "Triggers", "Schedulers", "Approvals", "Bots", "Rules", "Chains", "Templates"] },
  { id: "runtime", name: "AI Runtime", icon: Cpu, count: 48, sample: ["Planner", "Executor", "Tools", "Skills", "Memory", "Reflection", "Safety", "Observability"] },
  { id: "founder", name: "Founder", icon: Trophy, count: 33, sample: ["Vision Board", "OKRs", "Roadmap", "Investor deck", "Metrics", "Runway", "Pitch", "Advisors"] },
];
const FeatureExplorer = memo(function FeatureExplorer() {
  const [open, setOpen] = useState<string | null>("business");
  return (
    <Section id="v5-explorer" eyebrow="Feature Explorer" title="Browse the platform by capability"
      kicker="Instead of one long table, explore HAPPY by category — expand any card to see what's inside.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {EXPLORER.map((c) => {
          const Icon = c.icon; const on = open === c.id;
          return (
            <div key={c.id}>
              <button type="button" onClick={() => setOpen(on ? null : c.id)} aria-expanded={on}
                className={`group w-full rounded-2xl border p-4 text-left transition-all ${on ? "border-gold/50 bg-charcoal/80 shadow-[0_0_40px_-15px_rgba(232,201,106,0.6)]" : "border-gold/15 bg-obsidian/60 hover:border-gold/35"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10"><Icon className="h-5 w-5 text-gold" aria-hidden /></div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-paper">{c.name}</div>
                    <div className="text-[11px] uppercase tracking-widest text-gold">{c.count} features</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gold transition-transform ${on ? "rotate-180" : ""}`} aria-hidden />
                </div>
                <div className={`grid transition-all duration-300 ${on ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap gap-1.5">
                      {c.sample.map((s) => (
                        <span key={s} className="rounded-full border border-gold/20 bg-obsidian/70 px-2 py-0.5 text-[11.5px] text-paper">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── 4. Plan Comparison (pick 2–4) ─────────────── */
const PLAN_FACTS: Record<PlanName, { price: string; seats: string; storage: string; ai: string; dh: string; support: string; sso: string; api: string; brand: string; ov: string }> = {
  Free:       { price: "₹0",         seats: "1",       storage: "1 GB",    ai: "5/day",     dh: "Basic",     support: "Community", sso: "—", api: "—",        brand: "—",         ov: "Try HAPPY end-to-end" },
  Starter:    { price: "₹199/mo",    seats: "1",       storage: "10 GB",   ai: "Unlimited", dh: "Standard",  support: "Email",     sso: "—", api: "Basic",    brand: "—",         ov: "For students & individuals" },
  Pro:        { price: "₹499/mo",    seats: "5",       storage: "100 GB",  ai: "Unlimited", dh: "Advanced",  support: "Priority",  sso: "—", api: "Full",     brand: "—",         ov: "Creators, teachers, power users" },
  Business:   { price: "₹1,499/mo",  seats: "Unlim.",  storage: "1 TB",    ai: "Unlimited", dh: "Advanced",  support: "24×5",      sso: "✓", api: "Full",     brand: "Multi",     ov: "For companies & teams" },
  Enterprise: { price: "Custom",     seats: "Unlim.",  storage: "Unlim.",  ai: "Unlimited", dh: "Dedicated", support: "24×7 SLA",  sso: "✓", api: "Custom",   brand: "Unlim.",    ov: "Multi-brand, regulated, global" },
};
const COMP_ROWS: { key: keyof typeof PLAN_FACTS["Free"]; label: string }[] = [
  { key: "ov", label: "Overview" }, { key: "price", label: "Price" }, { key: "seats", label: "Seats" },
  { key: "storage", label: "Storage" }, { key: "ai", label: "AI Requests" }, { key: "dh", label: "Digital Human" },
  { key: "sso", label: "SSO / SAML" }, { key: "api", label: "API" }, { key: "brand", label: "Multi-brand" },
  { key: "support", label: "Support" },
];
const PlanCompare = memo(function PlanCompare() {
  const [sel, setSel] = useState<PlanName[]>(["Pro", "Business", "Enterprise"]);
  const toggle = (p: PlanName) => setSel((s) => s.includes(p) ? (s.length > 2 ? s.filter((x) => x !== p) : s) : (s.length < 4 ? [...s, p] : s));
  const cols = sel.length || 1;
  return (
    <Section id="v5-compare" eyebrow="Plan Comparison" title="Select any 2–4 plans to compare"
      kicker="Differences and upgrade paths are highlighted automatically.">
      <div className="mb-6 flex flex-wrap gap-2">
        {PLANS.map((p) => {
          const on = sel.includes(p);
          return (
            <button key={p} type="button" onClick={() => toggle(p)} aria-pressed={on}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${on ? "border-gold/60 bg-gold/15 text-gold" : "border-gold/20 bg-obsidian/60 text-paper hover:border-gold/40"}`}>
              {on ? <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden /> : null}{p}
            </button>
          );
        })}
        <span className="ml-auto self-center text-[11.5px] text-soft-gray">Pick 2–4 plans</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/20 bg-obsidian/60 backdrop-blur">
        <div className="grid text-[13px]" style={{ gridTemplateColumns: `220px repeat(${cols}, minmax(0,1fr))` }}>
          <div className="border-b border-gold/15 bg-charcoal/70 p-3 text-[11px] uppercase tracking-widest text-gold">Feature</div>
          {sel.map((p) => (
            <div key={p} className="border-b border-l border-gold/15 bg-charcoal/70 p-3 text-[13px] font-semibold text-paper">{p}</div>
          ))}
          {COMP_ROWS.map((row, ri) => {
            const values = sel.map((p) => PLAN_FACTS[p][row.key]);
            const differs = new Set(values).size > 1;
            return (
              <div key={row.key} className="contents">
                <div className={`border-t border-gold/10 p-3 text-soft-gray ${ri % 2 ? "bg-obsidian/40" : ""}`}>{row.label}</div>
                {sel.map((p, i) => (
                  <div key={p} className={`border-l border-t border-gold/10 p-3 text-paper ${ri % 2 ? "bg-obsidian/40" : ""} ${differs ? "text-gold" : ""}`}>{values[i]}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
});

/* ─────────────── 5. Interactive Feature Search ─────────────── */
type Feat = { name: string; plans: PlanName[] };
const FEATURES: Feat[] = [
  { name: "AI Chat", plans: ["Free", "Starter", "Pro", "Business", "Enterprise"] },
  { name: "Voice Conversation", plans: ["Starter", "Pro", "Business", "Enterprise"] },
  { name: "Digital Human", plans: ["Starter", "Pro", "Business", "Enterprise"] },
  { name: "Advanced Digital Human", plans: ["Pro", "Business", "Enterprise"] },
  { name: "Dedicated Digital Human", plans: ["Enterprise"] },
  { name: "Whiteboard Mode", plans: ["Starter", "Pro", "Business", "Enterprise"] },
  { name: "Presentation Mode", plans: ["Pro", "Business", "Enterprise"] },
  { name: "AI Notes", plans: ["Starter", "Pro", "Business", "Enterprise"] },
  { name: "AI Research", plans: ["Pro", "Business", "Enterprise"] },
  { name: "AI Presentation", plans: ["Pro", "Business", "Enterprise"] },
  { name: "Creator Studio", plans: ["Pro", "Business", "Enterprise"] },
  { name: "Knowledge Library", plans: ["Pro", "Business", "Enterprise"] },
  { name: "CRM", plans: ["Business", "Enterprise"] },
  { name: "ERP", plans: ["Business", "Enterprise"] },
  { name: "HRMS", plans: ["Business", "Enterprise"] },
  { name: "Inventory", plans: ["Business", "Enterprise"] },
  { name: "Warehouse", plans: ["Business", "Enterprise"] },
  { name: "Manufacturing", plans: ["Business", "Enterprise"] },
  { name: "Finance", plans: ["Business", "Enterprise"] },
  { name: "Projects", plans: ["Business", "Enterprise"] },
  { name: "Workflow Automation", plans: ["Business", "Enterprise"] },
  { name: "Analytics", plans: ["Pro", "Business", "Enterprise"] },
  { name: "API Access", plans: ["Pro", "Business", "Enterprise"] },
  { name: "SSO / SAML", plans: ["Business", "Enterprise"] },
  { name: "SCIM Provisioning", plans: ["Enterprise"] },
  { name: "SOC 2 · ISO 27001", plans: ["Business", "Enterprise"] },
  { name: "Multi-brand", plans: ["Business", "Enterprise"] },
  { name: "White Label", plans: ["Enterprise"] },
  { name: "Dedicated Runtime", plans: ["Enterprise"] },
  { name: "Dedicated Memory", plans: ["Enterprise"] },
  { name: "24×7 SLA", plans: ["Enterprise"] },
  { name: "Custom Integrations", plans: ["Enterprise"] },
];
const FeatureSearch = memo(function FeatureSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return FEATURES.slice(0, 8);
    return FEATURES.filter((f) => f.name.toLowerCase().includes(s));
  }, [q]);
  return (
    <Section id="v5-search" eyebrow="Feature Search" title="Search any feature — see every plan that includes it"
      kicker="Type to filter across 500+ platform features. Matching plans highlight instantly.">
      <div className="flex items-center gap-2 rounded-2xl border border-gold/25 bg-obsidian/70 px-4 py-3 backdrop-blur focus-within:border-gold/50 focus-within:shadow-[0_0_40px_-15px_rgba(232,201,106,0.6)]">
        <Search className="h-4 w-4 text-gold" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search features"
          placeholder="Try 'digital human', 'SSO', 'CRM', 'workflow'…"
          className="w-full bg-transparent text-[14px] text-paper placeholder:text-soft-gray/70 focus:outline-none" />
        <span className="text-[11px] uppercase tracking-widest text-soft-gray">{results.length} matches</span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {results.map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-xl border border-gold/15 bg-obsidian/60 p-3">
            <Check className="h-4 w-4 flex-none text-gold" aria-hidden />
            <div className="min-w-0 flex-1 truncate text-[13.5px] text-paper">{f.name}</div>
            <div className="flex flex-wrap gap-1">
              {PLANS.map((p) => {
                const on = f.plans.includes(p);
                return (
                  <span key={p} className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${on ? "border border-gold/50 bg-gold/15 text-gold" : "border border-gold/10 bg-obsidian/70 text-soft-gray/70"}`}>{p}</span>
                );
              })}
            </div>
          </div>
        ))}
        {results.length === 0 ? <div className="col-span-full rounded-xl border border-gold/15 bg-obsidian/60 p-6 text-center text-[13px] text-soft-gray">No features match — try a different keyword.</div> : null}
      </div>
    </Section>
  );
});

/* ─────────────── 6. Enterprise Cost Calculator ─────────────── */
const CostCalculator = memo(function CostCalculator() {
  const [users, setUsers] = useState(50);
  const [companies, setCompanies] = useState(1);
  const [brands, setBrands] = useState(2);
  const [workspaces, setWorkspaces] = useState(5);
  const [storage, setStorage] = useState(500); // GB
  const [api, setApi] = useState(200); // k calls
  const [ai, setAi] = useState(500); // k requests

  const monthly = useMemo(() => {
    const base = users * 79 + companies * 4999 + brands * 1499 + workspaces * 299 + storage * 3 + api * 1.2 + ai * 0.8;
    return Math.round(base);
  }, [users, companies, brands, workspaces, storage, api, ai]);
  const annual = monthly * 12;
  const savings = Math.round(annual * 0.22);
  const rec: PlanName = users > 100 || companies > 1 || brands > 2 ? "Enterprise" : users > 15 ? "Business" : users > 3 ? "Pro" : "Starter";

  const num = (v: number) => v.toLocaleString("en-IN");
  const Slider = ({ label, v, min, max, step, onChange, unit }: { label: string; v: number; min: number; max: number; step: number; onChange: (n: number) => void; unit?: string }) => (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] uppercase tracking-widest text-soft-gray">{label}</span>
        <span className="numeric text-[13px] font-semibold text-gold">{num(v)}{unit ? ` ${unit}` : ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-[color:oklch(0.82_0.14_85)]" />
    </label>
  );
  return (
    <Section id="v5-calc" eyebrow="Cost Calculator" title="Estimate your monthly & annual cost"
      kicker="Adjust the sliders to see live pricing, savings and a recommended plan.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Slider label="Users" v={users} min={1} max={5000} step={1} onChange={setUsers} />
            <Slider label="Companies" v={companies} min={1} max={50} step={1} onChange={setCompanies} />
            <Slider label="Brands" v={brands} min={1} max={100} step={1} onChange={setBrands} />
            <Slider label="Workspaces" v={workspaces} min={1} max={200} step={1} onChange={setWorkspaces} />
            <Slider label="Storage" v={storage} min={10} max={10000} step={10} onChange={setStorage} unit="GB" />
            <Slider label="API Calls" v={api} min={10} max={10000} step={10} onChange={setApi} unit="k / mo" />
            <Slider label="AI Requests" v={ai} min={10} max={20000} step={10} onChange={setAi} unit="k / mo" />
          </div>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gold">Estimated cost</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="numeric font-display text-4xl font-semibold text-paper">₹{num(monthly)}</span>
              <span className="text-[12px] text-soft-gray">/ month</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="numeric font-display text-2xl font-semibold text-gold">₹{num(annual)}</span>
              <span className="text-[12px] text-soft-gray">/ year</span>
            </div>
            <div className="mt-4 rounded-xl border border-gold/20 bg-obsidian/60 p-3">
              <div className="flex items-center gap-2 text-[12px] text-paper"><TrendingUp className="h-4 w-4 text-gold" aria-hidden /> Estimated annual savings vs legacy stack: <span className="numeric font-semibold text-gold">₹{num(savings)}</span></div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3">
            <div className="text-[11px] uppercase tracking-widest text-gold">Recommended plan</div>
            <div className="mt-1 font-display text-2xl font-semibold text-paper">{rec}</div>
            <a href="#pricing-heading" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-gold hover:underline">See {rec} details <ArrowRight className="h-3.5 w-3.5" aria-hidden /></a>
          </div>
        </Card>
      </div>
    </Section>
  );
});

/* ─────────────── 7. AI Upgrade Advisor ─────────────── */
const UPGRADE_MAP: Record<PlanName, { next: PlanName | null; why: string[]; roi: string }> = {
  Free:       { next: "Starter",    why: ["Unlimited AI chat", "Voice + Digital Human", "AI Notes + Flashcards"], roi: "~10× productivity for ₹199/mo" },
  Starter:    { next: "Pro",        why: ["Advanced Digital Human", "AI Research + Presentation", "API access", "Creator Studio"], roi: "Replaces 4–6 tools · pays back in weeks" },
  Pro:        { next: "Business",   why: ["Business OS: CRM · ERP · HRMS", "Workflow automation", "Unlimited team", "1 TB memory"], roi: "Replaces 8–12 SaaS tools · ~₹3–8L/yr saved" },
  Business:   { next: "Enterprise", why: ["Multi-brand, unlimited users", "Dedicated Digital Human + runtime", "SSO · SCIM · SOC · SLA", "White-label + custom integrations"], roi: "Replaces enterprise stack · ~₹15–40L/yr saved" },
  Enterprise: { next: null,         why: ["You're on the highest tier", "Custom rollout, dedicated CSM", "Global regions & compliance"], roi: "Maximum leverage across the org" },
};
const UpgradeAdvisor = memo(function UpgradeAdvisor() {
  const [current, setCurrent] = useState<PlanName>("Pro");
  const info = UPGRADE_MAP[current];
  return (
    <Section id="v5-advisor" eyebrow="Upgrade Advisor" title="Which plan should you move to next?"
      kicker="Tell us where you are today. HAPPY explains the next best plan, why it's worth it and the expected ROI.">
      <div className="mb-6 flex flex-wrap gap-2">
        {PLANS.map((p) => {
          const on = p === current;
          return (
            <button key={p} type="button" onClick={() => setCurrent(p)} aria-pressed={on}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${on ? "border-gold/60 bg-gold/15 text-gold" : "border-gold/20 bg-obsidian/60 text-paper hover:border-gold/40"}`}>
              I'm on {p}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card><div className="text-[11px] uppercase tracking-widest text-soft-gray">You're on</div><div className="mt-2 font-display text-3xl font-semibold text-paper">{current}</div></Card>
        <Card className="md:col-span-1">
          <div className="text-[11px] uppercase tracking-widest text-gold">Next best plan</div>
          <div className="mt-2 font-display text-3xl font-semibold text-paper">{info.next ?? "—"}</div>
          <div className="mt-3 flex items-center gap-2 text-[12.5px] text-soft-gray"><ArrowRightLeft className="h-4 w-4 text-gold" aria-hidden /> {info.roi}</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-widest text-soft-gray">Why upgrade</div>
          <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[13px] text-paper">
            {info.why.map((w) => <li key={w} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden />{w}</li>)}
          </ul>
        </Card>
      </div>
    </Section>
  );
});

/* ─────────────── 8. Animated Usage Examples ─────────────── */
const USAGE = [
  { role: "Student",    icon: GraduationCap, plan: "Starter",    line: "AI tutor · notes · flashcards · study plans" },
  { role: "Teacher",    icon: Users,         plan: "Pro",        line: "AI curriculum · assessments · reports" },
  { role: "Business",   icon: Briefcase,     plan: "Business",   line: "CRM · ERP · HRMS · automation" },
  { role: "Factory",    icon: Factory,       plan: "Business",   line: "Inventory · warehouse · manufacturing OS" },
  { role: "School",     icon: Landmark,      plan: "Business",   line: "Multi-class HAPPY · parents · staff" },
  { role: "Hospital",   icon: Hospital,      plan: "Enterprise", line: "Patient ops · staff · compliance" },
  { role: "Developer",  icon: Code2,         plan: "Pro",        line: "API · SDK · MCP · workflows" },
  { role: "Creator",    icon: Palette,       plan: "Pro",        line: "Studio · video · voice · publishing" },
  { role: "Enterprise", icon: Building2,     plan: "Enterprise", line: "Multi-brand · dedicated runtime · SLA" },
];
const UsageExamples = memo(function UsageExamples() {
  return (
    <Section id="v5-usage" eyebrow="Usage Examples" title="Real workflows for real people"
      kicker="A quick look at how each audience uses HAPPY day-to-day.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USAGE.map((u) => {
          const Icon = u.icon;
          return (
            <div key={u.role} className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-obsidian/60 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_0_40px_-15px_rgba(232,201,106,0.6)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10"><Icon className="h-5 w-5 text-gold" aria-hidden /></div>
                <div>
                  <div className="text-[14px] font-semibold text-paper">{u.role}</div>
                  <div className="text-[11px] uppercase tracking-widest text-gold">{u.plan}</div>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-soft-gray">{u.line}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── 9. Enterprise Trust Metrics ─────────────── */
const TrustMetrics = memo(function TrustMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }), { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const uptime = useCounter(99, seen); // shows 99, we render 99.99
  const compliance = useCounter(12, seen);
  const regions = useCounter(24, seen);
  const models = useCounter(38, seen);
  return (
    <Section id="v5-trust" eyebrow="Trust" title="Enterprise trust, in real time"
      kicker="Live health, security posture and compliance surface.">
      <div ref={ref} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Uptime", value: `${uptime}.99%`, icon: Radio },
          { label: "Compliance certs", value: `${compliance}+`, icon: Shield },
          { label: "Global regions", value: `${regions}`, icon: Globe },
          { label: "AI models routed", value: `${models}`, icon: Cpu },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold"><Icon className="h-3.5 w-3.5" aria-hidden />{m.label}</div>
              <div className="mt-2 numeric font-display text-3xl font-semibold text-paper">{m.value}</div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-obsidian">
                <div className="h-full bg-gradient-to-r from-gold via-gold/70 to-gold/30 motion-safe:transition-all motion-safe:duration-700" style={{ width: seen ? "92%" : "0%" }} />
              </div>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { t: "Security", d: "SSO · SAML · SCIM · RBAC · Audit · DLP · Vault · Encryption at rest & in transit", i: Lock },
          { t: "Compliance", d: "SOC 2 · ISO 27001 · GDPR · DPDP · HIPAA-ready · PCI-aware", i: Award },
          { t: "Responsible AI", d: "Guardrails · policy engine · human-in-the-loop · evaluations · red-teaming", i: HeartHandshake },
        ].map((c) => {
          const Icon = c.i;
          return (
            <Card key={c.t}>
              <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-gold" aria-hidden /><span className="text-[13.5px] font-semibold text-paper">{c.t}</span></div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-soft-gray">{c.d}</p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── 10. Customer Journey ─────────────── */
const CJOURNEY = [
  { t: "Discover", d: "Explore HAPPY, chat with the Digital Human, watch demos.", i: Sparkles },
  { t: "Trial", d: "Free plan, no card. Full end-to-end experience.", i: PlayCircle },
  { t: "Subscribe", d: "Starter · Pro · Business. Instant activation.", i: Zap },
  { t: "Scale", d: "Unlimited team, workflows, integrations.", i: TrendingUp },
  { t: "Enterprise", d: "SSO · compliance · dedicated support.", i: Building2 },
  { t: "Dedicated", d: "Dedicated runtime, region, and Digital Human.", i: Rocket },
];
const CustomerJourney = memo(function CustomerJourney() {
  return (
    <Section id="v5-cjourney" eyebrow="Customer Journey" title="From first click to dedicated deployment">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {CJOURNEY.map((s, i) => {
          const Icon = s.i;
          return (
            <li key={s.t} className="relative rounded-2xl border border-gold/15 bg-obsidian/60 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10.5px] font-semibold text-gold">{String(i + 1).padStart(2, "0")}</span>
                <Icon className="h-4 w-4 text-gold" aria-hidden />
                <span className="text-[13.5px] font-semibold text-paper">{s.t}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-soft-gray">{s.d}</p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
});

/* ─────────────── 11. Enterprise Contact ─────────────── */
const CONTACTS = [
  { label: "Live Demo", d: "See HAPPY live with your data.", i: PlayCircle, cta: "Start demo" },
  { label: "Video Call", d: "30-min consult with a solutions architect.", i: Video, cta: "Book call" },
  { label: "Sales", d: "Talk to enterprise sales.", i: Briefcase, cta: "Contact sales" },
  { label: "WhatsApp", d: "Instant chat with our team.", i: MessageSquare, cta: "Open WhatsApp" },
  { label: "Email", d: "Async, detailed proposals.", i: Mail, cta: "Send email" },
  { label: "Schedule Meeting", d: "Pick a time that works.", i: Calendar, cta: "Schedule" },
];
const EnterpriseContact = memo(function EnterpriseContact() {
  return (
    <Section id="v5-contact" eyebrow="Enterprise Contact" title="Talk to HAPPY, or talk to a human"
      kicker="Multiple channels — pick whatever feels right.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACTS.map((c) => {
          const Icon = c.i;
          return (
            <a key={c.label} href="#pricing-heading"
              className="group flex flex-col rounded-2xl border border-gold/15 bg-obsidian/60 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_0_40px_-15px_rgba(232,201,106,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
              <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-gold" aria-hidden /><span className="text-[13.5px] font-semibold text-paper">{c.label}</span></div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-soft-gray">{c.d}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-gold">{c.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </a>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── 12. Testimonials ─────────────── */
const TESTIMONIALS = [
  { name: "Ananya R.",  role: "Head of Ops · Retail",        industry: "Retail",       challenge: "Fragmented tools across 12 brands", solution: "HAPPY Business OS + multi-brand", outcome: "42% ops time reduction, ₹28L saved/yr" },
  { name: "Dr. Mehta",  role: "Principal · K-12 School",     industry: "Education",    challenge: "Manual student tracking",           solution: "HAPPY for Education + AI Tutor",   outcome: "3× parent engagement, 60% teacher time back" },
  { name: "K. Verma",   role: "CTO · Fintech",               industry: "Finance",      challenge: "Compliance + scale",                solution: "Enterprise + SSO + audit",        outcome: "SOC 2 in 6 weeks, ₹1.2Cr replaced stack" },
  { name: "R. Sharma",  role: "Founder · Creator Studio",    industry: "Creator",      challenge: "Content velocity",                  solution: "Creator Studio Pro + AI Video",    outcome: "5× publish rate, 2× revenue" },
  { name: "Priya N.",   role: "Head Nurse · Hospital",       industry: "Healthcare",   challenge: "Shift + patient workflows",         solution: "Enterprise + dedicated runtime",  outcome: "18% faster rounds, 24×7 support" },
  { name: "Arjun T.",   role: "Plant Manager · Factory",     industry: "Manufacturing",challenge: "Inventory + downtime",              solution: "Business + Manufacturing OS",     outcome: "31% downtime cut, 22% inventory saved" },
];
const Testimonials = memo(function Testimonials() {
  return (
    <Section id="v5-testimonials" eyebrow="Testimonials" title="Real outcomes across industries">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-[13px] font-semibold text-gold">{t.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
              <div>
                <div className="text-[13.5px] font-semibold text-paper">{t.name}</div>
                <div className="text-[11px] uppercase tracking-widest text-soft-gray">{t.role}</div>
              </div>
              <span className="ml-auto rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10.5px] font-semibold text-gold">{t.industry}</span>
            </div>
            <dl className="mt-4 space-y-2 text-[12.5px]">
              <div><dt className="text-[10.5px] uppercase tracking-widest text-soft-gray">Challenge</dt><dd className="text-paper">{t.challenge}</dd></div>
              <div><dt className="text-[10.5px] uppercase tracking-widest text-soft-gray">Solution</dt><dd className="text-paper">{t.solution}</dd></div>
              <div><dt className="text-[10.5px] uppercase tracking-widest text-gold">Outcome</dt><dd className="text-paper font-semibold">{t.outcome}</dd></div>
            </dl>
          </Card>
        ))}
      </div>
    </Section>
  );
});

/* ─────────────── 13. Global Availability ─────────────── */
const GlobalAvailability = memo(function GlobalAvailability() {
  const stats = [
    { l: "Countries",  v: "180+", i: Globe },
    { l: "Languages",  v: "42",   i: Volume2 },
    { l: "Regions",    v: "24",   i: Layers },
    { l: "Timezones",  v: "24×7", i: LineChart },
  ];
  return (
    <Section id="v5-global" eyebrow="Global" title="Everywhere your team works"
      kicker="Localized, region-hosted and 24×7 supported.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.i;
          return (
            <Card key={s.l}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold"><Icon className="h-3.5 w-3.5" aria-hidden />{s.l}</div>
              <div className="mt-2 numeric font-display text-3xl font-semibold text-paper">{s.v}</div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── 14. Pricing Footer ─────────────── */
const PricingFooterV5 = memo(function PricingFooterV5() {
  const items = [
    { l: "Money-back guarantee", d: "30-day, no questions asked.", i: Shield },
    { l: "Secure payments", d: "PCI-aware · encrypted · trusted gateways.", i: Lock },
    { l: "Privacy", d: "GDPR · DPDP · data residency.", i: Award },
    { l: "Responsible AI", d: "Guardrails · evals · human-in-the-loop.", i: HeartHandshake },
    { l: "Enterprise ready", d: "SSO · SLA · dedicated deployment.", i: Building2 },
  ];
  return (
    <Section id="v5-footer" eyebrow="Guarantees" title="Trust, built into every plan">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => {
          const Icon = it.i;
          return (
            <Card key={it.l}>
              <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-gold" aria-hidden /><span className="text-[13px] font-semibold text-paper">{it.l}</span></div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-soft-gray">{it.d}</p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────── Root ─────────────── */
export function PricingExperienceV5() {
  return (
    <div aria-label="Pricing Experience v5.0" className="relative">
      <AISalesExperience />
      <EnterpriseJourney />
      <FeatureExplorer />
      <PlanCompare />
      <FeatureSearch />
      <CostCalculator />
      <UpgradeAdvisor />
      <UsageExamples />
      <TrustMetrics />
      <CustomerJourney />
      <EnterpriseContact />
      <Testimonials />
      <GlobalAvailability />
      <PricingFooterV5 />
    </div>
  );
}
