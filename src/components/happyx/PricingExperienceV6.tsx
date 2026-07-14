/**
 * HAPPY Pricing Experience v6.0 — Revenue Engine
 *
 * Additive frontend-only layer. Renders below v5.0. Does not touch backend,
 * services, APIs, database, auth, or business logic.
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  ChevronDown,
  Cpu,
  Download,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  LineChart,
  MessageCircle,
  Mic,
  Phone,
  Presentation,
  Rocket,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Users,
  Volume2,
  Wand2,
  Wrench,
} from "lucide-react";

/* ─────────────  Design helpers  ───────────── */

const Section = memo(function Section({
  eyebrow,
  title,
  copy,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="relative mx-auto max-w-7xl px-6 py-20 md:py-28"
      style={{ contain: "content" }}
    >
      <header className="mb-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-charcoal/40 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-gold/85 backdrop-blur">
          {eyebrow}
        </div>
        <h2 className="mt-4 font-display text-3xl leading-tight text-paper md:text-5xl">
          {title}
        </h2>
        {copy ? (
          <p className="mt-4 text-[15px] leading-relaxed text-soft-gray">{copy}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
});

const GlassCard = memo(function GlassCard({
  children,
  className = "",
  style,
  onMouseMove,
  onMouseLeave,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  as?: keyof JSX.IntrinsicElements;
} & Record<string, unknown>) {
  const Comp = Tag as "div";
  return (
    <Comp
      {...rest}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={
        "group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-gold/40 hover:bg-charcoal/60 " +
        className
      }
      style={style}
    >
      {children}
    </Comp>
  );
});

function useSpotlight() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);
  const onLeave = useCallback(() => setPos(null), []);
  const overlay = pos ? (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-100 transition-opacity"
      style={{
        background: `radial-gradient(240px circle at ${pos.x}px ${pos.y}px, rgba(232,201,106,0.14), transparent 60%)`,
      }}
    />
  ) : null;
  return { onMove, onLeave, overlay };
}

function useCounter(target: number, active: boolean, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

function useOnScreen<T extends Element>(rootMargin = "-10% 0px") {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return { ref, seen };
}

/* ─────────────  1. Live AI Sales Advisor  ───────────── */

const ADVISOR_MODES = [
  { id: "text", label: "Text", icon: MessageCircle },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "whiteboard", label: "Whiteboard", icon: Presentation },
  { id: "demo", label: "Demo", icon: Volume2 },
] as const;

type AdvisorMsg = { from: "happy" | "you"; text: string };

const SalesAdvisor = memo(function SalesAdvisor() {
  const [mode, setMode] = useState<(typeof ADVISOR_MODES)[number]["id"]>("text");
  const [msgs, setMsgs] = useState<AdvisorMsg[]>([
    {
      from: "happy",
      text: "Hi — I'm HAPPY. I can walk you through every plan, feature and price. What are you looking to solve today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      const answer = pickAnswer(q);
      setMsgs((m) => [...m, { from: "happy", text: answer }]);
      setTyping(false);
    }, 700);
  };

  return (
    <Section
      id="v6-advisor"
      eyebrow="Live AI Sales Advisor"
      title="Meet HAPPY. Ask anything about pricing."
      copy="Voice, text, whiteboard and live presentation demos — HAPPY greets every visitor, explains plans, and helps you pick the right fit."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <GlassCard className="min-h-[420px] p-6">
          <div className="flex items-center gap-3 border-b border-gold/10 pb-4">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 ring-1 ring-gold/40">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="absolute -bottom-0 -right-0 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-obsidian" />
              </span>
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-paper">HAPPY</div>
              <div className="text-[11px] text-soft-gray">
                Digital Human · Sales Advisor
              </div>
            </div>
            <div className="flex gap-1">
              {ADVISOR_MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={active}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
                      (active
                        ? "border-gold/60 bg-gold/15 text-gold"
                        : "border-white/10 bg-white/5 text-soft-gray hover:text-paper")
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  "flex " + (m.from === "you" ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed " +
                    (m.from === "you"
                      ? "bg-gold text-obsidian"
                      : "border border-gold/15 bg-obsidian/60 text-paper")
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing ? (
              <div className="text-[11px] text-soft-gray">HAPPY is typing…</div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="mt-4 flex items-center gap-2 rounded-full border border-gold/20 bg-obsidian/60 p-1.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "voice"
                  ? "Voice preview — type or speak your question"
                  : "Ask HAPPY about a plan, feature or price…"
              }
              aria-label="Ask HAPPY"
              className="flex-1 bg-transparent px-3 py-2 text-[13px] text-paper outline-none placeholder:text-soft-gray/70"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold text-obsidian transition-transform hover:scale-105"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-gold/80">
            Suggested questions
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setMsgs((m) => [...m, { from: "you", text: q }]);
                  setTyping(true);
                  window.setTimeout(() => {
                    setMsgs((m) => [
                      ...m,
                      { from: "happy", text: pickAnswer(q) },
                    ]);
                    setTyping(false);
                  }, 600);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left text-[12.5px] text-paper transition-colors hover:border-gold/40 hover:bg-gold/5"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-gold/15 bg-obsidian/60 p-4">
            <div className="text-[11px] uppercase tracking-widest text-gold">
              Reactions
            </div>
            <div className="mt-2 text-[12px] text-soft-gray">
              HAPPY smiles when you find the right fit, nods when you're close,
              and offers a demo whenever a plan matches your needs.
            </div>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
});

const SUGGESTED = [
  "Which plan is best for a 50-person team?",
  "What is included in Enterprise?",
  "Do you support GST invoicing?",
  "Can I migrate from ChatGPT and Notion?",
  "How much can we save vs our current stack?",
];

function pickAnswer(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("enterprise"))
    return "Enterprise unlocks the Global Control Center, RBAC, SSO/SAML, audit logs, custom SLAs, private deployment options and priority migration support.";
  if (s.includes("gst") || s.includes("invoice"))
    return "Yes. GST-compliant invoicing, tax profiles, multi-currency billing and proration are native to the Business OS.";
  if (s.includes("migrate") || s.includes("import"))
    return "You can import from ChatGPT, Claude, Gemini, Notion, ERP/CRM, CSV and Excel. Our Migration Center automates mapping and validation.";
  if (s.includes("save") || s.includes("roi") || s.includes("cost"))
    return "Most teams save 40–70% by consolidating chat, docs, automation, CRM and analytics into HAPPY. Try the ROI calculator below for a live number.";
  if (s.includes("team") || s.includes("50") || s.includes("100"))
    return "For that team size I'd start on Growth or Business, then upgrade to Enterprise when you need SSO, audit logs and a dedicated success manager.";
  return "Great question. Tell me a bit about your team size, industry and current tools — I'll recommend the shortest path to value.";
}

/* ─────────────  2. Personalized Plan Discovery  ───────────── */

const PERSONAS = [
  { id: "individual", label: "Individual", plan: "Starter", save: 12 },
  { id: "student", label: "Student", plan: "Starter", save: 8 },
  { id: "creator", label: "Creator", plan: "Creator Pro", save: 240 },
  { id: "developer", label: "Developer", plan: "Developer", save: 320 },
  { id: "startup", label: "Startup", plan: "Growth", save: 1800 },
  { id: "smb", label: "Small Business", plan: "Business", save: 4200 },
  { id: "enterprise", label: "Enterprise", plan: "Enterprise", save: 42000 },
  { id: "government", label: "Government", plan: "Sovereign", save: 62000 },
  { id: "school", label: "School", plan: "Education", save: 18000 },
  { id: "hospital", label: "Hospital", plan: "Enterprise", save: 55000 },
  { id: "factory", label: "Factory", plan: "Business", save: 28000 },
] as const;

const PlanDiscovery = memo(function PlanDiscovery() {
  const [pid, setPid] = useState<(typeof PERSONAS)[number]["id"]>("startup");
  const persona = useMemo(
    () => PERSONAS.find((p) => p.id === pid) ?? PERSONAS[0],
    [pid],
  );
  const { ref, seen } = useOnScreen<HTMLDivElement>();
  const save = useCounter(persona.save, seen);

  return (
    <Section
      id="v6-discovery"
      eyebrow="Personalized Plan Discovery"
      title="Tell HAPPY who you are. Get a plan in seconds."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]" ref={ref}>
        <GlassCard className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-gold/80">
            I am a
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONAS.map((p) => {
              const active = p.id === pid;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPid(p.id)}
                  className={
                    "rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-all " +
                    (active
                      ? "border-gold/60 bg-gold/15 text-gold"
                      : "border-white/10 bg-white/5 text-paper hover:border-gold/30 hover:bg-white/10")
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-gold/80">
            Recommended plan
          </div>
          <div className="mt-2 font-display text-3xl text-paper">
            {persona.plan}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-soft-gray">
            Best fit for {persona.label.toLowerCase()}s who want to consolidate
            tooling, keep control of data, and grow without switching platforms.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Est. monthly savings" value={`$${save.toLocaleString()}`} />
            <Stat label="Upgrade path" value={upgradePath(persona.plan)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[12.5px] font-semibold text-obsidian hover:scale-[1.02]"
            >
              See plan
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="#v6-contact"
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-[12.5px] font-medium text-paper hover:border-gold/60"
            >
              Book demo
            </a>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
});

function upgradePath(plan: string): string {
  const order = [
    "Starter",
    "Creator Pro",
    "Developer",
    "Growth",
    "Business",
    "Education",
    "Enterprise",
    "Sovereign",
  ];
  const i = order.indexOf(plan);
  return i >= 0 && i < order.length - 1 ? `→ ${order[i + 1]}` : "Custom";
}

const Stat = memo(function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gold/15 bg-obsidian/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-soft-gray">
        {label}
      </div>
      <div className="mt-1 font-display text-lg text-paper">{value}</div>
    </div>
  );
});

/* ─────────────  3. Enterprise Feature Explorer  ───────────── */

const FEATURES = [
  {
    id: "digital-human",
    label: "Digital Human",
    icon: Sparkles,
    items: [
      "Voice, text and whiteboard modes",
      "Executive presence portrait",
      "Cursor & attention tracking",
      "Multilingual delivery",
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: Brain,
    items: [
      "Chat, embeddings, TTS, STT",
      "Structured output & tools",
      "Long-context memory",
      "Safety & guardrails",
    ],
  },
  {
    id: "business-os",
    label: "Business OS",
    icon: Building2,
    items: [
      "CRM, ERP, HRMS spine",
      "Inventory & manufacturing",
      "Finance & GST invoicing",
      "Multi-company & multi-brand",
    ],
  },
  {
    id: "education",
    label: "Education OS",
    icon: GraduationCap,
    items: [
      "Mastery-based curriculum",
      "Adaptive quizzes & mock tests",
      "Notes & knowledge review",
      "Teach Until Mastered™",
    ],
  },
  {
    id: "creator",
    label: "Creator OS",
    icon: Wand2,
    items: [
      "Image, video, voice, presentation",
      "Signed & versioned assets",
      "4K master exports",
      "No watermarks",
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge OS",
    icon: Layers,
    items: [
      "Knowledge graph",
      "Approved sources",
      "Semantic recall",
      "Citations & audits",
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    items: [
      "Groups, spaces, DMs",
      "Moderation tools",
      "Reputation & badges",
      "Enterprise privacy",
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    items: [
      "Buyer & seller centers",
      "Multi-currency checkout",
      "Auditable orders",
      "Payouts & disputes",
    ],
  },
  {
    id: "hyperlocal",
    label: "Hyperlocal",
    icon: Store,
    items: [
      "Local storefronts",
      "Delivery routing",
      "Regional catalogs",
      "In-language service",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    icon: Landmark,
    items: [
      "Global Control Center",
      "RBAC & SSO",
      "SOC-class audit logs",
      "Custom SLAs",
    ],
  },
  {
    id: "runtime",
    label: "Runtime",
    icon: Cpu,
    items: [
      "Workflow engine",
      "Automation runtime",
      "Executive engine",
      "Tool engine",
    ],
  },
  {
    id: "developer",
    label: "Developer Platform",
    icon: Wrench,
    items: [
      "Typed server functions",
      "Edge & serverless friendly",
      "SDK & samples",
      "Sandboxes",
    ],
  },
  {
    id: "plugins",
    label: "Plugins",
    icon: Rocket,
    items: [
      "Plugin market",
      "Sandboxed execution",
      "Signed manifests",
      "Version pinning",
    ],
  },
  {
    id: "skills",
    label: "Skills",
    icon: Sparkles,
    items: [
      "Composable skills",
      "Team-shared library",
      "Runtime hot-swap",
      "Curated defaults",
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    items: [
      "Encryption at rest & in transit",
      "RLS on every table",
      "MFA & SSO",
      "Responsible AI policy",
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: LineChart,
    items: [
      "Real-time metrics",
      "Alerts & on-call",
      "Uptime & SLOs",
      "Cost dashboards",
    ],
  },
] as const;

const FeatureExplorer = memo(function FeatureExplorer() {
  const [open, setOpen] = useState<string | null>("digital-human");
  return (
    <Section
      id="v6-features"
      eyebrow="Enterprise Feature Explorer"
      title="Every capability, in one glass surface."
      copy="Tap any capability to expand. Every card is powered by the same HAPPY runtime."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isOpen = open === f.id;
          return (
            <GlassCard key={f.id} className="p-5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-display text-[15px] text-paper">
                  {f.label}
                </span>
                <ChevronDown
                  className={
                    "h-4 w-4 text-soft-gray transition-transform " +
                    (isOpen ? "rotate-180" : "")
                  }
                />
              </button>
              <div
                className={
                  "grid overflow-hidden transition-[grid-template-rows] duration-300 " +
                  (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
                }
              >
                <ul className="min-h-0 space-y-1.5 pt-3 text-[12.5px] text-soft-gray">
                  {f.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-gold" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────  4. Interactive Plan Comparison  ───────────── */

type PlanRow = {
  id: string;
  name: string;
  price: string;
  features: Record<string, boolean>;
};

const COMPARE_ROWS = [
  "Digital Human",
  "AI Chat & Tools",
  "Business OS",
  "Education OS",
  "Creator OS",
  "Knowledge OS",
  "Marketplace",
  "Hyperlocal",
  "RBAC & SSO",
  "Audit Logs",
  "Custom SLA",
  "Private Deployment",
  "Migration Support",
  "Dedicated CSM",
];

const PLANS: PlanRow[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    features: mkFeatures([1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    id: "creator",
    name: "Creator Pro",
    price: "$29",
    features: mkFeatures([1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    features: mkFeatures([1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0]),
  },
  {
    id: "business",
    name: "Business",
    price: "$299",
    features: mkFeatures([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0]),
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    features: mkFeatures([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  },
];

function mkFeatures(vals: number[]): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  COMPARE_ROWS.forEach((r, i) => (o[r] = Boolean(vals[i])));
  return o;
}

const PlanCompare = memo(function PlanCompare() {
  const [sel, setSel] = useState<string[]>([
    "starter",
    "growth",
    "business",
    "enterprise",
  ]);

  const toggle = (id: string) => {
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 5 ? [...s, id] : s,
    );
  };

  const active = PLANS.filter((p) => sel.includes(p.id));

  return (
    <Section
      id="v6-compare"
      eyebrow="Plan Comparison"
      title="Compare up to five plans side by side."
      copy="New wins glow gold. Missing gaps are muted. Upgrade benefits are called out."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {PLANS.map((p) => {
          const on = sel.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
              className={
                "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors " +
                (on
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-white/10 bg-white/5 text-soft-gray hover:text-paper")
              }
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-gold/15 bg-obsidian/40">
              <th className="sticky left-0 z-10 bg-obsidian/60 p-4 text-[11px] uppercase tracking-widest text-soft-gray">
                Feature
              </th>
              {active.map((p) => (
                <th key={p.id} className="p-4 text-paper">
                  <div className="font-display text-[14px]">{p.name}</div>
                  <div className="text-[11px] text-soft-gray">{p.price}/mo</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, ri) => {
              const trueCount = active.filter((p) => p.features[row]).length;
              const isUpgradeHighlight =
                trueCount > 0 && trueCount < active.length;
              return (
                <tr
                  key={row}
                  className={
                    "border-b border-white/5 " +
                    (ri % 2 ? "bg-white/[0.02]" : "")
                  }
                >
                  <td className="sticky left-0 z-10 bg-obsidian/70 p-3 text-paper">
                    {row}
                    {isUpgradeHighlight ? (
                      <span className="ml-2 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">
                        Upgrade
                      </span>
                    ) : null}
                  </td>
                  {active.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.features[row] ? (
                        <Check className="h-4 w-4 text-gold" />
                      ) : (
                        <span className="text-soft-gray/50">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </Section>
  );
});

/* ─────────────  5. Enterprise ROI  ───────────── */

const ROI = memo(function ROI() {
  const [inputs, setInputs] = useState({
    employees: 100,
    aiRequests: 20000,
    companies: 1,
    departments: 6,
    revenue: 5_000_000,
    salary: 45000,
    hours: 8,
  });

  const monthly = useMemo(() => {
    const toolConsolidation = inputs.employees * 42;
    const aiCost = inputs.aiRequests * 0.004;
    const timeSavings =
      inputs.employees * inputs.hours * (inputs.salary / 2080) * 0.12 * 22;
    const enterpriseOverhead = inputs.companies * inputs.departments * 350;
    return Math.max(
      0,
      Math.round(
        toolConsolidation + timeSavings + enterpriseOverhead - aiCost * 0.8,
      ),
    );
  }, [inputs]);
  const annual = monthly * 12;
  const fiveYear = annual * 5;
  const productivity = Math.min(
    48,
    Math.round(6 + inputs.employees / 20 + inputs.departments),
  );
  const plan =
    inputs.employees >= 500
      ? "Enterprise"
      : inputs.employees >= 50
      ? "Business"
      : "Growth";

  const { ref, seen } = useOnScreen<HTMLDivElement>();
  const m = useCounter(monthly, seen, 700);
  const a = useCounter(annual, seen, 900);
  const f = useCounter(fiveYear, seen, 1100);
  const pr = useCounter(productivity, seen, 800);

  return (
    <Section
      id="v6-roi"
      eyebrow="Enterprise ROI"
      title="See what HAPPY is worth to your organization."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]" ref={ref}>
        <GlassCard className="p-6">
          {(
            [
              ["employees", "Employees", 1, 20000, 1],
              ["aiRequests", "AI requests / mo", 0, 5_000_000, 1000],
              ["companies", "Companies", 1, 200, 1],
              ["departments", "Departments", 1, 50, 1],
              ["revenue", "Annual revenue ($)", 0, 500_000_000, 100_000],
              ["salary", "Avg salary ($)", 20000, 500000, 1000],
              ["hours", "Working hours / day", 4, 12, 1],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <div key={key} className="mb-4">
              <div className="mb-1 flex justify-between text-[12px]">
                <span className="text-soft-gray">{label}</span>
                <span className="font-medium text-paper">
                  {inputs[key].toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={inputs[key]}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, [key]: Number(e.target.value) }))
                }
                aria-label={label}
                className="w-full accent-[color:var(--gold,#e8c96a)]"
              />
            </div>
          ))}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Monthly savings" value={`$${m.toLocaleString()}`} />
            <Stat label="Annual savings" value={`$${a.toLocaleString()}`} />
            <Stat label="5-year ROI" value={`$${f.toLocaleString()}`} />
            <Stat label="Productivity gain" value={`${pr}%`} />
          </div>
          <div className="mt-6 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/15 to-transparent p-5">
            <div className="text-[10px] uppercase tracking-widest text-gold">
              Recommended plan
            </div>
            <div className="mt-1 font-display text-2xl text-paper">{plan}</div>
            <p className="mt-2 text-[12.5px] text-soft-gray">
              Live estimate. Actual savings vary by industry — talk to sales for
              a modelled quote.
            </p>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
});

/* ─────────────  6. Enterprise Readiness  ───────────── */

const READINESS = [
  { label: "Startup Ready", pct: 100, icon: Rocket },
  { label: "SMB Ready", pct: 100, icon: Store },
  { label: "Enterprise Ready", pct: 98, icon: Landmark },
  { label: "Government Ready", pct: 92, icon: ShieldCheck },
  { label: "Education Ready", pct: 100, icon: GraduationCap },
  { label: "Manufacturing Ready", pct: 95, icon: Cpu },
] as const;

const Readiness = memo(function Readiness() {
  const { ref, seen } = useOnScreen<HTMLDivElement>();
  return (
    <Section
      id="v6-readiness"
      eyebrow="Enterprise Readiness"
      title="Ready for the segments that matter."
    >
      <div ref={ref} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {READINESS.map((r) => (
          <ReadinessCard key={r.label} {...r} active={seen} />
        ))}
      </div>
    </Section>
  );
});

const ReadinessCard = memo(function ReadinessCard({
  label,
  pct,
  icon: Icon,
  active,
}: {
  label: string;
  pct: number;
  icon: typeof Rocket;
  active: boolean;
}) {
  const n = useCounter(pct, active);
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-paper">{label}</div>
          <div className="text-[11px] text-soft-gray">Certified stack</div>
        </div>
        <div className="font-display text-lg text-gold">{n}%</div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-gold to-gold/50 transition-[width] duration-700"
          style={{ width: `${n}%` }}
        />
      </div>
    </GlassCard>
  );
});

/* ─────────────  7. Customer Success  ───────────── */

const CASES = [
  {
    industry: "Education",
    icon: GraduationCap,
    title: "12,000 students — one tutor",
    metric: "3.2× mastery",
    body: "A national tutoring network moved from static courseware to HAPPY's mastery loop and tripled completion.",
  },
  {
    industry: "Healthcare",
    icon: HeartPulse,
    title: "45-hospital operator",
    metric: "38% ops cost cut",
    body: "Consolidated CRM, ERP and analytics into HAPPY; freed 60 admin FTEs across the network.",
  },
  {
    industry: "Manufacturing",
    icon: Cpu,
    title: "Precision components plant",
    metric: "22% throughput",
    body: "Inventory, quality and shift analytics moved onto Business OS in 90 days.",
  },
  {
    industry: "Retail",
    icon: ShoppingBag,
    title: "Omni-channel retailer",
    metric: "4.1× ROI",
    body: "Marketplace + Hyperlocal delivered same-week storefront rollouts across 42 cities.",
  },
  {
    industry: "Services",
    icon: Wrench,
    title: "Managed services group",
    metric: "51% ticket deflection",
    body: "Skills + Runtime automated tier-1 support with auditable outcomes.",
  },
  {
    industry: "Government",
    icon: Landmark,
    title: "State digital services",
    metric: "9 languages",
    body: "Sovereign deployment with RBAC, audit and residency in-country.",
  },
  {
    industry: "Startups",
    icon: Rocket,
    title: "Series-A SaaS",
    metric: "12 tools → 1",
    body: "Founders replaced their SaaS sprawl and shipped an internal AI OS in a weekend.",
  },
] as const;

const CustomerSuccess = memo(function CustomerSuccess() {
  return (
    <Section
      id="v6-customers"
      eyebrow="Customer Success"
      title="Outcomes across every industry."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c) => {
          const Icon = c.icon;
          return (
            <GlassCard key={c.title} className="p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-obsidian/60 px-2 py-1 text-[10px] uppercase tracking-widest text-gold/80">
                  <Icon className="h-3 w-3" />
                  {c.industry}
                </span>
                <span className="font-display text-sm text-gold">
                  {c.metric}
                </span>
              </div>
              <div className="mt-3 font-display text-[16px] text-paper">
                {c.title}
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-soft-gray">
                {c.body}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────  8. Security & Compliance  ───────────── */

const SECURITY = [
  { label: "Encryption at rest & in transit", icon: Shield },
  { label: "Role-based access control (RBAC)", icon: ShieldCheck },
  { label: "Row-level security (RLS)", icon: ShieldCheck },
  { label: "Immutable audit logs", icon: LineChart },
  { label: "Privacy by design", icon: UserRound },
  { label: "Responsible AI policy", icon: Brain },
  { label: "Data residency options", icon: Landmark },
  { label: "SOC / ISO readiness", icon: Check },
] as const;

const Security = memo(function Security() {
  return (
    <Section
      id="v6-security"
      eyebrow="Security & Compliance"
      title="Built to earn enterprise trust."
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SECURITY.map((s) => {
          const Icon = s.icon;
          return (
            <GlassCard key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-gold" />
                <span className="text-[13px] text-paper">{s.label}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────  9. Global Availability  ───────────── */

const GLOBAL = [
  { k: "42", l: "Languages" },
  { k: "6", l: "Regions" },
  { k: "24", l: "Timezones" },
  { k: "18", l: "Currencies" },
] as const;

const Global = memo(function Global() {
  const { ref, seen } = useOnScreen<HTMLDivElement>();
  return (
    <Section
      id="v6-global"
      eyebrow="Global Availability"
      title="Deploy locally. Operate globally."
    >
      <div ref={ref} className="grid gap-4 md:grid-cols-4">
        {GLOBAL.map((g) => (
          <GlobalStat key={g.l} n={Number(g.k)} label={g.l} active={seen} />
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          "APAC data plane — live",
          "EU data plane — live",
          "AMERICAS data plane — live",
          "MEA data plane — Q3",
          "LATAM data plane — Q4",
          "Sovereign on-prem — available",
        ].map((r) => (
          <GlassCard key={r} className="p-4">
            <div className="text-[13px] text-paper">{r}</div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
});

const GlobalStat = memo(function GlobalStat({
  n,
  label,
  active,
}: {
  n: number;
  label: string;
  active: boolean;
}) {
  const v = useCounter(n, active);
  return (
    <GlassCard className="p-6 text-center">
      <div className="font-display text-4xl text-gold">{v}</div>
      <div className="mt-2 text-[11px] uppercase tracking-widest text-soft-gray">
        {label}
      </div>
    </GlassCard>
  );
});

/* ─────────────  10. Migration Center  ───────────── */

const MIGRATE = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Notion",
  "ERP (SAP, Oracle, Zoho)",
  "CRM (Salesforce, HubSpot)",
  "CSV",
  "Excel",
] as const;

const Migration = memo(function Migration() {
  return (
    <Section
      id="v6-migration"
      eyebrow="Migration Center"
      title="Bring everything with you."
      copy="Automated mapping, validation and rollback. No cleanup weekends."
    >
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {MIGRATE.map((m) => (
          <GlassCard key={m} className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-gold" />
              <span className="text-[13px] text-paper">{m}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
});

/* ─────────────  11. Enterprise Contact  ───────────── */

const CONTACT = [
  { label: "Start Free", icon: Rocket, href: "/auth", primary: true },
  { label: "Book Demo", icon: Presentation, href: "/auth" },
  { label: "Contact Sales", icon: Phone, href: "/auth" },
  { label: "WhatsApp", icon: MessageCircle, href: "/auth" },
  { label: "Email", icon: Send, href: "/auth" },
  { label: "Schedule Meeting", icon: Users, href: "/auth" },
  { label: "Become Partner", icon: Landmark, href: "/auth" },
  { label: "Developer Portal", icon: Wrench, href: "/auth" },
] as const;

const Contact = memo(function Contact() {
  return (
    <Section
      id="v6-contact"
      eyebrow="Enterprise Contact"
      title="Talk to a human. Or the digital one."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONTACT.map((c) => {
          const Icon = c.icon;
          return (
            <a
              key={c.label}
              href={c.href}
              className={
                "group flex items-center justify-between rounded-2xl border p-4 transition-all " +
                (c.primary
                  ? "border-gold/60 bg-gold text-obsidian hover:scale-[1.02]"
                  : "border-gold/20 bg-charcoal/40 text-paper hover:border-gold/50 hover:bg-charcoal/60")
              }
            >
              <span className="flex items-center gap-3 text-[13px] font-medium">
                <Icon className="h-4 w-4" />
                {c.label}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          );
        })}
      </div>
    </Section>
  );
});

/* ─────────────  12. Revenue Dashboard (frontend demo)  ───────────── */

const RevenueDashboard = memo(function RevenueDashboard() {
  const { ref, seen } = useOnScreen<HTMLDivElement>();
  const [state, setState] = useState({
    plans: 4820,
    roi: 1240,
    recs: 962,
    demos: 187,
    leads: 74,
  });
  useEffect(() => {
    if (!seen) return;
    const t = window.setInterval(() => {
      setState((s) => ({
        plans: s.plans + Math.floor(Math.random() * 3),
        roi: s.roi + (Math.random() > 0.4 ? 1 : 0),
        recs: s.recs + (Math.random() > 0.5 ? 1 : 0),
        demos: s.demos + (Math.random() > 0.8 ? 1 : 0),
        leads: s.leads + (Math.random() > 0.92 ? 1 : 0),
      }));
    }, 2200);
    return () => clearInterval(t);
  }, [seen]);

  const items = [
    { k: "Plans Viewed", v: state.plans },
    { k: "ROI Calculations", v: state.roi },
    { k: "Recommended Plans", v: state.recs },
    { k: "Demo Requests", v: state.demos },
    { k: "Enterprise Leads", v: state.leads },
  ];

  return (
    <Section
      id="v6-dashboard"
      eyebrow="Revenue Dashboard"
      title="Live pricing engagement — demo view."
      copy="Frontend-only preview of the revenue signals HAPPY captures during pricing exploration."
    >
      <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((i) => (
          <GlassCard key={i.k} className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-soft-gray">
              {i.k}
            </div>
            <div className="mt-2 font-display text-3xl text-paper">
              {i.v.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
              <LineChart className="h-3 w-3" />
              live
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
});

/* ─────────────  Root  ───────────── */

export function PricingExperienceV6() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const spot = useSpotlight();
  return (
    <div
      ref={spotlightRef}
      onMouseMove={spot.onMove}
      onMouseLeave={spot.onLeave}
      className="relative overflow-hidden"
      aria-label="HAPPY Pricing Experience v6.0 Revenue Engine"
    >
      {spot.overlay}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-gold">
          <Sparkles className="h-3 w-3" />
          Pricing Experience v6.0 · Revenue Engine
        </div>
      </div>
      <SalesAdvisor />
      <PlanDiscovery />
      <FeatureExplorer />
      <PlanCompare />
      <ROI />
      <Readiness />
      <CustomerSuccess />
      <Security />
      <Global />
      <Migration />
      <Contact />
      <RevenueDashboard />
    </div>
  );
}

export default PricingExperienceV6;
