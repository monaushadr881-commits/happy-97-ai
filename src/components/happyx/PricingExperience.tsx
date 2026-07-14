/**
 * HAPPY Enterprise Edition — Pricing Experience v3.0 Ultimate
 * Frontend-only. Enterprise AI Ecosystem showcase.
 * No backend / service / API modifications.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Check, Shield, Search, ChevronDown, Sparkle, Calendar, Phone,
  FileText, MessageSquare, Zap, Printer, Download, GraduationCap, Building2,
  Factory, Hospital, Landmark, Code2, Palette, Users, Stethoscope, Bot,
  Mic, Presentation, PenTool, Rocket, TrendingUp, Globe, Cpu, Database,
  Layers, Sparkles, ArrowRightLeft, PlayCircle,
} from "lucide-react";

/* ─────────────────────────── Tiers ─────────────────────────── */
type Tier = {
  id: "free" | "starter" | "pro" | "business" | "enterprise";
  name: string;
  monthly: number; // ₹ per month
  copy: string;
  features: string[];
  cta: string;
  featured?: boolean;
  contact?: boolean;
};

const TIERS: Tier[] = [
  { id: "free",       name: "Free",       monthly: 0,    copy: "Experience HAPPY end-to-end. No card required.",
    features: ["AI Chat", "Basic Digital Human", "Voice Chat", "5 Daily AI Requests", "Community", "Basic Notes", "1 GB Memory"], cta: "Get Started Free" },
  { id: "starter",    name: "Starter",    monthly: 199,  copy: "For students and individuals.",
    features: ["Everything in Free", "Unlimited AI Chat", "Digital Human", "Voice", "AI Notes", "Flashcards", "Study Plans", "AI Search", "Whiteboard", "10 GB Memory"], cta: "Start Starter" },
  { id: "pro",        name: "Pro",        monthly: 499,  copy: "For creators, teachers and power users.",
    features: ["Everything in Starter", "Advanced Digital Human", "Unlimited Voice", "AI Teacher / Professor / Mentor", "AI Research", "AI Presentation", "Knowledge Library", "Creator Studio Pro", "100 GB Memory", "API Access"], cta: "Go Pro", featured: true },
  { id: "business",   name: "Business",   monthly: 1499, copy: "For companies and teams.",
    features: ["Everything in Pro", "Business OS", "CRM · ERP · HRMS", "Inventory · Warehouse · Manufacturing", "Finance · Projects", "Workflow Automation", "Analytics", "Unlimited Team", "1 TB Memory"], cta: "Start Business" },
  { id: "enterprise", name: "Enterprise", monthly: -1,   copy: "For multi-brand, regulated and global orgs.",
    features: ["Everything in Business", "Unlimited Companies · Brands · Users", "Dedicated Digital Human · Runtime · Memory", "SSO · SOC · Compliance", "Custom Integrations", "Enterprise SLA · 24×7", "White Label", "Unlimited Everything"], cta: "Talk To Sales", contact: true },
];

type Cycle = "monthly" | "yearly" | "lifetime";
const cyclePrice = (t: Tier, c: Cycle): { primary: string; secondary?: string } => {
  if (t.monthly < 0) return { primary: "Custom", secondary: "Pricing" };
  if (t.monthly === 0) return { primary: "₹0", secondary: "Forever" };
  if (c === "monthly")  return { primary: `₹${t.monthly.toLocaleString("en-IN")}`, secondary: "/month" };
  if (c === "yearly")   return { primary: `₹${Math.round(t.monthly * 12 * 0.8).toLocaleString("en-IN")}`, secondary: "/year · save 20%" };
  return { primary: `₹${(t.monthly * 24).toLocaleString("en-IN")}`, secondary: "Lifetime · soon" };
};

/* ────────────────────── Feature Matrix (200+) ────────────────────── */
type MatrixValue = string;
type MatrixRow = { label: string; values: [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue] };
type MatrixCategory = { id: string; name: string; rows: MatrixRow[] };

const cell = (a: MatrixValue, b: MatrixValue, c: MatrixValue, d: MatrixValue, e: MatrixValue): MatrixRow["values"] => [a, b, c, d, e];
const r = (label: string, a: MatrixValue, b: MatrixValue, c: MatrixValue, d: MatrixValue, e: MatrixValue): MatrixRow => ({ label, values: cell(a, b, c, d, e) });

