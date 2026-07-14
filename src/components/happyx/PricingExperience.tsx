/**
 * HAPPY Enterprise Edition — Pricing Experience v2.0
 * Frontend-only. Enterprise AI Platform pricing + feature catalog.
 * No backend / service / API modifications.
 */
import { useMemo, useState } from "react";
import {
  ArrowRight, Check, Shield, Search, ChevronDown, Sparkle,
  Calendar, Phone, FileText, MessageSquare, Zap,
} from "lucide-react";

type Tier = {
  id: "free" | "starter" | "pro" | "business" | "enterprise";
  name: string;
  price: string;
  period: string;
  copy: string;
  features: string[];
  cta: string;
  featured?: boolean;
  contact?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "free", name: "Free", price: "₹0", period: "Forever",
    copy: "Experience HAPPY end-to-end. No card required.",
    features: [
      "AI Chat", "Basic Digital Human", "Voice Chat",
      "5 Daily AI Requests", "Community", "Basic Notes", "1 GB Memory",
    ],
    cta: "Get Started Free",
  },
  {
    id: "starter", name: "Starter", price: "₹199", period: "/month",
    copy: "For students and individuals.",
    features: [
      "Everything in Free", "Unlimited AI Chat", "Digital Human", "Voice",
      "AI Notes", "Flashcards", "Study Plans", "AI Search", "Whiteboard",
      "Creator Basic", "10 GB Memory",
    ],
    cta: "Start Starter",
  },
  {
    id: "pro", name: "Pro", price: "₹499", period: "/month",
    copy: "For creators, teachers and power users.",
    features: [
      "Everything in Starter", "Advanced Digital Human", "Unlimited Voice",
      "AI Teacher", "AI Professor", "AI Mentor", "AI Tutor", "AI Coach",
      "AI Research", "AI Presentation", "AI Whiteboard", "Knowledge Library",
      "Creator Studio Pro", "Presentation Studio", "Marketing Studio",
      "100 GB Memory", "Priority Support", "API Access",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    id: "business", name: "Business", price: "₹1,499", period: "/month",
    copy: "For companies and teams.",
    features: [
      "Everything in Pro", "Business OS", "CRM", "ERP", "HRMS",
      "Inventory", "Warehouse", "Manufacturing", "Finance", "Projects",
      "Workflow Automation", "Analytics", "Founder Dashboard",
      "Unlimited Team", "Unlimited Workspace", "Business AI Advisor",
      "1 TB Memory", "Business Intelligence",
    ],
    cta: "Start Business",
  },
  {
    id: "enterprise", name: "Enterprise", price: "Custom", period: "Pricing",
    copy: "For multi-brand, regulated and global orgs.",
    features: [
      "Everything in Business", "Unlimited Companies", "Unlimited Brands",
      "Unlimited Users", "Unlimited Storage", "Dedicated Deployment",
      "Dedicated Digital Human", "Dedicated AI Runtime", "Dedicated AI Memory",
      "Dedicated Success Manager", "SSO", "SOC Security", "Compliance",
      "Custom Integrations", "Enterprise SLA", "24×7 Support", "White Label",
      "Unlimited Everything",
    ],
    cta: "Talk To Sales",
    contact: true,
  },
];

/* ─── Feature Comparison Matrix ─── */
type MatrixValue = string; // "—", "✓", or short label
type MatrixRow = { label: string; values: [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue] };
type MatrixCategory = { id: string; name: string; rows: MatrixRow[] };

const cell = (
  free: MatrixValue, starter: MatrixValue, pro: MatrixValue, business: MatrixValue, enterprise: MatrixValue,
): [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue] => [free, starter, pro, business, enterprise];

