import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Sparkle,
  GraduationCap,
  Building2,
  Wand2,
  Landmark,
  Users,
  Store,
  Shield,
  Check,
  Apple,
  Play,
  Quote,
} from "lucide-react";
import avatarImg from "@/assets/happyx-avatar.jpg";

export const Route = createFileRoute("/")({
  component: HappyXLanding,
});

function HappyXLanding() {
  return (
    <div className="min-h-screen bg-obsidian text-paper overflow-x-hidden">
      <Nav />
      <Hero />
      <TrustBar />
      <ChatPreview />
      <ModuleShowcase
        id="education"
        eyebrow="Education Platform"
        title="From KG to PhD. Teach Until Mastered™."
        copy="An adaptive, mastery-based curriculum guided by a patient digital human. Coding, AI, business, languages, quizzes, notes, and mock tests — synthesized into one continuous learning organism."
        icon={GraduationCap}
        stats={[
          { value: "1:1", label: "Personal tutor" },
          { value: "12+", label: "Mastery domains" },
          { value: "24/7", label: "Availability" },
        ]}
      />
      <ModuleShowcase
        id="business-os"
        eyebrow="Business Operating System"
        title="CRM, ERP, HRMS. One sovereign spine."
        copy="Manufacturing, inventory, warehouse, marketing, finance and analytics designed as first-class citizens — not bolted on. Multi-company, multi-brand, unlimited expansion."
        icon={Building2}
        reverse
        stats={[
          { value: "10", label: "Core suites" },
          { value: "∞", label: "Companies & brands" },
          { value: "GST", label: "Native compliance" },
        ]}
      />
      <ModuleShowcase
        id="creator"
        eyebrow="Creator Studio"
        title="Cinematic AI. Directed by you."
        copy="Images, videos, voice, animation, and presentations produced with the same aesthetic discipline as a Hollywood post house. Every asset is signed, versioned and enterprise-safe."
        icon={Wand2}
        stats={[
          { value: "5", label: "Modalities" },
          { value: "4K", label: "Master export" },
          { value: "0", label: "Watermarks" },
        ]}
      />
      <ModuleShowcase
        id="enterprise"
        eyebrow="Enterprise Platform"
        title="Founder-grade control at every altitude."
        copy="Global Control Center, workflow builder, automation, CMS, analytics, security and privacy centers — engineered for the office of the founder, the CFO, and the CIO."
        icon={Landmark}
        reverse
        stats={[
          { value: "RBAC", label: "Fine-grained roles" },
          { value: "MFA", label: "Enforced" },
          { value: "SOC-class", label: "Audit logs" },
        ]}
      />
      <CommunityMarketplace />
      <Portfolio />
      <FounderMessage />
      <Pricing />
      <DownloadApp />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─────────────────────────  NAV  ───────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-gold/10 bg-obsidian/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="group flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[15px] font-semibold tracking-tight text-paper">
            HAPPY <span className="text-gradient-gold">X</span>
          </span>
        </a>
        <nav className="hidden gap-8 text-[13px] font-medium text-soft-gray md:flex">
          {[
            ["Platform", "#platform"],
            ["Education", "#education"],
            ["Business", "#business-os"],
            ["Enterprise", "#enterprise"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="transition-colors duration-300 hover:text-paper"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden text-[13px] font-medium text-soft-gray transition-colors hover:text-paper md:block"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="shimmer-on-hover group inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[13px] font-semibold text-obsidian transition-transform hover:scale-[1.03]"
          >
            Enter console
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold/25 via-transparent to-transparent" />
      <span className="relative font-display text-[13px] font-bold text-gradient-gold">
        H
      </span>
    </div>
  );
}

/* ─────────────────────────  HERO  ───────────────────────── */
function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-3xl animate-pulse-halo" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0b0b0d_75%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-charcoal/60 px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className="eyebrow !text-[10px]">Now inviting founding partners</span>
          </div>

          <h1 className="mt-8 font-display text-5xl font-medium leading-[1.02] tracking-tight text-paper md:text-7xl">
            The Human-Centered<br />
            <span className="text-gradient-gold">AI Operating Platform.</span>
          </h1>

          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-soft-gray">
            HAPPY X unifies a photorealistic 3D digital human, an executive AI
            brain, an education platform from KG to PhD, and a complete business
            operating system — into a single sovereign environment engineered
            for the next century of enterprise.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button className="shimmer-on-hover group inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[14px] font-semibold text-obsidian transition-transform hover:scale-[1.02]">
              Experience HAPPY X
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-charcoal/40 px-6 py-3.5 text-[14px] font-medium text-paper backdrop-blur transition-colors hover:bg-charcoal/70">
              <Play className="h-3.5 w-3.5 fill-gold text-gold" />
              Watch the film
            </button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-gold/10 pt-8">
            {[
              { v: "10", l: "Core modules" },
              { v: "∞", l: "Companies & brands" },
              { v: "24/7", l: "Digital human" },
            ].map((s) => (
              <div key={s.l}>
                <div className="numeric text-3xl font-semibold text-paper">
                  {s.v}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-soft-gray">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <HeroAvatar />
      </div>
    </section>
  );
}

function HeroAvatar() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
    setTilt({ x, y });
  };

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative aspect-[4/5] w-full [perspective:1200px]"
      >
        {/* halo */}
        <div className="absolute inset-8 rounded-[3rem] bg-gold/20 blur-3xl animate-pulse-halo" />
        {/* frame */}
        <div
          className="relative h-full w-full overflow-hidden rounded-[2rem] border border-gold/20 bg-charcoal transition-transform duration-300 ease-out"
          style={{
            transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            boxShadow: "var(--shadow-luxe)",
          }}
        >
          <img
            src={avatarImg}
            alt="HAPPY X — 3D digital human executive avatar"
            width={1280}
            height={1600}
            className="h-full w-full object-cover"
          />
          {/* gradient veils */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.15),transparent_55%)]" />

          {/* status chip */}
          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] uppercase tracking-widest text-paper">
              Live · Listening
            </span>
          </div>

          {/* signature */}
          <div className="absolute inset-x-5 bottom-5">
            <div className="glass-luxe flex items-center justify-between rounded-2xl px-4 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gold">
                  Avatar
                </div>
                <div className="mt-0.5 font-display text-sm font-medium text-paper">
                  HAPPY · Executive Presence
                </div>
              </div>
              <div className="numeric text-xs text-soft-gray">v4.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  TRUST BAR  ───────────────────────── */