const MATRIX: MatrixCategory[] = [
  { id: "digital-human", name: "Digital Human", rows: [
    r("Digital Human", "Basic", "Standard", "Advanced", "Advanced", "Dedicated"),
    r("Voice", "Limited", "✓", "Unlimited", "Unlimited", "Unlimited"),
    r("Real-time Conversation", "—", "✓", "✓", "✓", "✓"),
    r("Emotion Engine", "—", "—", "✓", "✓", "✓"),
    r("Presentation Mode", "—", "—", "✓", "✓", "✓"),
    r("Whiteboard", "—", "✓", "✓", "✓", "✓"),
    r("Streaming", "—", "—", "✓", "✓", "✓"),
    r("Memory Capacity", "1 GB", "10 GB", "100 GB", "1 TB", "Unlimited"),
    r("Multi-language", "—", "✓", "✓", "✓", "✓"),
    r("Live Avatar", "—", "—", "✓", "✓", "Dedicated"),
    r("Custom Persona", "—", "—", "✓", "✓", "Dedicated"),
    r("Lip Sync", "—", "—", "✓", "✓", "✓"),
    r("Gesture Engine", "—", "—", "✓", "✓", "✓"),
    r("Camera Awareness", "—", "—", "—", "✓", "✓"),
    r("Screen Share", "—", "—", "✓", "✓", "✓"),
  ]},
  { id: "ai", name: "AI Runtime", rows: [
    r("AI Chat", "5/day", "Unlimited", "Unlimited", "Unlimited", "Unlimited"),
    r("Reasoning", "Basic", "Standard", "Advanced", "Advanced", "Enterprise"),
    r("Planning", "—", "✓", "✓", "✓", "✓"),
    r("Decision Engine", "—", "—", "✓", "✓", "✓"),
    r("Research", "—", "—", "✓", "✓", "✓"),
    r("Search", "—", "✓", "✓", "✓", "✓"),
    r("Knowledge", "—", "✓", "✓", "✓", "✓"),
    r("Context Length", "Short", "Standard", "Extended", "Extended", "Enterprise"),
    r("Memory", "Session", "Persistent", "Persistent", "Team", "Dedicated"),
    r("Reflection", "—", "—", "✓", "✓", "✓"),
    r("Learning", "—", "—", "✓", "✓", "✓"),
    r("Multi-Agent", "—", "—", "—", "✓", "✓"),
    r("Tool Use", "—", "✓", "✓", "✓", "✓"),
    r("Vision", "—", "✓", "✓", "✓", "✓"),
    r("Speech-to-Speech", "—", "—", "✓", "✓", "✓"),
    r("Autonomous Runtime", "—", "—", "—", "✓", "✓"),
    r("Enterprise Brain", "—", "—", "—", "✓", "✓"),
  ]},
  { id: "education", name: "Education OS", rows: [
    r("Courses", "Preview", "✓", "✓", "✓", "✓"),
    r("Notes", "Basic", "✓", "✓", "✓", "✓"),
    r("Flashcards", "—", "✓", "✓", "✓", "✓"),
    r("Study Plans", "—", "✓", "✓", "✓", "✓"),
    r("AI Teacher", "—", "—", "✓", "✓", "✓"),
    r("AI Professor", "—", "—", "✓", "✓", "✓"),
    r("AI Mentor", "—", "—", "✓", "✓", "✓"),
    r("AI Tutor", "—", "—", "✓", "✓", "✓"),
    r("AI Coach", "—", "—", "✓", "✓", "✓"),
    r("Certificates", "—", "—", "✓", "✓", "✓"),
    r("Analytics", "—", "—", "✓", "✓", "✓"),
    r("Assessments", "—", "✓", "✓", "✓", "✓"),
    r("Live Classes", "—", "—", "✓", "✓", "✓"),
    r("Homework Helper", "—", "✓", "✓", "✓", "✓"),
  ]},
  { id: "creator", name: "Creator OS", rows: [
    r("Image Studio", "—", "Basic", "Pro", "Pro", "Pro+"),
    r("Video Studio", "—", "—", "✓", "✓", "✓"),
    r("Voice Studio", "—", "✓", "✓", "✓", "✓"),
    r("Presentation Studio", "—", "—", "✓", "✓", "✓"),
    r("Marketing Studio", "—", "—", "✓", "✓", "✓"),
    r("Brand Kit", "—", "—", "✓", "✓", "✓"),
    r("Media Library", "—", "✓", "✓", "✓", "✓"),
    r("Projects", "—", "✓", "✓", "✓", "✓"),
    r("Exports", "Watermark", "Standard", "HD", "HD", "4K"),
    r("AI Editing", "—", "—", "✓", "✓", "✓"),
    r("Motion Graphics", "—", "—", "✓", "✓", "✓"),
  ]},
  { id: "business", name: "Business OS", rows: [
    r("CRM", "—", "—", "—", "✓", "✓"),
    r("ERP", "—", "—", "—", "✓", "✓"),
    r("HRMS", "—", "—", "—", "✓", "✓"),
    r("Inventory", "—", "—", "—", "✓", "✓"),
    r("Warehouse", "—", "—", "—", "✓", "✓"),
    r("Manufacturing", "—", "—", "—", "✓", "✓"),
    r("Finance", "—", "—", "—", "✓", "✓"),
    r("Projects", "—", "—", "—", "✓", "✓"),
    r("Analytics", "—", "—", "—", "✓", "✓"),
    r("Automation", "—", "—", "Basic", "✓", "Advanced"),
    r("Founder Dashboard", "—", "—", "—", "✓", "✓"),
    r("Business AI Advisor", "—", "—", "—", "✓", "✓"),
    r("Payroll", "—", "—", "—", "✓", "✓"),
    r("Invoicing", "—", "—", "✓", "✓", "✓"),
    r("GST / Tax", "—", "—", "✓", "✓", "✓"),
  ]},
  { id: "community", name: "Community", rows: [
    r("Feed", "✓", "✓", "✓", "✓", "✓"),
    r("Groups", "✓", "✓", "✓", "✓", "✓"),
    r("Messages", "Limited", "✓", "✓", "✓", "✓"),
    r("Marketplace", "Browse", "Sell", "Sell", "Sell", "Sell"),
    r("Reviews", "✓", "✓", "✓", "✓", "✓"),
    r("Following", "✓", "✓", "✓", "✓", "✓"),
    r("Creator Community", "—", "✓", "✓", "✓", "✓"),
    r("Events", "Browse", "RSVP", "Host", "Host", "Host"),
    r("Live Rooms", "—", "—", "✓", "✓", "✓"),
  ]},
  { id: "knowledge", name: "Knowledge", rows: [
    r("Knowledge Base", "Read", "✓", "✓", "✓", "✓"),
    r("Knowledge Search", "Limited", "✓", "✓", "✓", "✓"),
    r("Research", "—", "—", "✓", "✓", "✓"),
    r("Documents", "—", "✓", "✓", "✓", "✓"),
    r("References", "—", "✓", "✓", "✓", "✓"),
    r("AI Knowledge", "—", "—", "✓", "✓", "✓"),
    r("Citations", "—", "✓", "✓", "✓", "✓"),
    r("PDF Analysis", "—", "✓", "✓", "✓", "✓"),
  ]},
  { id: "hyperlocal", name: "Hyperlocal", rows: [
    r("Businesses", "Browse", "✓", "✓", "✓", "✓"),
    r("Jobs", "Browse", "Apply", "Apply", "Post", "Post"),
    r("Events", "Browse", "RSVP", "RSVP", "Host", "Host"),
    r("Alerts", "—", "✓", "✓", "✓", "✓"),
    r("Reviews", "Read", "Write", "Write", "Write", "Write"),
    r("Maps", "✓", "✓", "✓", "✓", "✓"),
    r("Nearby", "✓", "✓", "✓", "✓", "✓"),
    r("Local Ads", "—", "—", "✓", "✓", "✓"),
  ]},
  { id: "enterprise", name: "Enterprise", rows: [
    r("Founder Dashboard", "—", "—", "—", "✓", "✓"),
    r("Enterprise Dashboard", "—", "—", "—", "✓", "✓"),
    r("Control Center", "—", "—", "—", "—", "✓"),
    r("Audit", "—", "—", "—", "✓", "✓"),
    r("Security", "Standard", "Standard", "Standard", "Advanced", "Enterprise"),
    r("Monitoring", "—", "—", "✓", "✓", "✓"),
    r("Operations", "—", "—", "—", "✓", "✓"),
    r("Multi-tenant", "—", "—", "—", "✓", "✓"),
    r("Data Residency", "—", "—", "—", "—", "✓"),
    r("On-Prem / VPC", "—", "—", "—", "—", "✓"),
  ]},
  { id: "developer", name: "Developer", rows: [
    r("API", "—", "—", "✓", "✓", "✓"),
    r("SDK", "—", "—", "✓", "✓", "✓"),
    r("Plugins", "—", "—", "✓", "✓", "✓"),
    r("Skills", "—", "✓", "✓", "✓", "✓"),
    r("OAuth", "—", "—", "✓", "✓", "✓"),
    r("Webhooks", "—", "—", "✓", "✓", "✓"),
    r("Sandbox", "—", "—", "✓", "✓", "✓"),
    r("Developer Portal", "—", "—", "✓", "✓", "✓"),
    r("CLI", "—", "—", "✓", "✓", "✓"),
    r("Rate Limits", "Low", "Standard", "High", "High", "Custom"),
  ]},
  { id: "security", name: "Security", rows: [
    r("Encryption", "✓", "✓", "✓", "✓", "✓"),
    r("Audit Logs", "—", "—", "✓", "✓", "✓"),
    r("Permissions", "Basic", "Basic", "Advanced", "Advanced", "Enterprise"),
    r("RBAC", "—", "—", "✓", "✓", "✓"),
    r("RLS", "✓", "✓", "✓", "✓", "✓"),
    r("Privacy", "✓", "✓", "✓", "✓", "✓"),
    r("Compliance", "—", "—", "—", "✓", "Custom"),
    r("Backups", "—", "Weekly", "Daily", "Daily", "Real-time"),
    r("SSO / SAML", "—", "—", "—", "—", "✓"),
    r("MFA", "✓", "✓", "✓", "✓", "✓"),
    r("IP Allowlist", "—", "—", "—", "✓", "✓"),
  ]},
  { id: "support", name: "Support", rows: [
    r("Community", "✓", "✓", "✓", "✓", "✓"),
    r("Email", "—", "✓", "✓", "✓", "✓"),
    r("Chat", "—", "—", "✓", "✓", "✓"),
    r("Priority", "—", "—", "✓", "✓", "✓"),
    r("Phone", "—", "—", "—", "✓", "✓"),
    r("Dedicated CSM", "—", "—", "—", "—", "✓"),
    r("SLA", "—", "—", "—", "99.5%", "99.9%"),
    r("Onboarding", "Self", "Self", "Guided", "Guided", "White-Glove"),
  ]},
  { id: "future", name: "Future Included", rows: [
    r("AI Agents", "—", "—", "✓", "✓", "✓"),
    r("Enterprise Brain", "—", "—", "—", "✓", "✓"),
    r("Automation Runtime", "—", "—", "—", "✓", "✓"),
    r("Workflow Runtime", "—", "—", "—", "✓", "✓"),
    r("Enterprise Intelligence", "—", "—", "—", "✓", "✓"),
    r("Plugins Marketplace", "—", "—", "✓", "✓", "✓"),
    r("Developer Platform", "—", "—", "✓", "✓", "✓"),
    r("Skills Marketplace", "—", "✓", "✓", "✓", "✓"),
    r("Digital Twin Ready", "—", "—", "—", "—", "✓"),
    r("IoT Ready", "—", "—", "—", "—", "✓"),
    r("Robotics Ready", "—", "—", "—", "—", "✓"),
    r("AR/VR Ready", "—", "—", "—", "—", "✓"),
  ]},
  { id: "integrations", name: "Integrations", rows: [
    r("Google Workspace", "—", "✓", "✓", "✓", "✓"),
    r("Microsoft 365", "—", "✓", "✓", "✓", "✓"),
    r("Slack", "—", "—", "✓", "✓", "✓"),
    r("Teams", "—", "—", "✓", "✓", "✓"),
    r("WhatsApp", "—", "✓", "✓", "✓", "✓"),
    r("Zoom", "—", "—", "✓", "✓", "✓"),
    r("Shopify", "—", "—", "—", "✓", "✓"),
    r("Notion", "—", "✓", "✓", "✓", "✓"),
    r("GitHub", "—", "—", "✓", "✓", "✓"),
    r("Zapier", "—", "—", "✓", "✓", "✓"),
    r("Custom Integrations", "—", "—", "—", "—", "✓"),
  ]},
];