const MATRIX: MatrixCategory[] = [
  { id: "digital-human", name: "Digital Human", rows: [
    { label: "Digital Human",            values: cell("Basic", "Standard", "Advanced", "Advanced", "Dedicated") },
    { label: "Voice",                    values: cell("Limited", "✓", "Unlimited", "Unlimited", "Unlimited") },
    { label: "Real-time Conversation",   values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Emotion Engine",           values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Presentation Mode",        values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Whiteboard",               values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Streaming",                values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Memory",                   values: cell("1 GB", "10 GB", "100 GB", "1 TB", "Unlimited") },
    { label: "Multi-language",           values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Live Avatar",              values: cell("—", "—", "✓", "✓", "Dedicated") },
  ]},
  { id: "ai", name: "AI", rows: [
    { label: "AI Chat",         values: cell("5/day", "Unlimited", "Unlimited", "Unlimited", "Unlimited") },
    { label: "Reasoning",       values: cell("Basic", "Standard", "Advanced", "Advanced", "Enterprise") },
    { label: "Planning",        values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Decision Engine", values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Research",        values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Search",          values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Knowledge",       values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Context",         values: cell("Short", "Standard", "Extended", "Extended", "Enterprise") },
    { label: "Memory",          values: cell("Session", "Persistent", "Persistent", "Team", "Dedicated") },
    { label: "Reflection",      values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Learning",        values: cell("—", "—", "✓", "✓", "✓") },
  ]},
  { id: "education", name: "Education OS", rows: [
    { label: "Courses",       values: cell("Preview", "✓", "✓", "✓", "✓") },
    { label: "Notes",         values: cell("Basic", "✓", "✓", "✓", "✓") },
    { label: "Flashcards",    values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Study Plans",   values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "AI Teacher",    values: cell("—", "—", "✓", "✓", "✓") },
    { label: "AI Professor",  values: cell("—", "—", "✓", "✓", "✓") },
    { label: "AI Mentor",     values: cell("—", "—", "✓", "✓", "✓") },
    { label: "AI Tutor",      values: cell("—", "—", "✓", "✓", "✓") },
    { label: "AI Coach",      values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Certificates",  values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Analytics",     values: cell("—", "—", "✓", "✓", "✓") },
  ]},
  { id: "creator", name: "Creator OS", rows: [
    { label: "Image Studio",  values: cell("—", "Basic", "Pro", "Pro", "Pro+") },
    { label: "Video",         values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Voice",         values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Presentation",  values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Marketing",     values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Brand Kit",     values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Media Library", values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Projects",      values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Exports",       values: cell("Watermark", "Standard", "HD", "HD", "4K") },
  ]},
  { id: "business", name: "Business OS", rows: [
    { label: "CRM",            values: cell("—", "—", "—", "✓", "✓") },
    { label: "ERP",            values: cell("—", "—", "—", "✓", "✓") },
    { label: "HRMS",           values: cell("—", "—", "—", "✓", "✓") },
    { label: "Inventory",      values: cell("—", "—", "—", "✓", "✓") },
    { label: "Warehouse",      values: cell("—", "—", "—", "✓", "✓") },
    { label: "Manufacturing",  values: cell("—", "—", "—", "✓", "✓") },
    { label: "Finance",        values: cell("—", "—", "—", "✓", "✓") },
    { label: "Projects",       values: cell("—", "—", "—", "✓", "✓") },
    { label: "Analytics",      values: cell("—", "—", "—", "✓", "✓") },
    { label: "Automation",     values: cell("—", "—", "Basic", "✓", "Advanced") },
  ]},
  { id: "community", name: "Community", rows: [
    { label: "Feed",              values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Groups",            values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Messages",          values: cell("Limited", "✓", "✓", "✓", "✓") },
    { label: "Marketplace",       values: cell("Browse", "Sell", "Sell", "Sell", "Sell") },
    { label: "Reviews",           values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Following",         values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Creator Community", values: cell("—", "✓", "✓", "✓", "✓") },
  ]},
  { id: "knowledge", name: "Knowledge", rows: [
    { label: "Knowledge Base",   values: cell("Read", "✓", "✓", "✓", "✓") },
    { label: "Knowledge Search", values: cell("Limited", "✓", "✓", "✓", "✓") },
    { label: "Research",         values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Documents",        values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "References",       values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "AI Knowledge",     values: cell("—", "—", "✓", "✓", "✓") },
  ]},
  { id: "hyperlocal", name: "Hyperlocal", rows: [
    { label: "Businesses", values: cell("Browse", "✓", "✓", "✓", "✓") },
    { label: "Jobs",       values: cell("Browse", "Apply", "Apply", "Post", "Post") },
    { label: "Events",     values: cell("Browse", "RSVP", "RSVP", "Host", "Host") },
    { label: "Alerts",     values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Reviews",    values: cell("Read", "Write", "Write", "Write", "Write") },
    { label: "Maps",       values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Nearby",     values: cell("✓", "✓", "✓", "✓", "✓") },
  ]},
  { id: "enterprise", name: "Enterprise", rows: [
    { label: "Founder Dashboard",   values: cell("—", "—", "—", "✓", "✓") },
    { label: "Enterprise Dashboard",values: cell("—", "—", "—", "✓", "✓") },
    { label: "Control Center",      values: cell("—", "—", "—", "—", "✓") },
    { label: "Audit",               values: cell("—", "—", "—", "✓", "✓") },
    { label: "Security",            values: cell("Standard", "Standard", "Standard", "Advanced", "Enterprise") },
    { label: "Monitoring",          values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Operations",          values: cell("—", "—", "—", "✓", "✓") },
  ]},
  { id: "developer", name: "Developer", rows: [
    { label: "API",              values: cell("—", "—", "✓", "✓", "✓") },
    { label: "SDK",              values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Plugins",          values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Skills",           values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "OAuth",            values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Webhooks",         values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Sandbox",          values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Developer Portal", values: cell("—", "—", "✓", "✓", "✓") },
  ]},
  { id: "security", name: "Security", rows: [
    { label: "Encryption",  values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Audit Logs",  values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Permissions", values: cell("Basic", "Basic", "Advanced", "Advanced", "Enterprise") },
    { label: "RBAC",        values: cell("—", "—", "✓", "✓", "✓") },
    { label: "RLS",         values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Privacy",     values: cell("✓", "✓", "✓", "✓", "✓") },
    { label: "Compliance",  values: cell("—", "—", "—", "✓", "Custom") },
    { label: "Backups",     values: cell("—", "Weekly", "Daily", "Daily", "Real-time") },
  ]},
  { id: "future", name: "Future Included", rows: [
    { label: "AI Agents",              values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Enterprise Brain",       values: cell("—", "—", "—", "✓", "✓") },
    { label: "Automation Runtime",     values: cell("—", "—", "—", "✓", "✓") },
    { label: "Workflow Runtime",       values: cell("—", "—", "—", "✓", "✓") },
    { label: "Enterprise Intelligence",values: cell("—", "—", "—", "✓", "✓") },
    { label: "Plugins",                values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Developer Platform",     values: cell("—", "—", "✓", "✓", "✓") },
    { label: "Skills Marketplace",     values: cell("—", "✓", "✓", "✓", "✓") },
    { label: "Digital Twin Ready",     values: cell("—", "—", "—", "—", "✓") },
    { label: "IoT Ready",              values: cell("—", "—", "—", "—", "✓") },
  ]},
];

const INTEGRATIONS = [
  "Google", "Microsoft", "Slack", "GitHub", "WhatsApp", "Zoom", "Teams",
  "Shopify", "Razorpay", "Stripe", "PayPal", "Zapier", "Notion", "Trello",
  "Asana", "ClickUp",
];

const PAYMENTS = ["UPI", "Cards", "Net Banking", "Wallet", "Stripe", "PayPal", "Razorpay", "GST Invoice"];

const TRUST = [
  { title: "30-Day Refund",     copy: "Full refund, no questions." },
  { title: "Secure Payments",   copy: "PCI-DSS grade encryption." },
  { title: "SOC Ready",         copy: "Enterprise controls & audit." },
  { title: "Privacy",           copy: "You own your data." },
  { title: "Responsible AI",    copy: "Guardrails and transparency." },
  { title: "99.9% Uptime",      copy: "Sovereign, resilient runtime." },
];

const COUNTER = [
  { value: "250+",    label: "Core Modules" },
  { value: "700+",    label: "Enterprise Components" },
  { value: "4,000+",  label: "Subsystems" },
  { value: "20,000+", label: "Capabilities" },
];

const FAQ: Array<{ q: string; a: string }> = [
  { q: "How does the subscription work?", a: "Every plan is billed monthly and renews automatically until you cancel. Upgrade, downgrade or pause any time from your account." },
  { q: "Is there really a free plan?", a: "Yes. Free is truly free, forever. No card required. You get AI Chat, a basic Digital Human, voice, 5 daily AI requests and 1 GB memory." },
  { q: "Do you offer refunds?", a: "Every paid plan is covered by a 30-day money-back guarantee. Email us within 30 days for a full refund." },
  { q: "Can I upgrade later?", a: "Yes. Upgrades apply instantly with a pro-rated charge, so you only pay for what's left of your cycle." },
  { q: "Can I downgrade later?", a: "Yes. Downgrades apply at the end of your current billing cycle — no penalties." },
  { q: "What does Enterprise pricing include?", a: "Enterprise is custom-quoted based on scale, deployment model (cloud, dedicated or on-prem), integrations, SLAs, security tier and support depth." },
  { q: "How do you handle data security?", a: "End-to-end encryption, MFA, RBAC and RLS by default. Enterprise adds SSO, custom security policies, audit exports and data-residency controls." },
  { q: "Do you support SSO?", a: "Yes, on Enterprise. We support SAML, OIDC, Azure AD, Okta, Google Workspace and custom IdPs." },
  { q: "Do you have SOC / ISO / GDPR?", a: "We are SOC-ready with continuous controls. Enterprise gets full compliance packages including SOC 2, ISO 27001 alignment, GDPR and DPDP." },
  { q: "Which payment methods are supported?", a: "UPI, Credit Card, Debit Card, Net Banking, Wallets, Razorpay, Stripe and PayPal. Enterprise supports invoicing, PO and bank transfer." },
  { q: "Is GST included?", a: "Prices are exclusive of GST. A GST-compliant invoice is generated for every payment and available in your billing dashboard." },
  { q: "How do I cancel my subscription?", a: "One click, from your account. You keep access until the end of the paid period. No cancellation fees, ever." },
  { q: "When does my plan renew?", a: "On the same calendar date each month. We send a renewal reminder 3 days in advance." },
  { q: "Do you support annual billing?", a: "Yes. Annual billing is available on Pro, Business and Enterprise with a 2-month discount." },
  { q: "Do you offer discounts for students or NGOs?", a: "Yes. Verified students, teachers and registered non-profits get up to 50% off Starter and Pro." },
  { q: "Can I use HAPPY for my whole team?", a: "Business includes unlimited team members and unlimited workspaces. Enterprise adds unlimited companies and brands." },
  { q: "Do I own my data?", a: "Always. You can export everything at any time and delete it on demand. We never train foundation models on your data." },
  { q: "Do you offer white-label?", a: "Yes, on Enterprise. Full white-label with your brand, domain and dedicated Digital Human." },
  { q: "Can I self-host HAPPY?", a: "Yes, on Enterprise via dedicated deployment — cloud, VPC or on-prem." },
  { q: "How do I talk to sales?", a: "Book a demo, schedule a meeting or request an Enterprise quote from the Enterprise Contact section below." },
];

const CONTACT: Array<{ title: string; copy: string; cta: string; icon: React.ElementType }> = [
  { title: "Book Demo",             copy: "See the full platform in 30 minutes.",    cta: "Book Demo",       icon: Calendar },
  { title: "Talk To Sales",         copy: "Discuss pricing, scale and deployment.",  cta: "Talk To Sales",   icon: Phone },
  { title: "Schedule Meeting",      copy: "Pick a time that works for your team.",   cta: "Schedule",        icon: MessageSquare },
  { title: "Request Enterprise Quote", copy: "Custom-quoted for your organization.",  cta: "Request Quote",   icon: FileText },
];

const tierAccent = (i: number, featured: boolean | undefined) =>
  featured ? "text-gold" : i === 0 ? "text-soft-gray" : "text-paper";

export function PricingExperience() {
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MATRIX.map((c) => [c.id, true])),
  );
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MATRIX;
    return MATRIX
      .map((c) => ({
        ...c,
        rows: c.rows.filter((r) => r.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
      }))
      .filter((c) => c.rows.length > 0);
  }, [query]);

  const toggleCat = (id: string) => setOpenCats((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative border-t border-gold/10 py-24">
      {/* Animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.18),transparent_70%)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-charcoal/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold backdrop-blur">
            <Sparkle className="h-3.5 w-3.5" />
            Pricing Experience v2.0
          </div>
          <h2 id="pricing-heading" className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-paper md:text-6xl">
            Choose the perfect <span className="text-gold">HAPPY</span> plan
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-soft-gray md:text-lg">
            Start free. Upgrade anytime. Scale without limits.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {TIERS.map((t, i) => (
            <article
              key={t.id}
              aria-label={`${t.name} plan`}
              className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 will-change-transform motion-safe:hover:-translate-y-1 focus-within:ring-2 focus-within:ring-gold/40 ${
                t.featured
                  ? "border-gold/60 bg-gradient-to-b from-charcoal via-charcoal to-obsidian shadow-[0_0_60px_-15px_rgba(232,201,106,0.55)] xl:scale-[1.02]"
                  : "border-gold/15 bg-charcoal hover:border-gold/35"
              }`}
            >
              {t.featured && (
                <>
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,201,106,0.18),transparent_60%)]" />
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-full border-x border-b border-gold/50 bg-gold px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-obsidian">
                    Most Popular
                  </div>
                </>
              )}
              <div className="relative flex h-full flex-col">
                <div className={`text-[11px] uppercase tracking-widest ${tierAccent(i, t.featured)}`}>{t.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="numeric font-display text-[36px] font-semibold leading-none text-paper">
                    {t.price}
                  </span>
                  {t.period && <span className="text-[12px] text-soft-gray">{t.period}</span>}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-soft-gray">{t.copy}</p>

                <ul className="mt-5 flex-1 space-y-2 border-t border-gold/10 pt-4">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] leading-snug text-paper">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-gold" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold transition-transform duration-200 motion-safe:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    t.featured
                      ? "bg-gold text-obsidian shadow-[0_0_24px_-4px_rgba(232,201,106,0.7)]"
                      : "border border-gold/25 text-paper hover:bg-gold/10"
                  }`}
                >
                  {t.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Enterprise Feature Counter */}
        <div className="mt-20 grid grid-cols-2 gap-4 rounded-3xl border border-gold/15 bg-charcoal p-8 md:grid-cols-4">
          {COUNTER.map((c) => (
            <div key={c.label} className="text-center">
              <div className="numeric font-display text-3xl font-semibold text-gold md:text-4xl">{c.value}</div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-soft-gray">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mt-24">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Feature comparison matrix</h3>
              <p className="mt-2 text-sm text-soft-gray">Every capability across every plan. Search, expand and collapse categories.</p>
            </div>
            <label className="relative w-full max-w-sm">
              <span className="sr-only">Search features</span>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-gray" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search features…"
                className="w-full rounded-full border border-gold/20 bg-charcoal py-2.5 pl-9 pr-4 text-[13px] text-paper placeholder:text-soft-gray focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </label>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/15 bg-charcoal">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-charcoal">
                <tr className="border-b border-gold/15 text-[11px] uppercase tracking-widest text-soft-gray">
                  <th scope="col" className="px-5 py-4 font-medium">Capability</th>
                  {TIERS.map((t) => (
                    <th key={t.id} scope="col" className={`px-4 py-4 font-medium ${t.featured ? "text-gold" : "text-paper"}`}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-soft-gray">
                      No features match "{query}".
                    </td>
                  </tr>
                )}
                {filtered.map((cat) => {
                  const isOpen = openCats[cat.id] !== false;
                  return (
                    <>
                      <tr key={`h-${cat.id}`} className="sticky bg-obsidian/80 backdrop-blur">
                        <th scope="colgroup" colSpan={6} className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => toggleCat(cat.id)}
                            aria-expanded={isOpen}
                            aria-controls={`cat-${cat.id}`}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                          >
                            <span>{cat.name} <span className="ml-2 font-normal text-soft-gray normal-case tracking-normal">({cat.rows.length})</span></span>
                            <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </th>
                      </tr>
                      {isOpen && cat.rows.map((row, i) => (
                        <tr id={`cat-${cat.id}`} key={`${cat.id}-${row.label}`} className={i % 2 === 0 ? "bg-obsidian/40" : ""}>
                          <th scope="row" className="px-5 py-3 text-[13px] font-normal text-paper">{row.label}</th>
                          {row.values.map((v, idx) => (
                            <td
                              key={idx}
                              className={`px-4 py-3 text-[13px] ${
                                v === "—" ? "text-soft-gray/60" : TIERS[idx].featured ? "text-gold" : "text-paper"
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integrations */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Integrations</h3>
          <p className="mt-2 text-sm text-soft-gray">Works with the tools your team already uses.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {INTEGRATIONS.map((i) => (
              <span
                key={i}
                className="rounded-full border border-gold/20 bg-charcoal px-4 py-2 text-[12.5px] font-medium text-paper transition-colors hover:border-gold/45"
              >
                {i}
              </span>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="mt-16 rounded-2xl border border-gold/15 bg-charcoal p-7">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Payments</div>
              <div className="mt-2 font-display text-xl font-semibold text-paper">Every payment method your customers use.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span key={p} className="rounded-full border border-gold/20 bg-obsidian/60 px-3.5 py-1.5 text-[12px] font-medium text-paper">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="mt-16">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Built on trust</h3>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {TRUST.map((b) => (
              <div key={b.title} className="rounded-2xl border border-gold/15 bg-charcoal p-5 transition-colors hover:border-gold/35">
                <Shield className="h-5 w-5 text-gold" aria-hidden />
                <div className="mt-3 text-[13px] font-semibold text-paper">{b.title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-soft-gray">{b.copy}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Enterprise FAQ</h3>
          <p className="mt-2 text-sm text-soft-gray">Twenty of the most-asked questions from teams evaluating HAPPY.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {FAQ.map((f, i) => {
              const open = !!openFaqs[i];
              return (
                <div key={f.q} className={`rounded-2xl border bg-charcoal p-5 transition-colors ${open ? "border-gold/40" : "border-gold/15"}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqs((s) => ({ ...s, [i]: !s[i] }))}
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                    className="flex w-full cursor-pointer items-start justify-between gap-4 text-left text-[14px] font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                  >
                    <span>{f.q}</span>
                    <ChevronDown aria-hidden className={`mt-0.5 h-4 w-4 flex-none text-gold transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <p id={`faq-${i}`} className="mt-3 text-[13px] leading-relaxed text-soft-gray">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise Contact */}
        <div className="mt-24 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-charcoal via-charcoal to-obsidian p-8 md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Zap className="h-3 w-3" aria-hidden /> Enterprise
              </div>
              <h3 className="mt-4 font-display text-3xl font-semibold text-paper md:text-4xl">
                Ready for the full Enterprise Brain?
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-soft-gray">
                Dedicated Digital Human, dedicated runtime, dedicated memory, SSO, SOC-grade security and a dedicated success manager. Priced for scale.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[520px]">
              {CONTACT.map(({ title, copy, cta, icon: Icon }) => (
                <button
                  key={title}
                  type="button"
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-gold/20 bg-obsidian/60 p-4 text-left transition-all hover:border-gold/50 hover:bg-obsidian/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-[13px] font-semibold text-paper">{title}</span>
                  <span className="text-[11.5px] leading-relaxed text-soft-gray">{copy}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-gold">
                    {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