function TrustBar() {
  const items = [
    "Enterprise Security",
    "RBAC · MFA",
    "GST · Tax",
    "Multi Company",
    "Cloud Native",
    "Offline Ready",
  ];
  return (
    <section className="border-y border-gold/10 bg-charcoal/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-8">
        {items.map((i) => (
          <span
            key={i}
            className="text-[11px] uppercase tracking-[0.3em] text-soft-gray"
          >
            {i}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────  AI CHAT PREVIEW  ───────────────────── */
function ChatPreview() {
  return (
    <section id="platform" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Chat · Executive Assistant"
          title="Not a chatbot. A presence."
          copy="Speak to HAPPY as you would a chief of staff. Contextual memory, mission engine, live search, and a warm human voice — always in service of your intent."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.25fr]">
          {/* avatar side */}
          <div className="relative overflow-hidden rounded-3xl border border-gold/15 bg-charcoal p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.18),transparent_60%)]" />
            <div className="relative">
              <p className="eyebrow">Persona</p>
              <h3 className="mt-3 font-display text-2xl text-paper">
                HAPPY · Chief of Staff
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-soft-gray">
                Calm. Precise. Loyal. Speaks 40+ languages. Remembers what
                matters. Never oversteps.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  ["Voice", "Warm baritone · Neutral"],
                  ["Latency", "Sub-100 ms"],
                  ["Memory", "Sovereign · Encrypted"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-t border-gold/10 pt-3"
                  >
                    <span className="text-[11px] uppercase tracking-widest text-soft-gray">
                      {k}
                    </span>
                    <span className="text-sm text-paper">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* transcript */}
          <div className="rounded-3xl border border-gold/15 bg-charcoal p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] uppercase tracking-widest text-soft-gray">
                  Session · Secure
                </span>
              </div>
              <span className="numeric text-[11px] text-soft-gray">
                14:02 IST
              </span>
            </div>

            <div className="space-y-5">
              <ChatBubble
                who="you"
                text="Draft a Q3 strategy brief for the Mumbai team. Emphasize margins."
              />
              <ChatBubble
                who="ai"
                text="Understood. Reviewing last quarter's cohort data, margin drift by SKU, and Mumbai HR capacity. I'll prepare a two-page brief with three scenarios. Shall I include the manufacturing yield forecast from Business OS?"
              />
              <ChatBubble who="you" text="Yes, and route it to Priya for review." />
              <div className="glass-luxe rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                  <Sparkle className="h-3 w-3" />
                  Working
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-obsidian">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright animate-gold-drift" />
                </div>
                <p className="mt-3 text-sm text-soft-gray">
                  Synthesizing across Business OS, Analytics, and CRM · routing
                  approval to Priya.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/15 bg-obsidian/60 p-3">
              <div className="flex-1 truncate px-2 text-sm text-soft-gray">
                Ask HAPPY anything…
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-obsidian">
                Send
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ who, text }: { who: "you" | "ai"; text: string }) {
  if (who === "you") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gold px-4 py-3 text-sm font-medium text-obsidian">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-gold/30 bg-obsidian">
        <span className="text-[11px] font-bold text-gradient-gold">H</span>
      </div>
      <div className="max-w-[85%] text-[15px] leading-relaxed text-paper">
        {text}
      </div>
    </div>
  );
}

/* ─────────────────────  MODULE SHOWCASE  ───────────────────── */
function SectionHeader({
  eyebrow,
  title,
  copy,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mx-auto max-w-2xl ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl font-medium leading-[1.1] text-paper md:text-5xl">
        {title}
      </h2>
      {copy && (
        <p className="mt-5 text-[16px] leading-relaxed text-soft-gray">{copy}</p>
      )}
    </div>
  );
}

function ModuleShowcase({
  id,
  eyebrow,
  title,
  copy,
  icon: Icon,
  stats,
  reverse,
}: {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  icon: React.ElementType;
  stats: { value: string; label: string }[];
  reverse?: boolean;
}) {
  return (
    <section id={id} className="relative border-t border-gold/10 py-28">
      <div
        className={`mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 ${
          reverse ? "lg:[&>div:first-child]:order-2" : ""
        }`}
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-charcoal/60 px-3 py-1.5">
            <Icon className="h-3.5 w-3.5 text-gold" />
            <span className="eyebrow !text-[10px]">{eyebrow}</span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] text-paper md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-soft-gray">
            {copy}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gold/10 pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="numeric text-3xl font-semibold text-paper">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-soft-gray">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <button className="mt-10 group inline-flex items-center gap-2 text-sm font-semibold text-gold">
            Explore module
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        <ModuleCanvas icon={Icon} />
      </div>
    </section>
  );
}

function ModuleCanvas({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-gold/[0.05] blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-gold/15 bg-charcoal p-1">
        <div className="rounded-[calc(1.5rem-4px)] bg-obsidian p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-charcoal">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div>
                <div className="numeric text-[11px] uppercase tracking-widest text-soft-gray">
                  Live workspace
                </div>
                <div className="text-sm font-medium text-paper">
                  Sovereign namespace
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold/30" />
              <span className="h-2 w-2 rounded-full bg-gold/60" />
              <span className="h-2 w-2 rounded-full bg-gold" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[68, 92, 41, 77, 55, 88, 30, 62, 95].map((h, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-lg border border-gold/10 bg-obsidian p-3"
                style={{ minHeight: "70px" }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gold/40 to-transparent"
                  style={{ height: `${h}%` }}
                />
                <div className="relative numeric text-[10px] text-soft-gray">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="relative mt-1 numeric text-sm font-semibold text-paper">
                  {h}%
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gold/10 pt-5">
            <span className="text-[11px] uppercase tracking-widest text-soft-gray">
              Synced
            </span>
            <span className="numeric text-xs text-paper">
              4.2 PB · 1,204 nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────  COMMUNITY & MARKETPLACE  ───────────────── */
function CommunityMarketplace() {
  return (
    <section id="community" className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Community · Marketplace"
          title="An economy for the human-AI era."
          copy="AI agents, templates, plugins, and a Hall of Success — traded in a fair, transparent marketplace built for creators, developers, and enterprises."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              t: "Community",
              d: "Founders, creators, teachers, engineers.",
              n: "48,200",
              nl: "members",
            },
            {
              icon: Store,
              t: "Marketplace",
              d: "Agents · templates · plugins.",
              n: "3,140",
              nl: "listings",
            },
            {
              icon: Brain,
              t: "AI Agents",
              d: "Purpose-built, review-signed agents.",
              n: "612",
              nl: "verified",
            },
            {
              icon: Sparkle,
              t: "Hall of Success",
              d: "Case studies from real operators.",
              n: "128",
              nl: "featured",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="shimmer-on-hover group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal p-6 transition-colors hover:border-gold/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-obsidian">
                <c.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-6 font-display text-xl text-paper">{c.t}</div>
              <p className="mt-2 text-sm text-soft-gray">{c.d}</p>
              <div className="mt-8 flex items-baseline gap-2 border-t border-gold/10 pt-5">
                <span className="numeric text-2xl font-semibold text-paper">
                  {c.n}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-soft-gray">
                  {c.nl}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  PORTFOLIO  ───────────────────── */
function Portfolio() {
  return (
    <section className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Company Portfolio</p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.1] text-paper md:text-5xl">
              One company. Many horizons.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-soft-gray">
              HAPPY PERSON PRIVATE LIMITED houses a family of brands, each
              engineered to a common standard — sovereign, human, precise.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                t: "HAPPY X",
                d: "Human-Centered AI Operating Platform",
                tag: "Flagship",
              },
              {
                t: "HAPPY Studio",
                d: "Creator & Cinematic AI",
                tag: "Media",
              },
              {
                t: "HAPPY Enterprise",
                d: "Global Business OS · CRM · ERP · HRMS",
                tag: "Enterprise",
              },
              {
                t: "HAPPY Learn",
                d: "Education · KG to PhD · Teach Until Mastered",
                tag: "Education",
              },
            ].map((b) => (
              <div
                key={b.t}
                className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal p-6 transition-colors hover:border-gold/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-gold">
                      {b.tag}
                    </div>
                    <div className="mt-2 font-display text-lg text-paper">
                      {b.t}
                    </div>
                    <p className="mt-1.5 text-sm text-soft-gray">{b.d}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-soft-gray transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  FOUNDER MESSAGE  ───────────────────── */
function FounderMessage() {
  return (
    <section className="relative border-t border-gold/10 py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Quote className="mx-auto h-8 w-8 text-gold/60" />
        <blockquote className="mt-8 font-display text-3xl font-medium leading-[1.25] text-paper md:text-4xl">
          "We are not building another application. We are architecting the
          medium through which human ambition meets machine precision — a
          sovereign platform where every person, every company, and every
          culture can flourish."
        </blockquote>
        <div className="mt-10 flex flex-col items-center gap-1">
          <div className="mb-3 h-px w-16 bg-hairline-gold" />
          <div className="text-sm font-semibold text-gold">
            Mohammad Naushad Raza Qadri
          </div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-soft-gray">
            Founder · HAPPY PERSON PRIVATE LIMITED
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  PRICING  ───────────────────── */
function Pricing() {
  const tiers = [
    {
      name: "Individual",
      price: "₹999",
      period: "/month",
      copy: "The full HAPPY experience for one person.",
      features: [
        "AI Assistant & Chat",
        "Digital Human · Standard",
        "Creator Studio · basic",
        "10 GB sovereign memory",
      ],
      cta: "Begin",
      featured: false,
    },
    {
      name: "Business",
      price: "₹9,999",
      period: "/month",
      copy: "Business OS + team collaboration.",
      features: [
        "Everything in Individual",
        "CRM · ERP · HRMS",
        "Up to 25 team members",
        "Analytics & Workflow Builder",
      ],
      cta: "Start business",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Bespoke",
      period: "",
      copy: "Multi-company, multi-brand, unlimited.",
      features: [
        "Everything in Business",
        "Founder & Global Control Center",
        "Dedicated digital humans",
        "SOC-class audit & residency",
      ],
      cta: "Speak to us",
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Sovereign by default. Priced with dignity."
          copy="Every plan includes end-to-end encryption, MFA, RBAC, GST invoicing, and full data export. No hidden meters."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative overflow-hidden rounded-3xl border p-8 transition-colors ${
                t.featured
                  ? "border-gold/40 bg-gradient-to-b from-charcoal to-obsidian"
                  : "border-gold/15 bg-charcoal"
              }`}
            >
              {t.featured && (
                <div className="absolute right-6 top-6 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold">
                  Most chosen
                </div>
              )}
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">
                {t.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="numeric font-display text-5xl font-semibold text-paper">
                  {t.price}
                </span>
                {t.period && (
                  <span className="text-sm text-soft-gray">{t.period}</span>
                )}
              </div>
              <p className="mt-3 text-sm text-soft-gray">{t.copy}</p>

              <ul className="mt-8 space-y-3 border-t border-gold/10 pt-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-paper">
                    <Check className="h-4 w-4 flex-none text-gold" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.01] ${
                  t.featured
                    ? "bg-gold text-obsidian"
                    : "border border-gold/25 text-paper hover:bg-gold/10"
                }`}
              >
                {t.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  DOWNLOAD APP  ───────────────────── */
function DownloadApp() {
  return (
    <section className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-gold/20 bg-charcoal p-10 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.15),transparent_60%)]" />
          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Download HAPPY X</p>
              <h2 className="mt-4 font-display text-4xl font-medium leading-[1.1] text-paper md:text-5xl">
                In your pocket.<br />
                <span className="text-gradient-gold">On your desk.</span>
              </h2>
              <p className="mt-5 max-w-md text-soft-gray">
                A single sovereign account across web, iOS, and Android. Offline
                first, cloud synced, everywhere you are.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-3 rounded-2xl border border-gold/25 bg-obsidian px-5 py-3.5 text-left transition-colors hover:bg-obsidian/60">
                  <Apple className="h-6 w-6 text-paper" />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-soft-gray">
                      Download on
                    </div>
                    <div className="text-sm font-semibold text-paper">
                      App Store
                    </div>
                  </div>
                </button>
                <button className="inline-flex items-center gap-3 rounded-2xl border border-gold/25 bg-obsidian px-5 py-3.5 text-left transition-colors hover:bg-obsidian/60">
                  <PlayStoreMark />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-soft-gray">
                      Get it on
                    </div>
                    <div className="text-sm font-semibold text-paper">
                      Google Play
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayStoreMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path
        className="text-gold"
        fill="currentColor"
        d="M3.6 1.9c-.4.2-.6.7-.6 1.3v17.6c0 .6.2 1.1.6 1.3l10.2-10.1L3.6 1.9zm11.4 11.3l2.8 2.8-11.2 6.4 8.4-9.2zm0-2.4L6.6 1.6l11.2 6.4-2.8 2.8zm5.7 2.5c.7-.4.7-1.5 0-1.9l-2.4-1.4-3 3 3 3 2.4-1.4-.0-.0z"
      />
    </svg>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute -inset-4 rounded-[3rem] bg-gold/20 blur-3xl" />
      <div className="relative aspect-[9/19] w-full rounded-[2.5rem] border border-gold/30 bg-obsidian p-2 shadow-luxe">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-charcoal">
          <div className="absolute inset-x-0 top-0 flex justify-center pt-3">
            <div className="h-4 w-24 rounded-full bg-obsidian" />
          </div>
          <img
            src={avatarImg}
            alt=""
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute inset-x-4 bottom-6">
            <div className="text-[9px] uppercase tracking-widest text-gold">
              Good evening, Naushad
            </div>
            <div className="mt-1 font-display text-xl text-paper">
              How may I serve you today?
            </div>
            <div className="mt-4 glass-luxe flex items-center justify-between rounded-2xl px-3 py-2">
              <span className="text-[11px] text-soft-gray">Speak to HAPPY</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold">
                <Play className="h-3 w-3 fill-obsidian text-obsidian" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────  CTA  ───────────────────── */
function CTA() {
  return (
    <section className="relative border-t border-gold/10 py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Shield className="mx-auto h-6 w-6 text-gold/70" />
        <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] text-paper md:text-6xl">
          Enter the next century of<br />
          <span className="text-gradient-gold">enterprise intelligence.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-soft-gray">
          Applications for the founding cohort are open by invitation. Every
          seat is reviewed by the office of the founder.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="shimmer-on-hover inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-obsidian transition-transform hover:scale-[1.02]">
            Request access
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="inline-flex items-center gap-2.5 rounded-full border border-gold/25 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-gold/10">
            Talk to sales
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  FOOTER  ───────────────────── */
function Footer() {
  const columns: { t: string; items: string[] }[] = [
    {
      t: "Platform",
      items: [
        "AI Assistant",
        "Digital Human",
        "Education",
        "Business OS",
        "Creator Studio",
      ],
    },
    {
      t: "Enterprise",
      items: [
        "Founder Portal",
        "Global Control",
        "Workflow Builder",
        "Security Center",
        "Privacy Center",
      ],
    },
    {
      t: "Community",
      items: ["Marketplace", "Agents", "Templates", "Plugins", "Hall of Success"],
    },
    {
      t: "Company",
      items: ["About", "Founder", "Careers", "Press", "Contact"],
    },
  ];

  return (
    <footer className="border-t border-gold/10 bg-charcoal">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-sm font-semibold text-paper">
                HAPPY <span className="text-gradient-gold">X</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-soft-gray">
              The sovereign, human-centered AI operating platform. By HAPPY
              PERSON PRIVATE LIMITED.
            </p>
            <div className="mt-6 text-[11px] uppercase tracking-widest text-soft-gray">
              Bengaluru · Mumbai · Dubai · Global
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.t}>
              <div className="text-[11px] uppercase tracking-widest text-gold">
                {c.t}
              </div>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-soft-gray transition-colors hover:text-paper"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-gold/10 pt-6 md:flex-row md:items-center">
          <p className="text-[11px] uppercase tracking-widest text-soft-gray">
            © {new Date().getFullYear()} HAPPY PERSON PRIVATE LIMITED. All rights reserved.
          </p>
          <div className="flex gap-6 text-[11px] uppercase tracking-widest text-soft-gray">
            <a href="#" className="hover:text-paper">
              Privacy
            </a>
            <a href="#" className="hover:text-paper">
              Terms
            </a>
            <a href="#" className="hover:text-paper">
              Security
            </a>
            <a href="#" className="hover:text-paper">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