const TOTAL_ROWS = MATRIX.reduce((n, c) => n + c.rows.length, 0);

/* ─────────────────── Static content ─────────────────── */
const INTEGRATIONS = ["Google", "Microsoft", "Slack", "GitHub", "WhatsApp", "Zoom", "Teams", "Shopify", "Razorpay", "Stripe", "PayPal", "Zapier", "Notion", "Trello", "Asana", "ClickUp"];
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

const USE_CASES: Array<{ icon: React.ElementType; name: string; copy: string; plan: string }> = [
  { icon: GraduationCap, name: "Students",   copy: "AI Tutor, notes, flashcards, study plans, exam prep.",            plan: "Starter" },
  { icon: PenTool,       name: "Teachers",   copy: "AI Professor, classrooms, assessments, courses.",                 plan: "Pro" },
  { icon: Building2,     name: "Businesses", copy: "CRM, ERP, HRMS, Automation, Founder Dashboard.",                  plan: "Business" },
  { icon: Factory,       name: "Factories",  copy: "Manufacturing, inventory, warehouse, IoT-ready runtime.",         plan: "Business" },
  { icon: Hospital,      name: "Hospitals",  copy: "Patient ops, records, scheduling, HIPAA-ready deployment.",       plan: "Enterprise" },
  { icon: Stethoscope,   name: "Clinics",    copy: "Practice management, appointments, AI triage assistant.",         plan: "Business" },
  { icon: GraduationCap, name: "Schools",    copy: "Multi-tenant campuses, student CRM, AI teaching assistants.",     plan: "Enterprise" },
  { icon: Code2,         name: "Developers", copy: "API, SDK, plugins, skills, sandbox, developer portal.",           plan: "Pro" },
  { icon: Palette,       name: "Creators",   copy: "Image, Video, Voice, Presentation, Marketing studios.",           plan: "Pro" },
  { icon: Landmark,      name: "Government", copy: "Sovereign deployment, audit, compliance, data residency.",        plan: "Enterprise" },
  { icon: Users,         name: "NGOs",       copy: "50% off, community feed, events, donations, volunteer ops.",      plan: "Starter" },
  { icon: Building2,     name: "Enterprise", copy: "Unlimited everything, dedicated Digital Human, dedicated runtime.",plan: "Enterprise" },
];

