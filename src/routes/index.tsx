import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Mic,
  Volume2,
  Cpu,
  BookOpen,
  Users2,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import hpLogoAsset from "@/assets/hp-logo.png.asset.json";
import happyAiLogoAsset from "@/assets/happy-ai-logo.png.asset.json";
import appQrAsset from "@/assets/happyx-app-qr.png.asset.json";
import waQrAsset from "@/assets/happyx-whatsapp-qr.jpg.asset.json";
import { HappyAvatar } from "@/components/digital-human/HappyAvatar";

export const Route = createFileRoute("/")({
  component: HappyXLanding,
});

function HappyXLanding() {
  return (
    <div className="min-h-screen bg-obsidian text-paper overflow-x-hidden">
      <Nav />
      <Hero />
      <TrustBar />
      <Ecosystem />
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
        <a href="#top" className="group flex items-center gap-3">
          <LogoMark size={36} />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-semibold tracking-tight text-paper">
              HAPPY
            </span>
            <span className="text-[9px] uppercase tracking-[0.28em] text-gold/70">
              Human-Centered AI
            </span>
          </div>
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

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full ring-1 ring-gold/40 bg-obsidian overflow-hidden shadow-[0_0_28px_-4px_rgba(212,175,55,0.55)]"
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.35),transparent_65%)]" />
      <img
        src={happyAiLogoAsset.url}
        alt="HAPPY AI"
        width={size}
        height={size}
        className="relative h-full w-full object-contain p-1"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

function CorporateMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full ring-1 ring-gold/25 bg-obsidian overflow-hidden shadow-[0_0_20px_-6px_rgba(212,175,55,0.4)]"
      style={{ width: size, height: size }}
    >
      <img
        src={hpLogoAsset.url}
        alt="HAPPY PERSON PRIVATE LIMITED"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ─────────────────────────  HERO  ─────────────────────────
 * Cinematic executive stage — animated gold light, parallax, particles,
 * and the official HAPPY digital human in the center of the frame.
 */