const HAPPY_VS = [
  { feature: "One unified Digital Human",       happy: "✓", trad: "—",       chat: "—",     ai: "—" },
  { feature: "Enterprise Brain runtime",         happy: "✓", trad: "—",       chat: "—",     ai: "Partial" },
  { feature: "Business OS (CRM · ERP · HRMS)",   happy: "✓", trad: "Partial", chat: "—",     ai: "—" },
  { feature: "Education OS",                      happy: "✓", trad: "—",       chat: "—",     ai: "—" },
  { feature: "Creator OS",                        happy: "✓", trad: "—",       chat: "Partial", ai: "Partial" },
  { feature: "Voice + Vision + Presentation",     happy: "✓", trad: "—",       chat: "Partial", ai: "Partial" },
  { feature: "Autonomous Runtime",                happy: "✓", trad: "—",       chat: "—",     ai: "Partial" },
  { feature: "Plugins + Skills Marketplace",      happy: "✓", trad: "—",       chat: "—",     ai: "Partial" },
  { feature: "SOC / SSO / Compliance",            happy: "✓", trad: "Partial", chat: "—",     ai: "Partial" },
  { feature: "Dedicated deployment / on-prem",    happy: "✓", trad: "Partial", chat: "—",     ai: "Partial" },
  { feature: "Own your data",                     happy: "✓", trad: "Partial", chat: "—",     ai: "—" },
  { feature: "Custom Digital Human",              happy: "✓", trad: "—",       chat: "—",     ai: "—" },
];

const TIMELINE = [
  { phase: "Start Free",  copy: "Sign up in seconds. Explore the Digital Human and AI." },
  { phase: "Grow",        copy: "Move to Starter or Pro. Unlock studios, memory, API." },
  { phase: "Scale",       copy: "Business OS: CRM, ERP, HRMS, automation, analytics." },
  { phase: "Enterprise",  copy: "Dedicated runtime, dedicated Digital Human, SSO, SOC." },
  { phase: "Global",      copy: "Multi-region, multi-brand, sovereign deployment." },
];

const MIGRATION: Array<{ from: string; copy: string }> = [
  { from: "ChatGPT", copy: "Import conversations & prompts. Keep memory, add reasoning + Digital Human." },
  { from: "Notion",  copy: "Import pages, databases, and workspaces into HAPPY Knowledge." },
  { from: "ERP",     copy: "Import products, orders, vendors, ledgers via CSV or API." },
  { from: "CRM",     copy: "Import leads, contacts, deals, pipelines with field mapping." },
  { from: "Google",  copy: "Import Docs, Sheets, Calendar, and Drive with a single click." },
  { from: "Slack",   copy: "Import channels, threads, and files as searchable knowledge." },
];

const FAQ: Array<{ q: string; a: string }> = [
  { q: "How does the subscription work?", a: "Every plan is billed monthly and renews automatically until you cancel. Upgrade, downgrade or pause any time." },
  { q: "Is there really a free plan?", a: "Yes. Free is truly free, forever. No card required." },
  { q: "Do you offer refunds?", a: "Every paid plan is covered by a 30-day money-back guarantee." },
  { q: "Can I upgrade later?", a: "Yes. Upgrades apply instantly with a pro-rated charge." },
  { q: "Can I downgrade later?", a: "Yes. Downgrades apply at the end of your current billing cycle." },
  { q: "What does Enterprise include?", a: "Custom-quoted based on scale, deployment, integrations, SLAs, security tier and support depth." },
  { q: "How do you handle data security?", a: "End-to-end encryption, MFA, RBAC and RLS by default. Enterprise adds SSO, custom policies, audit exports and data-residency." },
  { q: "Do you support SSO?", a: "Yes, on Enterprise: SAML, OIDC, Azure AD, Okta, Google Workspace and custom IdPs." },
  { q: "Do you have SOC / ISO / GDPR?", a: "SOC-ready with continuous controls. Enterprise gets full compliance packages including SOC 2, ISO 27001, GDPR and DPDP." },
  { q: "Which payment methods are supported?", a: "UPI, Cards, Net Banking, Wallets, Razorpay, Stripe and PayPal. Enterprise supports invoicing, PO and bank transfer." },
  { q: "Is GST included?", a: "Prices are exclusive of GST. A GST-compliant invoice is generated for every payment." },
  { q: "How do I cancel?", a: "One click, from your account. No cancellation fees, ever." },
  { q: "When does my plan renew?", a: "On the same calendar date each month. We remind you 3 days in advance." },
  { q: "Do you support annual billing?", a: "Yes. Annual billing on Pro, Business and Enterprise with a 20% discount." },
  { q: "Discounts for students or NGOs?", a: "Verified students, teachers and non-profits get up to 50% off Starter and Pro." },
  { q: "Team & workspace limits?", a: "Business includes unlimited team members and workspaces. Enterprise adds unlimited companies and brands." },
  { q: "Do I own my data?", a: "Always. Export everything anytime and delete it on demand. We never train foundation models on your data." },
  { q: "Do you offer white-label?", a: "Yes, on Enterprise. Full white-label with your brand, domain and dedicated Digital Human." },
  { q: "Can I self-host HAPPY?", a: "Yes, on Enterprise via dedicated deployment — cloud, VPC or on-prem." },
  { q: "How do I talk to sales?", a: "Book a demo, schedule a meeting or request an Enterprise quote below." },
];

const CONTACT: Array<{ title: string; copy: string; cta: string; icon: React.ElementType }> = [
  { title: "Talk To HAPPY",     copy: "Chat with the live Digital Human right now.",   cta: "Start Chat",     icon: Bot },
  { title: "Book Demo",         copy: "See the full platform in 30 minutes.",           cta: "Book Demo",      icon: Calendar },
  { title: "Schedule Call",     copy: "Pick a time that works for your team.",          cta: "Schedule",       icon: MessageSquare },
  { title: "Talk To Sales",     copy: "Discuss pricing, scale and deployment.",         cta: "Talk To Sales",  icon: Phone },
  { title: "Enterprise Team",   copy: "Get a custom quote for your organization.",      cta: "Contact",        icon: FileText },
  { title: "Start Free",        copy: "No card. Full experience. Ready in seconds.",    cta: "Start Free",     icon: Rocket },
];

/* ────────────────────── Small hooks ────────────────────── */
function useCountUp(target: number, active: boolean, ms = 900) {
  const [v, setV] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!active) { setV(target); return; }
    const start = performance.now();
    const from = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, ms]);
  return v;
}

/* ────────────────────── Component ────────────────────── */
const tierAccent = (i: number, featured?: boolean) =>
  featured ? "text-gold" : i === 0 ? "text-soft-gray" : "text-paper";

const AUDIENCES: Array<{ id: string; label: string; recommend: Tier["id"]; icon: React.ElementType }> = [
  { id: "student",    label: "Student",    recommend: "starter",    icon: GraduationCap },
  { id: "creator",    label: "Creator",    recommend: "pro",        icon: Palette },
  { id: "developer",  label: "Developer",  recommend: "pro",        icon: Code2 },
  { id: "business",   label: "Business",   recommend: "business",   icon: Building2 },
  { id: "company",    label: "Company",    recommend: "business",   icon: Building2 },
  { id: "enterprise", label: "Enterprise", recommend: "enterprise", icon: Landmark },
];