function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 10,
      y: ((e.clientY - r.top) / r.height - 0.5) * -10,
    });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.4,
        delay: Math.random() * 8,
        dur: 9 + Math.random() * 12,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [],
  );

  return (
    <section id="top" className="relative min-h-[92vh] pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden">
      {/* cinematic ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.16),transparent_60%)] blur-2xl animate-pulse-halo" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,#0b0b0d_78%)]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,201,106,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(232,201,106,0.5) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        {/* moving spotlight */}
        <div className="absolute -bottom-20 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle,rgba(232,201,106,0.14),transparent_70%)] blur-3xl hero-spot" />
        {/* particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-gold hero-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      <div
        ref={stageRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr]"
      >
        <div
          className="relative z-10"
          style={{ transform: `translate3d(${tilt.x * -0.4}px, ${tilt.y * 0.4}px, 0)` }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-charcoal/60 px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="eyebrow !text-[10px]">HAPPY · Online · Enterprise v1.0</span>
          </div>

          <h1 className="mt-8 font-display font-medium tracking-tight text-paper">
            <span className="block text-[64px] leading-none md:text-[104px] text-gradient-gold">
              HAPPY
            </span>
            <span className="mt-4 block text-[13px] uppercase tracking-[0.32em] text-gold/80">
              Human-Centered AI Operating Platform
            </span>
            <span className="mt-6 block text-4xl leading-[1.05] text-paper md:text-5xl">
              Learn.{" "}
              <span className="text-gradient-gold">Build.</span>{" "}
              Manage.{" "}
              <span className="text-gradient-gold">Grow.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-[16px] leading-relaxed text-soft-gray">
            HAPPY is an intelligent Digital Human — one calm presence guiding
            you across education, business, creativity and the enterprise.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              aria-label="Talk to HAPPY"
              className="shimmer-on-hover group inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[14px] font-semibold text-obsidian shadow-[0_0_30px_-4px_rgba(232,201,106,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_44px_-4px_rgba(232,201,106,0.8)]"
            >
              Talk to HAPPY
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              aria-label="Watch demo"
              className="group inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-charcoal/40 px-6 py-3.5 text-[14px] font-medium text-paper backdrop-blur transition-all duration-300 hover:border-gold/50 hover:bg-charcoal/70"
            >
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40 transition-transform group-hover:scale-110">
                <Play className="h-3 w-3 fill-gold text-gold" />
              </span>
              Watch Demo
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


        <HeroStage tilt={tilt} />
      </div>

      <style>{`
        @keyframes hero-spot { 0%,100% { transform: translate(-50%,0) scale(1) } 50% { transform: translate(-50%,-14px) scale(1.05) } }
        .hero-spot { animation: hero-spot 10s ease-in-out infinite; }
        @keyframes hero-particle { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: var(--o,0.3) } 100% { transform: translateY(-140px); opacity: 0 } }
        .hero-particle { animation-name: hero-particle; animation-timing-function: ease-out; animation-iteration-count: infinite; box-shadow: 0 0 8px rgba(232,201,106,0.6); }
        @media (prefers-reduced-motion: reduce) { .hero-spot, .hero-particle { animation: none !important } }
      `}</style>
    </section>
  );
}

function HeroStage({ tilt }: { tilt: { x: number; y: number } }) {
  return (
    <div className="relative mx-auto w-full max-w-[480px] px-4 md:px-8">
      <div
        className="relative aspect-[4/5] w-full [perspective:1400px]"
        style={{ transform: `translate3d(${tilt.x * 0.6}px, ${tilt.y * -0.6}px, 0)` }}
      >
        {/* glass stage plate */}
        <div className="absolute inset-0 rounded-[2.25rem] glass-luxe" />
        {/* soft floor shadow — cinematic depth beneath the portrait */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-full bg-black/70 blur-2xl opacity-70"
        />
        {/* diagonal sheen sweep — reads as light traveling across glass */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.25rem] overflow-hidden">
          <span className="hero-sheen absolute -inset-y-8 -left-1/3 w-1/3 rotate-[18deg] bg-gradient-to-r from-transparent via-gold/20 to-transparent blur-md" />
        </div>
        <div
          className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-500 ease-out"
          style={{ transform: `rotateY(${tilt.x * 0.6}deg) rotateX(${tilt.y * 0.6}deg)` }}
        >
          <div className="absolute inset-6 rounded-[1.85rem] overflow-hidden ring-1 ring-gold/25 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] bg-obsidian">

            <HappyAvatar
              variant="portrait"
              size={440}
              activity="listening"
              expression="smile"
              trackCursor
              className="!w-full !h-full"
            />

            {/* live status — top-left */}
            <div className="absolute left-4 top-4 rounded-2xl border border-emerald-400/25 bg-obsidian/75 px-3 py-2 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-semibold tracking-wide text-paper">HAPPY</span>
                <span className="text-[10px] uppercase tracking-widest text-emerald-300">Online</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] uppercase tracking-widest text-soft-gray">
                <span>Enterprise v1.0</span>
                <span className="text-gold/80">Memory Active</span>
                <span>Fast Response</span>
              </div>
            </div>

            {/* signature panel */}
            <div className="absolute inset-x-4 bottom-4">
              <div className="glass-luxe rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-gold">Digital Human</div>
                    <div className="mt-0.5 font-display text-sm font-medium text-paper">HAPPY · Executive Presence</div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-soft-gray">
                    <span className="inline-flex items-center gap-1"><Volume2 className="h-3 w-3 text-gold" />&lt;100ms</span>
                    <span className="numeric">v4.0</span>
                  </div>
                </div>
                {/* live waveform */}
                <div className="mt-3 flex items-end gap-[3px] h-6">
                  {Array.from({ length: 34 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-gold-deep to-gold hero-wave"
                      style={{ animationDelay: `${(i % 12) * 60}ms`, height: `${20 + ((i * 17) % 70)}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hero-wave { 0%,100% { transform: scaleY(0.4) } 50% { transform: scaleY(1.1) } }
        .hero-wave { animation: hero-wave 1.1s ease-in-out infinite; transform-origin: bottom; }
        @keyframes hero-sheen { 0% { transform: translateX(0) rotate(18deg); opacity: 0 } 15% { opacity: 0.9 } 60% { transform: translateX(520%) rotate(18deg); opacity: 0 } 100% { transform: translateX(520%) rotate(18deg); opacity: 0 } }
        .hero-sheen { animation: hero-sheen 7.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hero-wave, .hero-sheen { animation: none !important; } }
      `}</style>

    </div>
  );
}


/* ─────────────────────  ECOSYSTEM DIAGRAM  ───────────────────── */
function Ecosystem() {
  const nodes: { id: string; label: string; icon: React.ElementType; ring: number; angle: number }[] = [
    { id: "digital", label: "Digital Human", icon: Sparkle, ring: 1, angle: -90 },
    { id: "biz", label: "Business OS", icon: Building2, ring: 2, angle: -50 },
    { id: "edu", label: "Education OS", icon: GraduationCap, ring: 2, angle: -10 },
    { id: "creator", label: "Creator OS", icon: Wand2, ring: 2, angle: 30 },
    { id: "know", label: "Knowledge OS", icon: BookOpen, ring: 2, angle: 70 },
    { id: "comm", label: "Community", icon: Users2, ring: 2, angle: 110 },
    { id: "mkt", label: "Marketplace", icon: ShoppingBag, ring: 2, angle: 150 },
    { id: "hyper", label: "Hyperlocal", icon: MapPin, ring: 2, angle: 190 },
    { id: "ent", label: "Enterprise", icon: Landmark, ring: 2, angle: 230 },
  ];
  return (
    <section className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="The HAPPY Ecosystem"
          title="One kernel. One digital human. Every domain."
          copy="Every module of HAPPY orbits a single sovereign AI kernel — no silos, no duplication, no lock-in."
        />

        <div className="relative mx-auto mt-16 aspect-square w-full max-w-[720px]">
          {/* rings */}
          <div className="absolute inset-0 rounded-full border border-gold/10" />
          <div className="absolute inset-[14%] rounded-full border border-gold/15" />
          <div className="absolute inset-[30%] rounded-full border border-gold/20 eco-ring" />

          {/* halo */}
          <div className="absolute inset-1/4 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.35),transparent_70%)] blur-2xl animate-pulse-halo" />

          {/* orbit lines */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none">
            {nodes.map((n) => {
              const rad = (n.angle * Math.PI) / 180;
              const r = 42;
              const x = 50 + r * Math.cos(rad);
              const y = 50 + r * Math.sin(rad);
              return (
                <line key={n.id} x1="50" y1="50" x2={x} y2={y} stroke="url(#lg)" strokeWidth="0.15" strokeDasharray="0.6 0.8" />
              );
            })}
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(212,175,55,0.6)" />
                <stop offset="1" stopColor="rgba(212,175,55,0.05)" />
              </linearGradient>
            </defs>
          </svg>

          {/* center: HAPPY kernel */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <HappyAvatar size={150} activity="listening" expression="smile" />
            <div className="mt-4 flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-[0.28em] text-gold">HAPPY Kernel</div>
              <div className="mt-1 font-display text-base text-paper">AI Gateway</div>
            </div>
          </div>

          {/* nodes */}
          {nodes.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const r = 42;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            return (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${x}%`, top: `${y}%`, animation: `eco-in 700ms ease-out ${i * 60}ms both` }}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-charcoal/90 backdrop-blur transition-all duration-300 group-hover:border-gold group-hover:scale-110">
                    <n.icon className="h-5 w-5 text-gold" />
                    <span className="absolute inset-0 rounded-full ring-1 ring-gold/0 group-hover:ring-gold/40" />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray group-hover:text-paper">
                    {n.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes eco-ring { 0%,100% { transform: scale(1); opacity: .55 } 50% { transform: scale(1.02); opacity: .85 } }
          .eco-ring { animation: eco-ring 6s ease-in-out infinite; }
          @keyframes eco-in { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.6) } 100% { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
          @media (prefers-reduced-motion: reduce) { .eco-ring { animation: none !important } }
        `}</style>
      </div>
    </section>
  );
}


/* ─────────────────────────  TRUST BAR  ───────────────────────── */
function TrustBar() {
  const items = [
    "Enterprise Security",
    "Responsible AI",
    "Privacy First",
    "Digital Human",
    "Multi-Tenant Platform",
    "Fast & Secure",
  ];
  return (
    <section className="border-y border-gold/10 bg-charcoal/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8">
        {items.map((i) => (
          <span
            key={i}
            className="text-[11px] uppercase tracking-[0.3em] text-soft-gray transition-colors duration-300 hover:text-gold"
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

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.35fr]">
          {/* persona side — official Digital Human */}
          <div className="relative overflow-hidden rounded-3xl border border-gold/15 bg-charcoal p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.18),transparent_60%)]" />
            <div className="relative flex flex-col items-center">
              <HappyAvatar size={220} variant="portrait" activity="speaking" expression="explain" />
              <div className="mt-5 text-center">
                <p className="eyebrow">Digital Human</p>
                <h3 className="mt-2 font-display text-xl text-paper">HAPPY · Chief of Staff</h3>
                <p className="mt-2 text-xs leading-relaxed text-soft-gray">
                  Calm. Precise. Loyal. 40+ languages. Remembers what matters.
                </p>
              </div>
              <div className="mt-5 w-full space-y-2.5 text-[11px]">
                {[
                  ["Status", <span key="s" className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="text-paper">Online</span></span>],
                  ["Mode", <span key="m" className="text-paper">Chief of Staff</span>],
                  ["Latency", <span key="l" className="numeric text-paper">92 ms</span>],
                  ["Memory", <span key="me" className="text-paper">Sovereign · Encrypted</span>],
                  ["Version", <span key="v" className="numeric text-paper">v4.0</span>],
                ].map(([k, v], i) => (
                  <div key={i} className="flex items-center justify-between border-t border-gold/10 pt-2 uppercase tracking-widest text-soft-gray">
                    <span>{k}</span>
                    <span className="normal-case tracking-normal">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* transcript */}
          <div className="rounded-3xl border border-gold/15 bg-charcoal p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] uppercase tracking-widest text-soft-gray">
                  Session · Secure
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-soft-gray">
                <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3 text-gold" /> gpt-5.5</span>
                <span className="numeric">14:02 IST</span>
              </div>
            </div>

            <div className="space-y-5">
              <ChatBubble who="you" text="Draft a Q3 strategy brief for the Mumbai team. Emphasize margins." />
              <ChatBubble
                who="ai"
                text="Understood. Reviewing last quarter's cohort data, margin drift by SKU, and Mumbai HR capacity. I'll prepare a two-page brief with three scenarios. Shall I include the manufacturing yield forecast from Business OS?"
              />
              <ChatBubble who="you" text="Yes, and route it to Priya for review." />

              {/* rich card — knowledge/business */}
              <div className="ml-11 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <RichCard tag="Business" title="Q3 Margin Brief" meta="12 pages · 3 scenarios" icon={Building2} />
                <RichCard tag="Knowledge" title="Mumbai HR Snapshot" meta="Sources · 4 · verified" icon={BookOpen} />
              </div>

              {/* thinking / typing */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 flex-none overflow-hidden rounded-full ring-1 ring-gold/30">
                  <HappyAvatar size={32} activity="listening" expression="thinking" />
                </div>
                <div className="glass-luxe rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                    <Sparkle className="h-3 w-3" /> Thinking
                    <span className="ml-1 inline-flex gap-1">
                      <i className="h-1.5 w-1.5 rounded-full bg-gold typing-dot" />
                      <i className="h-1.5 w-1.5 rounded-full bg-gold typing-dot" style={{ animationDelay: "160ms" }} />
                      <i className="h-1.5 w-1.5 rounded-full bg-gold typing-dot" style={{ animationDelay: "320ms" }} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-soft-gray">
                    Synthesizing across Business OS, Analytics, and CRM · routing approval to Priya.
                  </p>
                </div>
              </div>

              {/* suggested follow-ups */}
              <div className="ml-11 flex flex-wrap gap-2">
                {["Add supplier risk view", "Show Q3 vs Q2 delta", "Draft email to Priya"].map((s) => (
                  <button
                    key={s}
                    className="rounded-full border border-gold/25 bg-obsidian/50 px-3 py-1.5 text-[11px] text-paper transition-colors hover:border-gold/50 hover:bg-gold/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-gold/15 bg-obsidian/60 p-2.5">
              <button aria-label="Voice input" className="grid h-9 w-9 place-items-center rounded-xl border border-gold/20 text-gold transition-colors hover:bg-gold/10">
                <Mic className="h-4 w-4" />
              </button>
              <div className="flex-1 truncate px-2 text-sm text-soft-gray">
                Ask HAPPY anything…
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-obsidian transition-transform hover:scale-[1.03]">
                Send
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typing-dot { 0%,80%,100% { transform: scale(0.7); opacity: .4 } 40% { transform: scale(1.2); opacity: 1 } }
        .typing-dot { display: inline-block; animation: typing-dot 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .typing-dot { animation: none !important } }
      `}</style>
    </section>
  );
}

function RichCard({
  tag,
  title,
  meta,
  icon: Icon,
}: {
  tag: string;
  title: string;
  meta: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group rounded-xl border border-gold/15 bg-obsidian/60 p-3 transition-colors hover:border-gold/40">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-gold/25 bg-charcoal">
          <Icon className="h-3.5 w-3.5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.2em] text-gold">{tag}</div>
          <div className="truncate text-sm font-medium text-paper">{title}</div>
          <div className="mt-0.5 text-[11px] text-soft-gray">{meta}</div>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-soft-gray transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
      </div>
    </div>
  );
}

function ChatBubble({ who, text }: { who: "you" | "ai"; text: string }) {
  if (who === "you") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gold px-4 py-3 text-sm font-medium text-obsidian shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)]">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 flex-none overflow-hidden rounded-full ring-1 ring-gold/30">
        <HappyAvatar size={32} activity="speaking" expression="explain" />
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
                t: "HAPPY",
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

/* ─────────────────────  PRICING (v2.0 Experience)  ───────────────────── */
// Full pricing UI lives in a dedicated module for clarity + code-splitting.
// Backend, services, APIs and business logic are unchanged.
import { PricingExperience } from "@/components/happyx/PricingExperience";
import { PricingExperienceV5 } from "@/components/happyx/PricingExperienceV5";
import { PricingExperienceV6 } from "@/components/happyx/PricingExperienceV6";
function Pricing() { return (<><PricingExperience /><PricingExperienceV5 /><PricingExperienceV6 /></>); }



/* ─────────────────────  DOWNLOAD APP  ───────────────────── */
function DownloadApp() {
  return (
    <section className="relative border-t border-gold/10 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-gold/20 bg-charcoal p-10 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.15),transparent_60%)]" />
          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Download HAPPY</p>
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <QrCard
        title="Download HAPPY App"
        subtitle="Scan · iOS & Android"
        src={appQrAsset.url}
        alt="Scan to download the HAPPY mobile app"
      />
      <QrCard
        title="Chat on WhatsApp"
        subtitle="Talk to HAPPY instantly"
        src={waQrAsset.url}
        alt="Scan to chat with HAPPY on WhatsApp"
        variant="light"
      />
    </div>
  );
}

function QrCard({
  title,
  subtitle,
  src,
  alt,
  variant = "dark",
}: {
  title: string;
  subtitle: string;
  src: string;
  alt: string;
  variant?: "dark" | "light";
}) {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gold/15 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-90" />
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-charcoal p-5 shadow-luxe transition-transform duration-500 group-hover:-translate-y-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">
              {subtitle}
            </div>
            <div className="mt-1 font-display text-base font-semibold text-paper">
              {title}
            </div>
          </div>
          <LogoMark size={28} />
        </div>
        <div
          className={`relative overflow-hidden rounded-2xl p-3 ${
            variant === "light" ? "bg-paper" : "bg-obsidian"
          }`}
        >
          <img
            src={src}
            alt={alt}
            width={640}
            height={640}
            className="mx-auto block h-auto w-full max-w-[240px] object-contain"
            loading="lazy"
            decoding="async"
          />
          {/* scan sweep */}
          <div className="pointer-events-none absolute inset-x-3 top-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 shadow-[0_0_18px_2px_rgba(212,175,55,0.6)] transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[qrscan_2.2s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>{`
        @keyframes qrscan {
          0% { transform: translateY(0); }
          50% { transform: translateY(220px); }
          100% { transform: translateY(0); }
        }
      `}</style>
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
        "Education OS",
        "Business OS",
        "Creator Studio",
        "Knowledge OS",
        "Hyperlocal OS",
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
        "Compliance",
      ],
    },
    {
      t: "Community",
      items: ["Community", "Marketplace", "Agents", "Templates", "Plugins", "Hall of Success"],
    },
    {
      t: "Developers",
      items: ["Documentation", "API Reference", "SDKs", "Changelog", "Status", "Roadmap"],
    },
    {
      t: "Company",
      items: ["About", "Founder", "Brands", "Careers", "Press", "Contact"],
    },
  ];

  const legal = [
    ["Privacy", "#"],
    ["Terms", "#"],
    ["Security", "#"],
    ["Cookies", "#"],
    ["Accessibility", "#"],
    ["Responsible AI", "#"],
    ["Status", "#"],
  ];

  return (
    <footer className="relative border-t border-gold/10 bg-charcoal">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline-gold" />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-7">
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <CorporateMark size={44} />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm font-semibold text-paper">
                  HAPPY PERSON <span className="text-gradient-gold">PVT LTD</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-gold/70">
                  Parent Company · Maker of HAPPY AI
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-soft-gray">
              The sovereign, human-centered AI operating platform. By HAPPY
              PERSON PRIVATE LIMITED.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-widest text-soft-gray">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </div>
            <div className="mt-3 text-[11px] uppercase tracking-widest text-soft-gray">
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
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-soft-gray">
            {legal.map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-paper">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