export function PricingExperience() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [audience, setAudience] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MATRIX.map((c) => [c.id, true])),
  );
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  // ROI
  const [team, setTeam] = useState(10);
  const [hours, setHours] = useState(5);
  const [salary, setSalary] = useState(50000);
  const hourly = salary / 22 / 8;
  const monthlySavings = Math.round(team * hours * 4 * hourly);
  const yearlySavings = monthlySavings * 12;
  const roi = Math.round((yearlySavings / Math.max(1, 1499 * team * 12)) * 100);

  // Counters activate on mount
  const [countActive, setCountActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCountActive(true), 200); return () => clearTimeout(t); }, []);
  const cMonthly = useCountUp(monthlySavings, true, 500);
  const cYearly = useCountUp(yearlySavings, true, 700);
  const cRoi = useCountUp(roi, true, 700);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MATRIX;
    return MATRIX
      .map((c) => ({ ...c, rows: c.rows.filter((row) => row.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) }))
      .filter((c) => c.rows.length > 0);
  }, [query]);

  const toggleCat = (id: string) => setOpenCats((s) => ({ ...s, [id]: !s[id] }));
  const recommended = audience ? AUDIENCES.find((a) => a.id === audience)?.recommend : null;
  const savingsTeaser = cycle === "yearly" ? "Save 20% billed yearly" : cycle === "lifetime" ? "Lifetime access coming soon" : "Switch to yearly and save 20%";

  const handlePrint = () => window.print();
  const handleExport = () => {
    // Client-side CSV export as a lightweight PDF-alternative.
    const rows: string[] = [];
    rows.push(["Category", "Capability", ...TIERS.map((t) => t.name)].join(","));
    MATRIX.forEach((cat) => cat.rows.forEach((row) => {
      rows.push([cat.name, row.label, ...row.values.map((v) => `"${v}"`)].join(","));
    }));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "happy-pricing.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative border-t border-gold/10 py-24">
      {/* Animated gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.18),transparent_70%)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.10),transparent_70%)] blur-2xl" />
        <div className="absolute left-0 top-1/2 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.08),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* ═══ SECTION 1 · Interactive Hero ═══ */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-charcoal/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold backdrop-blur">
              <Sparkle className="h-3.5 w-3.5 motion-safe:animate-pulse" />
              Pricing Experience v3.0 · Ultimate
            </div>
            <h2 id="pricing-heading" className="mt-6 font-display text-4xl font-semibold leading-[1.03] tracking-tight text-paper md:text-6xl">
              Choose your <span className="bg-gradient-to-r from-gold via-paper to-gold bg-clip-text text-transparent motion-safe:animate-pulse">HAPPY</span> experience
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-soft-gray md:text-lg">
              One Digital Human. One Enterprise Brain. Every capability your organization will ever need — priced to grow with you.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] text-soft-gray">
              <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-gold" /> SOC-ready</span>
              <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-gold" /> Sovereign</span>
              <span className="inline-flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-gold" /> Autonomous Runtime</span>
              <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-gold" /> Own your data</span>
            </div>
          </div>

          {/* Digital Human hero panel + micro savings teaser */}
          <div className="relative rounded-[2rem] border border-gold/25 bg-gradient-to-b from-charcoal via-charcoal to-obsidian p-6 shadow-[0_0_60px_-20px_rgba(232,201,106,0.5)]">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(232,201,106,0.16),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                  <Bot className="h-8 w-8 text-gold" aria-hidden />
                  <span aria-hidden className="absolute inset-0 rounded-full border border-gold/40 motion-safe:animate-ping" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-gold">HAPPY · Live</div>
                  <p className="mt-1 text-[14px] leading-relaxed text-paper">
                    "Hi — I'm HAPPY. Tell me who you are and I'll recommend the right plan for you."
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
                <div className="text-[11px] uppercase tracking-widest text-soft-gray">Real-time savings preview</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="numeric font-display text-3xl font-semibold text-gold">₹{cMonthly.toLocaleString("en-IN")}</span>
                  <span className="text-[12px] text-soft-gray">/month potential team savings</span>
                </div>
                <div className="mt-1 text-[11px] text-soft-gray">Fine-tune with the ROI Calculator below.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2 · Billing Toggle ═══ */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div role="tablist" aria-label="Billing cycle" className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-charcoal/70 p-1 backdrop-blur">
            {(["monthly","yearly","lifetime"] as Cycle[]).map((c) => {
              const active = cycle === c;
              const disabled = c === "lifetime";
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => !disabled && setCycle(c)}
                  className={`relative rounded-full px-5 py-2 text-[12.5px] font-semibold uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    active ? "bg-gold text-obsidian shadow-[0_0_20px_-4px_rgba(232,201,106,0.7)]"
                           : disabled ? "cursor-not-allowed text-soft-gray/50"
                           : "text-soft-gray hover:text-paper"
                  }`}
                >
                  {c}
                  {c === "yearly" && !active && (
                    <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold text-gold">-20%</span>
                  )}
                  {c === "lifetime" && (
                    <span className="ml-2 rounded-full bg-obsidian px-2 py-0.5 text-[9px] font-bold text-soft-gray">SOON</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[11.5px] uppercase tracking-widest text-soft-gray">{savingsTeaser}</div>
        </div>

        {/* ═══ SECTION 3 · AI Plan Recommendation ═══ */}
        <div className="mt-16 rounded-3xl border border-gold/20 bg-charcoal/70 p-6 md:p-8">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Sparkles className="h-3 w-3" /> AI Recommendation
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold text-paper md:text-3xl">Not sure which plan?</h3>
              <p className="mt-1 text-sm text-soft-gray">Tell HAPPY who you are and get an instant recommendation.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              const active = audience === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 motion-safe:hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    active ? "border-gold bg-gold text-obsidian shadow-[0_0_20px_-4px_rgba(232,201,106,0.7)]"
                           : "border-gold/25 bg-obsidian/50 text-paper hover:border-gold/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {a.label}
                </button>
              );
            })}
          </div>
          {recommended && (
            <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-obsidian via-charcoal to-obsidian p-5 md:flex-row md:items-center">
              <div className="text-[14px] text-paper">
                HAPPY recommends → <span className="font-semibold text-gold">{TIERS.find((t) => t.id === recommended)?.name}</span>
                <span className="ml-2 text-[12px] text-soft-gray">{TIERS.find((t) => t.id === recommended)?.copy}</span>
              </div>
              <a href="#plans" className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[12px] font-semibold text-obsidian transition-transform hover:scale-[1.03]">
                Jump to plan <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* ═══ Plan cards ═══ */}
        <div id="plans" className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {TIERS.map((t, i) => {
            const p = cyclePrice(t, cycle);
            const isRec = recommended === t.id;
            return (
              <article
                key={t.id}
                aria-label={`${t.name} plan`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-[0.3deg] focus-within:ring-2 focus-within:ring-gold/40 ${
                  t.featured
                    ? "border-gold/60 bg-gradient-to-b from-charcoal via-charcoal to-obsidian shadow-[0_0_60px_-15px_rgba(232,201,106,0.55)] xl:scale-[1.02]"
                    : "border-gold/15 bg-charcoal hover:border-gold/35 hover:shadow-[0_0_40px_-20px_rgba(232,201,106,0.35)]"
                }`}
              >
                {t.featured && (
                  <>
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,201,106,0.18),transparent_60%)]" />
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-full border-x border-b border-gold/50 bg-gold px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-obsidian">Most Popular</div>
                  </>
                )}
                {isRec && !t.featured && (
                  <div className="absolute right-3 top-3 rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">AI Pick</div>
                )}
                <div className="relative flex h-full flex-col">
                  <div className={`text-[11px] uppercase tracking-widest ${tierAccent(i, t.featured)}`}>{t.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span key={`${t.id}-${cycle}`} className="numeric font-display text-[34px] font-semibold leading-none text-paper motion-safe:animate-fade-in">
                      {p.primary}
                    </span>
                    {p.secondary && <span className="text-[12px] text-soft-gray">{p.secondary}</span>}
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
                      t.featured ? "bg-gold text-obsidian shadow-[0_0_24px_-4px_rgba(232,201,106,0.7)]" : "border border-gold/25 text-paper hover:bg-gold/10"
                    }`}
                  >
                    {t.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* ═══ Counter ═══ */}
        <div className="mt-20 grid grid-cols-2 gap-4 rounded-3xl border border-gold/15 bg-charcoal p-8 md:grid-cols-4">
          {COUNTER.map((c) => (
            <div key={c.label} className="text-center">
              <div className="numeric font-display text-3xl font-semibold text-gold md:text-4xl">{c.value}</div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-soft-gray">{c.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 5 · Use Case Gallery ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Built for every use case</h3>
          <p className="mt-2 text-sm text-soft-gray">One platform. Endless applications. See where HAPPY fits.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {USE_CASES.map(({ icon: Icon, name, copy, plan }) => (
              <article key={name} className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal p-5 transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.6)]">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(232,201,106,0.08),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <div className="mt-3 text-[13.5px] font-semibold text-paper">{name}</div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-soft-gray">{copy}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest text-gold">
                    Recommended · {plan}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 6 · ROI Calculator ═══ */}
        <div className="mt-24 grid gap-8 rounded-3xl border border-gold/20 bg-charcoal p-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
              <TrendingUp className="h-3 w-3" /> ROI Calculator
            </div>
            <h3 className="mt-3 font-display text-2xl font-semibold text-paper md:text-3xl">Estimate your team's savings</h3>
            <p className="mt-2 text-sm text-soft-gray">Every input updates in real time. No form. No signup.</p>

            <div className="mt-6 space-y-5">
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray">
                  <span>Team size</span><span className="numeric text-paper">{team}</span>
                </div>
                <input type="range" min={1} max={500} step={1} value={team} onChange={(e) => setTeam(+e.target.value)}
                  className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray">
                  <span>Hours saved / person / week</span><span className="numeric text-paper">{hours}h</span>
                </div>
                <input type="range" min={1} max={40} step={1} value={hours} onChange={(e) => setHours(+e.target.value)}
                  className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray">
                  <span>Avg monthly salary (₹)</span><span className="numeric text-paper">₹{salary.toLocaleString("en-IN")}</span>
                </div>
                <input type="range" min={10000} max={500000} step={5000} value={salary} onChange={(e) => setSalary(+e.target.value)}
                  className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-2xl border border-gold/25 bg-gradient-to-br from-obsidian via-charcoal to-obsidian p-6">
              <div className="text-[11px] uppercase tracking-widest text-gold">Yearly savings</div>
              <div className="numeric mt-2 font-display text-4xl font-semibold text-paper md:text-5xl">
                ₹{cYearly.toLocaleString("en-IN")}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-obsidian">
                <div className="h-full bg-gradient-to-r from-gold via-paper to-gold transition-[width] duration-500" style={{ width: `${Math.min(100, roi)}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Monthly</div>
              <div className="numeric mt-2 font-display text-2xl font-semibold text-gold">₹{cMonthly.toLocaleString("en-IN")}</div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">ROI vs Business</div>
              <div className="numeric mt-2 font-display text-2xl font-semibold text-gold">{cRoi.toLocaleString("en-IN")}%</div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 7 · Digital Human Demo ═══ */}
        <div className="mt-24 overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-charcoal via-obsidian to-charcoal p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Bot className="h-3 w-3" /> Digital Human Demo
              </div>
              <h3 className="mt-3 font-display text-3xl font-semibold text-paper md:text-4xl">Try HAPPY, live.</h3>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-soft-gray">
                Voice, whiteboard, presentations, live avatar — the same Digital Human, four ways to experience it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: MessageSquare, label: "Talk to HAPPY" },
                  { icon: Mic,           label: "Try Voice" },
                  { icon: PlayCircle,    label: "Watch Demo" },
                  { icon: PenTool,       label: "Whiteboard" },
                  { icon: Presentation,  label: "Presentation" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} type="button" className="group inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-4 py-2 text-[12.5px] font-medium text-paper transition-all duration-200 motion-safe:hover:scale-[1.04] hover:border-gold/50 hover:bg-obsidian/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
                    <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {label}
                    <ArrowRight className="h-3 w-3 text-gold opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
            <div className="relative aspect-square w-full max-w-md justify-self-center rounded-[2rem] border border-gold/25 bg-obsidian/60 p-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(232,201,106,0.22),transparent_60%)]" />
              <div className="relative flex h-full flex-col items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-gold/40 bg-gold/15">
                  <Bot className="h-14 w-14 text-gold" aria-hidden />
                  <span aria-hidden className="absolute inset-0 rounded-full border border-gold/50 motion-safe:animate-ping" />
                  <span aria-hidden className="absolute -inset-4 rounded-full border border-gold/20" />
                </div>
                <div className="mt-6 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-gold">HAPPY · Live</div>
                  <div className="mt-1 text-[13.5px] text-paper">Ready when you are.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 4 · Feature Matrix ═══ */}
        <div className="mt-24">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Feature comparison matrix</h3>
              <p className="mt-2 text-sm text-soft-gray">{TOTAL_ROWS}+ capabilities across every plan. Search, expand and export.</p>
            </div>
            <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
              <label className="relative flex-1 min-w-[200px]">
                <span className="sr-only">Search features</span>
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-gray" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 200+ features…"
                  className="w-full rounded-full border border-gold/20 bg-charcoal py-2.5 pl-9 pr-4 text-[13px] text-paper placeholder:text-soft-gray focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </label>
              <button type="button" onClick={() => setOpenCats(Object.fromEntries(MATRIX.map((c) => [c.id, true])))} className="rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50">Expand</button>
              <button type="button" onClick={() => setOpenCats(Object.fromEntries(MATRIX.map((c) => [c.id, false])))} className="rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50">Collapse</button>
              <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50"><Printer className="h-3.5 w-3.5" /> Print</button>
              <button type="button" onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50"><Download className="h-3.5 w-3.5" /> Export</button>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/15 bg-charcoal">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-charcoal">
                <tr className="border-b border-gold/15 text-[11px] uppercase tracking-widest text-soft-gray">
                  <th scope="col" className="sticky left-0 z-20 bg-charcoal px-5 py-4 font-medium">Capability</th>
                  {TIERS.map((t) => (
                    <th key={t.id} scope="col" className={`px-4 py-4 font-medium ${t.featured ? "text-gold" : "text-paper"}`}>{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-soft-gray">No features match "{query}".</td></tr>
                )}
                {filtered.map((cat) => {
                  const isOpen = openCats[cat.id] !== false;
                  return (
                    <>
                      <tr key={`h-${cat.id}`} className="bg-obsidian/80 backdrop-blur">
                        <th scope="colgroup" colSpan={6} className="px-3 py-2">
                          <button type="button" onClick={() => toggleCat(cat.id)} aria-expanded={isOpen} aria-controls={`cat-${cat.id}`}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40">
                            <span>{cat.name} <span className="ml-2 font-normal text-soft-gray normal-case tracking-normal">({cat.rows.length})</span></span>
                            <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </th>
                      </tr>
                      {isOpen && cat.rows.map((row, i) => (
                        <tr id={`cat-${cat.id}`} key={`${cat.id}-${row.label}`} className={i % 2 === 0 ? "bg-obsidian/40" : ""}>
                          <th scope="row" className="sticky left-0 z-10 bg-inherit px-5 py-3 text-[13px] font-normal text-paper">{row.label}</th>
                          {row.values.map((v, idx) => (
                            <td key={idx} className={`px-4 py-3 text-[13px] ${v === "—" ? "text-soft-gray/60" : TIERS[idx].featured ? "text-gold" : "text-paper"}`}>{v}</td>
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

        {/* ═══ SECTION 9 · Comparison ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">HAPPY vs the alternatives</h3>
          <p className="mt-2 text-sm text-soft-gray">Not just another chatbot. Not just another SaaS.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/15 bg-charcoal">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gold/15 text-[11px] uppercase tracking-widest text-soft-gray">
                  <th className="px-5 py-4 font-medium">Capability</th>
                  <th className="px-4 py-4 font-medium text-gold">HAPPY</th>
                  <th className="px-4 py-4 font-medium">Traditional Software</th>
                  <th className="px-4 py-4 font-medium">Generic AI Chatbot</th>
                  <th className="px-4 py-4 font-medium">Enterprise AI Platform</th>
                </tr>
              </thead>
              <tbody>
                {HAPPY_VS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-obsidian/40" : ""}>
                    <th scope="row" className="px-5 py-3 text-[13px] font-normal text-paper">{row.feature}</th>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gold">{row.happy}</td>
                    <td className={`px-4 py-3 text-[13px] ${row.trad === "—" ? "text-soft-gray/60" : "text-paper"}`}>{row.trad}</td>
                    <td className={`px-4 py-3 text-[13px] ${row.chat === "—" ? "text-soft-gray/60" : "text-paper"}`}>{row.chat}</td>
                    <td className={`px-4 py-3 text-[13px] ${row.ai   === "—" ? "text-soft-gray/60" : "text-paper"}`}>{row.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ SECTION 10 · Enterprise Timeline ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Your journey with HAPPY</h3>
          <p className="mt-2 text-sm text-soft-gray">Start free. Grow at your own pace. Scale to global.</p>
          <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TIMELINE.map((s, i) => (
              <li key={s.phase} className="relative rounded-2xl border border-gold/15 bg-charcoal p-5 transition-colors hover:border-gold/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-[13px] font-semibold text-gold">{i + 1}</div>
                  <div className="text-[13px] font-semibold text-paper">{s.phase}</div>
                </div>
                <div className="mt-3 text-[12px] leading-relaxed text-soft-gray">{s.copy}</div>
                {i < TIMELINE.length - 1 && (
                  <ArrowRight aria-hidden className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-gold/40 lg:block" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* ═══ SECTION 11 · Migration ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Already using something else?</h3>
          <p className="mt-2 text-sm text-soft-gray">Bring everything with you. HAPPY imports from the tools you already use.</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MIGRATION.map((m) => (
              <div key={m.from} className="group rounded-2xl border border-gold/15 bg-charcoal p-5 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.5)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                    <ArrowRightLeft className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-soft-gray">Migrate from</div>
                    <div className="text-[14px] font-semibold text-paper">{m.from}</div>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-soft-gray">{m.copy}</p>
                <button type="button" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-gold transition-transform group-hover:translate-x-0.5">
                  Start migration <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Integrations ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Integrations</h3>
          <p className="mt-2 text-sm text-soft-gray">Works with the tools your team already uses.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {INTEGRATIONS.map((i) => (
              <span key={i} className="rounded-full border border-gold/20 bg-charcoal px-4 py-2 text-[12.5px] font-medium text-paper transition-all duration-200 motion-safe:hover:scale-[1.05] hover:border-gold/45">{i}</span>
            ))}
          </div>
        </div>

        {/* ═══ Payments ═══ */}
        <div className="mt-16 rounded-2xl border border-gold/15 bg-charcoal p-7">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Payments</div>
              <div className="mt-2 font-display text-xl font-semibold text-paper">Every payment method your customers use.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span key={p} className="rounded-full border border-gold/20 bg-obsidian/60 px-3.5 py-1.5 text-[12px] font-medium text-paper">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 8 · Enterprise Trust ═══ */}
        <div className="mt-16">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Built on enterprise trust</h3>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {TRUST.map((b) => (
              <div key={b.title} className="group rounded-2xl border border-gold/15 bg-charcoal p-5 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.5)]">
                <Shield className="h-5 w-5 text-gold transition-transform group-hover:scale-110" aria-hidden />
                <div className="mt-3 text-[13px] font-semibold text-paper">{b.title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-soft-gray">{b.copy}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-widest text-soft-gray">
            {["Customers", "Security", "Compliance", "Responsible AI", "Privacy", "Roadmap", "Status"].map((k) => (
              <span key={k} className="rounded-full border border-gold/15 bg-charcoal px-3 py-1">{k}</span>
            ))}
          </div>
        </div>

        {/* ═══ FAQ ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Enterprise FAQ</h3>
          <p className="mt-2 text-sm text-soft-gray">Twenty of the most-asked questions from teams evaluating HAPPY.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {FAQ.map((f, i) => {
              const open = !!openFaqs[i];
              return (
                <div key={f.q} className={`rounded-2xl border bg-charcoal p-5 transition-colors ${open ? "border-gold/40" : "border-gold/15"}`}>
                  <button type="button" onClick={() => setOpenFaqs((s) => ({ ...s, [i]: !s[i] }))} aria-expanded={open} aria-controls={`faq-${i}`}
                    className="flex w-full cursor-pointer items-start justify-between gap-4 text-left text-[14px] font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
                    <span>{f.q}</span>
                    <ChevronDown aria-hidden className={`mt-0.5 h-4 w-4 flex-none text-gold transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && <p id={`faq-${i}`} className="mt-3 text-[13px] leading-relaxed text-soft-gray">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ SECTION 12 · Enterprise CTA ═══ */}
        <div className="mt-24 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-charcoal via-charcoal to-obsidian p-8 md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Zap className="h-3 w-3" aria-hidden /> Enterprise
              </div>
              <h3 className="mt-4 font-display text-3xl font-semibold text-paper md:text-4xl">Ready for the full Enterprise Brain?</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-soft-gray">
                Dedicated Digital Human, dedicated runtime, dedicated memory, SSO, SOC-grade security and a dedicated success manager. Priced for scale.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-[11px] uppercase tracking-widest text-soft-gray">
                <span className="inline-flex items-center gap-1.5"><Layers className="h-3 w-3 text-gold" /> Multi-tenant</span>
                <span className="inline-flex items-center gap-1.5"><Globe className="h-3 w-3 text-gold" /> Multi-region</span>
                <span className="inline-flex items-center gap-1.5"><Shield className="h-3 w-3 text-gold" /> SOC · GDPR · DPDP</span>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[560px]">
              {CONTACT.map(({ title, copy, cta, icon: Icon }) => (
                <button key={title} type="button"
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-gold/20 bg-obsidian/60 p-4 text-left transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-gold/50 hover:bg-obsidian/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
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
