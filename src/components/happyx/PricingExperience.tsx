/**
 * HAPPY Enterprise Edition — Pricing Experience v4.0 Ultimate
 * Frontend-only. Enterprise AI conversion surface.
 * No backend / service / API modifications.
 */
import { memo, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight, Check, Shield, Search, ChevronDown, Sparkle, Calendar, Phone,
  FileText, MessageSquare, Zap, Printer, Download, GraduationCap, Building2,
  Factory, Hospital, Landmark, Code2, Palette, Users, Stethoscope, Bot,
  Mic, Presentation, PenTool, Rocket, TrendingUp, Globe, Cpu, Database,
  Layers, Sparkles, ArrowRightLeft, PlayCircle, UtensilsCrossed, Briefcase,
  Trophy, LineChart, Puzzle, Volume2, Radio,
} from "lucide-react";

/* ─────────────────────────── Tiers ─────────────────────────── */
type TierId = "free" | "starter" | "pro" | "business" | "enterprise";
type Tier = {
  id: TierId; name: string; monthly: number; copy: string;
  features: string[]; cta: string; featured?: boolean; contact?: boolean;
};

const TIERS: Tier[] = [
  { id: "free", name: "Free", monthly: 0, copy: "Experience HAPPY end-to-end. No card required.",
    features: ["AI Chat", "Basic Digital Human", "Voice Chat", "5 Daily AI Requests", "Community", "Basic Notes", "1 GB Memory"], cta: "Get Started Free" },
  { id: "starter", name: "Starter", monthly: 199, copy: "For students and individuals.",
    features: ["Everything in Free", "Unlimited AI Chat", "Digital Human", "Voice", "AI Notes", "Flashcards", "Study Plans", "AI Search", "Whiteboard", "10 GB Memory"], cta: "Start Starter" },
  { id: "pro", name: "Pro", monthly: 499, copy: "For creators, teachers and power users.",
    features: ["Everything in Starter", "Advanced Digital Human", "Unlimited Voice", "AI Teacher / Professor / Mentor", "AI Research", "AI Presentation", "Knowledge Library", "Creator Studio Pro", "100 GB Memory", "API Access"], cta: "Go Pro", featured: true },
  { id: "business", name: "Business", monthly: 1499, copy: "For companies and teams.",
    features: ["Everything in Pro", "Business OS", "CRM · ERP · HRMS", "Inventory · Warehouse · Manufacturing", "Finance · Projects", "Workflow Automation", "Analytics", "Unlimited Team", "1 TB Memory"], cta: "Start Business" },
  { id: "enterprise", name: "Enterprise", monthly: -1, copy: "For multi-brand, regulated and global orgs.",
    features: ["Everything in Business", "Unlimited Companies · Brands · Users", "Dedicated Digital Human · Runtime · Memory", "SSO · SOC · Compliance", "Custom Integrations", "Enterprise SLA · 24×7", "White Label", "Unlimited Everything"], cta: "Talk To Sales", contact: true },
];

type Cycle = "monthly" | "yearly" | "3y" | "5y" | "lifetime";
const CYCLE_META: Record<Cycle, { label: string; discount: string; disabled?: boolean }> = {
  monthly:  { label: "Monthly",   discount: "" },
  yearly:   { label: "Yearly",    discount: "-20%" },
  "3y":     { label: "3 Years",   discount: "-30%" },
  "5y":     { label: "5 Years",   discount: "-40%" },
  lifetime: { label: "Lifetime",  discount: "SOON", disabled: true },
};

const cyclePrice = (t: Tier, c: Cycle): { primary: string; secondary?: string } => {
  if (t.monthly < 0) return { primary: "Custom", secondary: "Pricing" };
  if (t.monthly === 0) return { primary: "₹0", secondary: "Forever" };
  const m = t.monthly;
  switch (c) {
    case "monthly":  return { primary: `₹${m.toLocaleString("en-IN")}`, secondary: "/month" };
    case "yearly":   return { primary: `₹${Math.round(m * 12 * 0.80).toLocaleString("en-IN")}`, secondary: "/year · save 20%" };
    case "3y":       return { primary: `₹${Math.round(m * 36 * 0.70).toLocaleString("en-IN")}`, secondary: "/3 yrs · save 30%" };
    case "5y":       return { primary: `₹${Math.round(m * 60 * 0.60).toLocaleString("en-IN")}`, secondary: "/5 yrs · save 40%" };
    case "lifetime": return { primary: `₹${(m * 30).toLocaleString("en-IN")}`, secondary: "Lifetime · soon" };
  }
};

/* ─────────────── Feature Matrix (500+ rows across 22 categories) ─────────────── */
type Row = { label: string; values: [string, string, string, string, string] };
type Cat = { id: string; name: string; rows: Row[] };

const r = (label: string, a: string, b: string, c: string, d: string, e: string): Row =>
  ({ label, values: [a, b, c, d, e] });
const Y = "✓"; const N = "—";

const MATRIX: Cat[] = [
  { id: "dh", name: "Digital Human", rows: [
    r("Digital Human", "Basic", "Standard", "Advanced", "Advanced", "Dedicated"),
    r("Voice Conversation", "Limited", Y, "Unlimited", "Unlimited", "Unlimited"),
    r("Real-time Streaming", N, Y, Y, Y, Y),
    r("Emotion Engine", N, N, Y, Y, Y),
    r("Presentation Mode", N, N, Y, Y, Y),
    r("Whiteboard Mode", N, Y, Y, Y, Y),
    r("Memory Capacity", "1 GB", "10 GB", "100 GB", "1 TB", "Unlimited"),
    r("Multi-language", N, Y, Y, Y, Y),
    r("Live Avatar", N, N, Y, Y, "Dedicated"),
    r("Custom Persona", N, N, Y, Y, "Dedicated"),
    r("Lip Sync", N, N, Y, Y, Y),
    r("Gesture Engine", N, N, Y, Y, Y),
    r("Camera Awareness", N, N, N, Y, Y),
    r("Screen Share", N, N, Y, Y, Y),
    r("Handwriting", N, N, Y, Y, Y),
    r("Real-time Translation", N, N, Y, Y, Y),
    r("Persona Library", N, "Basic", "Standard", "Extended", "Custom"),
    r("Voice Cloning", N, N, N, Y, Y),
    r("Avatar Themes", N, "Basic", "Pro", "Pro", "Custom"),
    r("Multi-scene Rendering", N, N, Y, Y, Y),
    r("Session Recording", N, N, Y, Y, Y),
    r("Session Transcripts", N, Y, Y, Y, Y),
    r("Persona Analytics", N, N, Y, Y, Y),
    r("Broadcast Mode", N, N, N, Y, Y),
    r("Multi-Human Room", N, N, N, N, Y),
  ]},
  { id: "ai", name: "AI Runtime", rows: [
    r("AI Chat", "5/day", "Unlimited", "Unlimited", "Unlimited", "Unlimited"),
    r("Reasoning", "Basic", "Standard", "Advanced", "Advanced", "Enterprise"),
    r("Planning", N, Y, Y, Y, Y),
    r("Decision Engine", N, N, Y, Y, Y),
    r("Research", N, N, Y, Y, Y),
    r("Search", N, Y, Y, Y, Y),
    r("Knowledge Retrieval", N, Y, Y, Y, Y),
    r("Context Length", "Short", "Standard", "Extended", "Extended", "Enterprise"),
    r("Working Memory", "Session", "Persistent", "Persistent", "Team", "Dedicated"),
    r("Long-term Memory", N, Y, Y, Y, Y),
    r("Episodic Memory", N, N, Y, Y, Y),
    r("Reflection", N, N, Y, Y, Y),
    r("Learning", N, N, Y, Y, Y),
    r("Multi-Agent Orchestration", N, N, N, Y, Y),
    r("Tool Use", N, Y, Y, Y, Y),
    r("Vision", N, Y, Y, Y, Y),
    r("Audio Understanding", N, Y, Y, Y, Y),
    r("Speech-to-Speech", N, N, Y, Y, Y),
    r("Autonomous Loops", N, N, N, Y, Y),
    r("Safety Guardrails", Y, Y, Y, Y, Y),
    r("Model Router", N, N, Y, Y, Y),
    r("Custom System Prompts", N, Y, Y, Y, Y),
    r("Prompt Library", N, Y, Y, Y, Y),
    r("Chain-of-Thought", N, N, Y, Y, Y),
    r("Structured Output", N, Y, Y, Y, Y),
    r("Function Calling", N, Y, Y, Y, Y),
    r("Retrieval Augmentation", N, Y, Y, Y, Y),
    r("Fine-tune Ready", N, N, N, N, Y),
    r("Rate Limits", "Low", "Standard", "High", "High", "Custom"),
    r("Latency Priority", N, N, Y, Y, Y),
  ]},
  { id: "brain", name: "Enterprise Brain", rows: [
    r("Intent Engine", N, "Basic", Y, Y, Y),
    r("Context Engine", N, "Basic", Y, Y, Y),
    r("Memory Coordinator", N, N, Y, Y, Y),
    r("Capability Router", N, N, Y, Y, Y),
    r("Reasoning Engine", "Basic", "Standard", "Advanced", "Advanced", "Enterprise"),
    r("Planning Engine", N, Y, Y, Y, Y),
    r("Execution Engine", N, N, Y, Y, Y),
    r("Validation Engine", N, N, Y, Y, Y),
    r("Reflection Engine", N, N, Y, Y, Y),
    r("Learning Engine", N, N, Y, Y, Y),
    r("Priority Engine", N, N, Y, Y, Y),
    r("Safety Engine", Y, Y, Y, Y, Y),
    r("Analytics Engine", N, N, Y, Y, Y),
    r("Confidence Scoring", N, N, Y, Y, Y),
    r("Multi-brain Isolation", N, N, N, N, Y),
    r("Brain Snapshots", N, N, N, Y, Y),
    r("Brain Export", N, N, N, Y, Y),
    r("Brain Marketplace", N, N, N, Y, Y),
    r("Custom Brain Modules", N, N, N, N, Y),
    r("Brain Observability", N, N, Y, Y, Y),
  ]},
  { id: "edu", name: "Education OS", rows: [
    r("Courses", "Preview", Y, Y, Y, Y),
    r("Notes", "Basic", Y, Y, Y, Y),
    r("Flashcards", N, Y, Y, Y, Y),
    r("Study Plans", N, Y, Y, Y, Y),
    r("AI Teacher", N, N, Y, Y, Y),
    r("AI Professor", N, N, Y, Y, Y),
    r("AI Mentor", N, N, Y, Y, Y),
    r("AI Tutor", N, N, Y, Y, Y),
    r("AI Coach", N, N, Y, Y, Y),
    r("Certificates", N, N, Y, Y, Y),
    r("Analytics", N, N, Y, Y, Y),
    r("Assessments", N, Y, Y, Y, Y),
    r("Live Classes", N, N, Y, Y, Y),
    r("Homework Helper", N, Y, Y, Y, Y),
    r("Exam Prep", N, Y, Y, Y, Y),
    r("Language Lab", N, N, Y, Y, Y),
    r("Mock Interviews", N, N, Y, Y, Y),
    r("Grading Assistant", N, N, Y, Y, Y),
    r("Lesson Planner", N, N, Y, Y, Y),
    r("Curriculum Builder", N, N, N, Y, Y),
    r("Student CRM", N, N, N, Y, Y),
    r("Parent Portal", N, N, N, Y, Y),
    r("Attendance", N, N, N, Y, Y),
    r("Report Cards", N, N, N, Y, Y),
    r("Multi-campus", N, N, N, N, Y),
  ]},
  { id: "creator", name: "Creator OS", rows: [
    r("Image Studio", N, "Basic", "Pro", "Pro", "Pro+"),
    r("Video Studio", N, N, Y, Y, Y),
    r("Voice Studio", N, Y, Y, Y, Y),
    r("Presentation Studio", N, N, Y, Y, Y),
    r("Marketing Studio", N, N, Y, Y, Y),
    r("Brand Kit", N, N, Y, Y, Y),
    r("Media Library", N, Y, Y, Y, Y),
    r("Projects", N, Y, Y, Y, Y),
    r("Exports", "Watermark", "Standard", "HD", "HD", "4K"),
    r("AI Editing", N, N, Y, Y, Y),
    r("Motion Graphics", N, N, Y, Y, Y),
    r("Storyboards", N, N, Y, Y, Y),
    r("Thumbnails", N, Y, Y, Y, Y),
    r("Captions & Subtitles", N, Y, Y, Y, Y),
    r("Blog Studio", N, Y, Y, Y, Y),
    r("Podcast Studio", N, N, Y, Y, Y),
    r("Social Scheduler", N, N, Y, Y, Y),
    r("Ad Copy", N, N, Y, Y, Y),
    r("Email Campaigns", N, N, Y, Y, Y),
    r("SEO Assistant", N, N, Y, Y, Y),
    r("Content Calendar", N, N, Y, Y, Y),
    r("Asset Versioning", N, N, Y, Y, Y),
    r("Team Reviews", N, N, N, Y, Y),
    r("White-label Exports", N, N, N, N, Y),
    r("Enterprise Brand Kit", N, N, N, Y, Y),
  ]},
  { id: "biz", name: "Business OS", rows: [
    r("Business Dashboard", N, N, N, Y, Y),
    r("Founder Dashboard", N, N, N, Y, Y),
    r("Enterprise Dashboard", N, N, N, N, Y),
    r("Projects", N, N, N, Y, Y),
    r("Tasks", N, Y, Y, Y, Y),
    r("Kanban", N, Y, Y, Y, Y),
    r("Gantt", N, N, N, Y, Y),
    r("Milestones", N, N, Y, Y, Y),
    r("Docs", N, Y, Y, Y, Y),
    r("Wikis", N, N, Y, Y, Y),
    r("Meetings", N, N, Y, Y, Y),
    r("Meeting AI Notes", N, N, Y, Y, Y),
    r("Team Chat", N, Y, Y, Y, Y),
    r("Announcements", N, N, Y, Y, Y),
    r("Approvals", N, N, N, Y, Y),
    r("OKRs", N, N, N, Y, Y),
    r("Goals", N, N, Y, Y, Y),
    r("Business AI Advisor", N, N, N, Y, Y),
    r("Multi-workspace", N, N, N, Y, Y),
    r("Multi-brand", N, N, N, N, Y),
    r("Multi-company", N, N, N, N, Y),
    r("Business Templates", N, Y, Y, Y, Y),
    r("Custom Fields", N, N, Y, Y, Y),
    r("Custom Workflows", N, N, N, Y, Y),
    r("Approval Chains", N, N, N, Y, Y),
  ]},
  { id: "crm", name: "CRM", rows: [
    r("Leads", N, N, N, Y, Y),
    r("Contacts", N, N, N, Y, Y),
    r("Accounts", N, N, N, Y, Y),
    r("Deals", N, N, N, Y, Y),
    r("Pipelines", N, N, N, Y, Y),
    r("Activities", N, N, N, Y, Y),
    r("Email Sequences", N, N, N, Y, Y),
    r("WhatsApp Sequences", N, N, N, Y, Y),
    r("AI Lead Scoring", N, N, N, Y, Y),
    r("AI Follow-up", N, N, N, Y, Y),
    r("AI Meeting Summaries", N, N, N, Y, Y),
    r("Quotes", N, N, N, Y, Y),
    r("Contracts", N, N, N, Y, Y),
    r("Forecasting", N, N, N, Y, Y),
    r("Territory Management", N, N, N, N, Y),
    r("Duplicate Detection", N, N, N, Y, Y),
    r("Lead Enrichment", N, N, N, Y, Y),
    r("Custom Objects", N, N, N, N, Y),
    r("Custom Reports", N, N, N, Y, Y),
    r("Data Import", N, Y, Y, Y, Y),
  ]},
  { id: "erp", name: "ERP", rows: [
    r("Products", N, N, N, Y, Y),
    r("Categories", N, N, N, Y, Y),
    r("Vendors", N, N, N, Y, Y),
    r("Purchase Orders", N, N, N, Y, Y),
    r("Sales Orders", N, N, N, Y, Y),
    r("Inventory", N, N, N, Y, Y),
    r("Warehouse", N, N, N, Y, Y),
    r("Multi-warehouse", N, N, N, N, Y),
    r("Stock Transfers", N, N, N, Y, Y),
    r("Stock Adjustments", N, N, N, Y, Y),
    r("Reorder Rules", N, N, N, Y, Y),
    r("Batch & Serial", N, N, N, Y, Y),
    r("Barcode & QR", N, N, N, Y, Y),
    r("Landed Cost", N, N, N, Y, Y),
    r("Vendor Bills", N, N, N, Y, Y),
    r("Manufacturing", N, N, N, Y, Y),
    r("BOM", N, N, N, Y, Y),
    r("Work Orders", N, N, N, Y, Y),
    r("Quality Control", N, N, N, Y, Y),
    r("Multi-currency", N, N, N, Y, Y),
  ]},
  { id: "hrms", name: "HRMS", rows: [
    r("Employees", N, N, N, Y, Y),
    r("Onboarding", N, N, N, Y, Y),
    r("Offboarding", N, N, N, Y, Y),
    r("Attendance", N, N, N, Y, Y),
    r("Leave Management", N, N, N, Y, Y),
    r("Payroll", N, N, N, Y, Y),
    r("Payslips", N, N, N, Y, Y),
    r("Performance", N, N, N, Y, Y),
    r("Appraisals", N, N, N, Y, Y),
    r("Recruitment", N, N, N, Y, Y),
    r("ATS", N, N, N, Y, Y),
    r("Training", N, N, N, Y, Y),
    r("Documents", N, N, N, Y, Y),
    r("Timesheets", N, N, N, Y, Y),
    r("Expense Claims", N, N, N, Y, Y),
    r("Org Chart", N, N, N, Y, Y),
    r("HR Analytics", N, N, N, Y, Y),
    r("Multi-country Payroll", N, N, N, N, Y),
  ]},
  { id: "fin", name: "Finance", rows: [
    r("Invoices", N, N, Y, Y, Y),
    r("Estimates", N, N, Y, Y, Y),
    r("Payments", N, N, Y, Y, Y),
    r("Ledger", N, N, N, Y, Y),
    r("Journals", N, N, N, Y, Y),
    r("Chart of Accounts", N, N, N, Y, Y),
    r("Trial Balance", N, N, N, Y, Y),
    r("P&L", N, N, N, Y, Y),
    r("Balance Sheet", N, N, N, Y, Y),
    r("Cash Flow", N, N, N, Y, Y),
    r("Tax / GST", N, N, Y, Y, Y),
    r("TDS", N, N, N, Y, Y),
    r("Bank Reconciliation", N, N, N, Y, Y),
    r("Multi-currency", N, N, N, Y, Y),
    r("Recurring Billing", N, N, Y, Y, Y),
    r("Financial Reports", N, N, N, Y, Y),
    r("Budgets", N, N, N, Y, Y),
    r("Cost Centers", N, N, N, N, Y),
  ]},
  { id: "mfg", name: "Manufacturing", rows: [
    r("Production Planning", N, N, N, Y, Y),
    r("Work Centers", N, N, N, Y, Y),
    r("Routings", N, N, N, Y, Y),
    r("Shop Floor", N, N, N, Y, Y),
    r("Downtime Tracking", N, N, N, Y, Y),
    r("OEE", N, N, N, N, Y),
    r("Maintenance", N, N, N, Y, Y),
    r("Preventive Maintenance", N, N, N, Y, Y),
    r("Spare Parts", N, N, N, Y, Y),
    r("MES Integration", N, N, N, N, Y),
    r("Barcode Scanning", N, N, N, Y, Y),
    r("Machine Data", N, N, N, N, Y),
    r("IoT Ready", N, N, N, N, Y),
    r("Digital Twin Ready", N, N, N, N, Y),
    r("Compliance Tracking", N, N, N, Y, Y),
  ]},
  { id: "comm", name: "Community", rows: [
    r("Feed", Y, Y, Y, Y, Y),
    r("Groups", Y, Y, Y, Y, Y),
    r("Messages", "Limited", Y, Y, Y, Y),
    r("Marketplace", "Browse", "Sell", "Sell", "Sell", "Sell"),
    r("Reviews", Y, Y, Y, Y, Y),
    r("Following", Y, Y, Y, Y, Y),
    r("Creator Community", N, Y, Y, Y, Y),
    r("Events", "Browse", "RSVP", "Host", "Host", "Host"),
    r("Live Rooms", N, N, Y, Y, Y),
    r("Broadcasts", N, N, Y, Y, Y),
    r("Polls", Y, Y, Y, Y, Y),
    r("Q&A", Y, Y, Y, Y, Y),
    r("Moderation", "Basic", "Basic", "Advanced", "Advanced", "Enterprise"),
    r("Community Analytics", N, N, Y, Y, Y),
    r("Private Communities", N, N, Y, Y, Y),
  ]},
  { id: "market", name: "Marketplace", rows: [
    r("Products", "Browse", "Sell", "Sell", "Sell", "Sell"),
    r("Services", "Browse", "Sell", "Sell", "Sell", "Sell"),
    r("Storefront", N, "Basic", "Pro", "Pro", "Enterprise"),
    r("Checkout", N, Y, Y, Y, Y),
    r("Cart", Y, Y, Y, Y, Y),
    r("Wishlist", Y, Y, Y, Y, Y),
    r("Coupons", N, Y, Y, Y, Y),
    r("Reviews", Y, Y, Y, Y, Y),
    r("Ratings", Y, Y, Y, Y, Y),
    r("Order Management", N, Y, Y, Y, Y),
    r("Shipping", N, Y, Y, Y, Y),
    r("Returns", N, Y, Y, Y, Y),
    r("Payouts", N, Y, Y, Y, Y),
    r("Commission Rules", N, N, Y, Y, Y),
    r("Multi-vendor", N, N, N, Y, Y),
  ]},
  { id: "kb", name: "Knowledge OS", rows: [
    r("Knowledge Base", "Read", Y, Y, Y, Y),
    r("Knowledge Search", "Limited", Y, Y, Y, Y),
    r("Research", N, N, Y, Y, Y),
    r("Documents", N, Y, Y, Y, Y),
    r("References", N, Y, Y, Y, Y),
    r("AI Knowledge", N, N, Y, Y, Y),
    r("Citations", N, Y, Y, Y, Y),
    r("PDF Analysis", N, Y, Y, Y, Y),
    r("Web Import", N, Y, Y, Y, Y),
    r("YouTube Import", N, Y, Y, Y, Y),
    r("Notion Import", N, Y, Y, Y, Y),
    r("Team Knowledge", N, N, Y, Y, Y),
    r("Private Vaults", N, N, N, Y, Y),
    r("Semantic Search", N, Y, Y, Y, Y),
    r("Graph View", N, N, Y, Y, Y),
    r("Auto-tagging", N, Y, Y, Y, Y),
    r("Change History", N, N, Y, Y, Y),
    r("Access Controls", N, N, Y, Y, Y),
  ]},
  { id: "local", name: "Hyperlocal", rows: [
    r("Businesses", "Browse", Y, Y, Y, Y),
    r("Jobs", "Browse", "Apply", "Apply", "Post", "Post"),
    r("Events", "Browse", "RSVP", "RSVP", "Host", "Host"),
    r("Alerts", N, Y, Y, Y, Y),
    r("Reviews", "Read", "Write", "Write", "Write", "Write"),
    r("Maps", Y, Y, Y, Y, Y),
    r("Nearby", Y, Y, Y, Y, Y),
    r("Local Ads", N, N, Y, Y, Y),
    r("Local Deals", N, Y, Y, Y, Y),
    r("Directory Listing", N, Y, Y, Y, Y),
    r("Verified Business", N, N, Y, Y, Y),
    r("Bookings", N, N, Y, Y, Y),
    r("Local Analytics", N, N, Y, Y, Y),
  ]},
  { id: "ent", name: "Enterprise Control", rows: [
    r("Founder Dashboard", N, N, N, Y, Y),
    r("Enterprise Dashboard", N, N, N, Y, Y),
    r("Control Center", N, N, N, N, Y),
    r("Command Center", N, N, N, N, Y),
    r("Audit Log", N, N, Y, Y, Y),
    r("User Directory", N, N, Y, Y, Y),
    r("Team Directory", N, N, Y, Y, Y),
    r("Workspace Directory", N, N, N, Y, Y),
    r("Role Management", N, N, Y, Y, Y),
    r("Permission Sets", N, N, N, Y, Y),
    r("Delegation", N, N, N, Y, Y),
    r("Impersonation", N, N, N, N, Y),
    r("Session Management", N, N, Y, Y, Y),
    r("Data Retention Policies", N, N, N, Y, Y),
    r("Legal Hold", N, N, N, N, Y),
    r("Multi-tenant", N, N, N, Y, Y),
    r("Multi-region", N, N, N, N, Y),
    r("Data Residency", N, N, N, N, Y),
    r("On-Prem / VPC", N, N, N, N, Y),
    r("Air-gapped Deployment", N, N, N, N, Y),
  ]},
  { id: "dev", name: "Developer Platform", rows: [
    r("REST API", N, N, Y, Y, Y),
    r("GraphQL API", N, N, Y, Y, Y),
    r("Realtime API", N, N, Y, Y, Y),
    r("Streaming API", N, N, Y, Y, Y),
    r("SDK · JavaScript", N, N, Y, Y, Y),
    r("SDK · Python", N, N, Y, Y, Y),
    r("SDK · Mobile", N, N, Y, Y, Y),
    r("Plugins", N, N, Y, Y, Y),
    r("Skills", N, Y, Y, Y, Y),
    r("OAuth", N, N, Y, Y, Y),
    r("Webhooks", N, N, Y, Y, Y),
    r("Sandbox", N, N, Y, Y, Y),
    r("Developer Portal", N, N, Y, Y, Y),
    r("CLI", N, N, Y, Y, Y),
    r("Rate Limits", "Low", "Standard", "High", "High", "Custom"),
    r("Custom Endpoints", N, N, N, Y, Y),
    r("Dev Environments", N, N, Y, Y, Y),
    r("Staging Env", N, N, N, Y, Y),
    r("Testing Framework", N, N, Y, Y, Y),
    r("API Metrics", N, N, Y, Y, Y),
    r("API Playground", N, N, Y, Y, Y),
    r("Function Runtime", N, N, N, Y, Y),
    r("Custom Skills", N, Y, Y, Y, Y),
    r("Skills Marketplace", N, Y, Y, Y, Y),
    r("White-label SDK", N, N, N, N, Y),
  ]},
  { id: "auto", name: "Automation Runtime", rows: [
    r("Triggers", N, N, Y, Y, Y),
    r("Scheduled Jobs", N, N, Y, Y, Y),
    r("Event Automations", N, N, Y, Y, Y),
    r("Workflow Builder", N, N, Y, Y, Y),
    r("Multi-step Flows", N, N, Y, Y, Y),
    r("Approvals", N, N, N, Y, Y),
    r("Branching Logic", N, N, Y, Y, Y),
    r("Loops", N, N, Y, Y, Y),
    r("Retries", N, N, Y, Y, Y),
    r("Error Handling", N, N, Y, Y, Y),
    r("Human-in-the-loop", N, N, N, Y, Y),
    r("Cron Jobs", N, N, Y, Y, Y),
    r("Automation Analytics", N, N, Y, Y, Y),
    r("Automation Templates", N, N, Y, Y, Y),
    r("Automation Marketplace", N, N, N, Y, Y),
  ]},
  { id: "anly", name: "Analytics", rows: [
    r("Dashboards", N, N, Y, Y, Y),
    r("Custom Reports", N, N, Y, Y, Y),
    r("Scheduled Reports", N, N, N, Y, Y),
    r("Data Explorer", N, N, N, Y, Y),
    r("KPIs", N, N, Y, Y, Y),
    r("Cohorts", N, N, N, Y, Y),
    r("Funnels", N, N, N, Y, Y),
    r("Retention", N, N, N, Y, Y),
    r("Attribution", N, N, N, Y, Y),
    r("Segment Builder", N, N, N, Y, Y),
    r("AI Insights", N, N, Y, Y, Y),
    r("Anomaly Detection", N, N, N, Y, Y),
    r("Forecasting", N, N, N, Y, Y),
    r("Real-time Analytics", N, N, N, Y, Y),
    r("Data Export", N, Y, Y, Y, Y),
  ]},
  { id: "sec", name: "Security", rows: [
    r("Encryption at Rest", Y, Y, Y, Y, Y),
    r("Encryption in Transit", Y, Y, Y, Y, Y),
    r("Field-level Encryption", N, N, N, N, Y),
    r("MFA", Y, Y, Y, Y, Y),
    r("SSO / SAML", N, N, N, N, Y),
    r("OIDC", N, N, N, N, Y),
    r("Azure AD", N, N, N, N, Y),
    r("Okta", N, N, N, N, Y),
    r("Google Workspace SSO", N, N, N, N, Y),
    r("Custom IdP", N, N, N, N, Y),
    r("RBAC", N, N, Y, Y, Y),
    r("RLS", Y, Y, Y, Y, Y),
    r("ABAC", N, N, N, N, Y),
    r("IP Allowlist", N, N, N, Y, Y),
    r("Device Trust", N, N, N, N, Y),
    r("Session Timeout", N, Y, Y, Y, Y),
    r("Password Policy", Y, Y, Y, Y, Y),
    r("Audit Logs", N, N, Y, Y, Y),
    r("SIEM Export", N, N, N, N, Y),
    r("Anomaly Alerts", N, N, N, Y, Y),
    r("Secrets Vault", N, N, Y, Y, Y),
    r("Data Masking", N, N, N, Y, Y),
    r("Pen-test Reports", N, N, N, N, Y),
    r("Bug Bounty", N, N, N, N, Y),
    r("Vulnerability Scans", N, N, N, Y, Y),
  ]},
  { id: "comp", name: "Compliance", rows: [
    r("SOC 2 Ready", N, N, N, Y, Y),
    r("ISO 27001", N, N, N, N, Y),
    r("GDPR", N, N, Y, Y, Y),
    r("DPDP (India)", N, N, Y, Y, Y),
    r("HIPAA Ready", N, N, N, N, Y),
    r("PCI-DSS", Y, Y, Y, Y, Y),
    r("CCPA", N, N, N, Y, Y),
    r("Responsible AI Policy", Y, Y, Y, Y, Y),
    r("Model Cards", N, N, Y, Y, Y),
    r("DPA Available", N, N, N, Y, Y),
    r("BAA Available", N, N, N, N, Y),
    r("Data Residency", N, N, N, N, Y),
    r("Right to Delete", Y, Y, Y, Y, Y),
    r("Data Export", Y, Y, Y, Y, Y),
    r("Retention Policies", N, N, N, Y, Y),
    r("Audit Trail Export", N, N, N, Y, Y),
  ]},
  { id: "sup", name: "Support & Success", rows: [
    r("Community Support", Y, Y, Y, Y, Y),
    r("Email Support", N, Y, Y, Y, Y),
    r("Chat Support", N, N, Y, Y, Y),
    r("Priority Support", N, N, Y, Y, Y),
    r("Phone Support", N, N, N, Y, Y),
    r("Dedicated CSM", N, N, N, N, Y),
    r("Solution Architect", N, N, N, N, Y),
    r("Onboarding", "Self", "Self", "Guided", "Guided", "White-Glove"),
    r("Training Sessions", N, N, N, Y, Y),
    r("SLA Response", "—", "48h", "24h", "8h", "1h"),
    r("SLA Uptime", "—", "—", "99.5%", "99.9%", "99.99%"),
    r("Quarterly Business Review", N, N, N, N, Y),
    r("Migration Assistance", N, N, N, Y, Y),
    r("Data Import Help", N, Y, Y, Y, Y),
    r("Success Playbooks", N, N, Y, Y, Y),
  ]},
  { id: "intg", name: "Integrations", rows: [
    r("Google Workspace", N, Y, Y, Y, Y),
    r("Microsoft 365", N, Y, Y, Y, Y),
    r("Slack", N, N, Y, Y, Y),
    r("Discord", N, N, Y, Y, Y),
    r("Teams", N, N, Y, Y, Y),
    r("WhatsApp", N, Y, Y, Y, Y),
    r("Zoom", N, N, Y, Y, Y),
    r("Shopify", N, N, N, Y, Y),
    r("WooCommerce", N, N, N, Y, Y),
    r("Notion", N, Y, Y, Y, Y),
    r("GitHub", N, N, Y, Y, Y),
    r("Zapier", N, N, Y, Y, Y),
    r("Make", N, N, Y, Y, Y),
    r("Jira", N, N, Y, Y, Y),
    r("ClickUp", N, N, Y, Y, Y),
    r("Trello", N, N, Y, Y, Y),
    r("Asana", N, N, Y, Y, Y),
    r("Stripe", N, N, Y, Y, Y),
    r("Razorpay", N, N, Y, Y, Y),
    r("PayPal", N, N, Y, Y, Y),
    r("Twilio", N, N, Y, Y, Y),
    r("SendGrid", N, N, Y, Y, Y),
    r("HubSpot", N, N, N, Y, Y),
    r("Salesforce", N, N, N, N, Y),
    r("Custom Integrations", N, N, N, N, Y),
  ]},
  { id: "fut", name: "Future Included", rows: [
    r("AI Agents", N, N, Y, Y, Y),
    r("Enterprise Brain", N, N, N, Y, Y),
    r("Automation Runtime", N, N, N, Y, Y),
    r("Workflow Runtime", N, N, N, Y, Y),
    r("Enterprise Intelligence", N, N, N, Y, Y),
    r("Plugins Marketplace", N, N, Y, Y, Y),
    r("Developer Platform", N, N, Y, Y, Y),
    r("Skills Marketplace", N, Y, Y, Y, Y),
    r("Digital Twin Ready", N, N, N, N, Y),
    r("IoT Ready", N, N, N, N, Y),
    r("Robotics Ready", N, N, N, N, Y),
    r("AR / VR Ready", N, N, N, N, Y),
    r("Voice AI Ready", N, N, Y, Y, Y),
    r("Global Rollout", N, N, N, N, Y),
    r("Autonomous Enterprise", N, N, N, N, Y),
  ]},
];

const TOTAL_ROWS = MATRIX.reduce((n, c) => n + c.rows.length, 0);

/* ─────────────── Content blocks ─────────────── */
const INTEGRATIONS = ["Google","Microsoft","GitHub","Slack","Discord","Teams","Zoom","WhatsApp","Shopify","WooCommerce","Stripe","Razorpay","PayPal","Zapier","Make","Notion","ClickUp","Trello","Asana","Jira"];
const PAYMENTS = ["UPI","Cards","Net Banking","Wallet","Stripe","PayPal","Razorpay","GST Invoice","Bank Transfer","Purchase Order"];

const TRUST = [
  { title: "SOC Ready",       copy: "Continuous enterprise controls & audit." },
  { title: "Encryption",      copy: "AES-256 at rest, TLS 1.3 in transit." },
  { title: "Audit Logs",      copy: "Every action tracked and exportable." },
  { title: "RBAC + RLS",      copy: "Row-level & role-based enforcement." },
  { title: "Privacy",         copy: "You own your data. Export any time." },
  { title: "Responsible AI",  copy: "Guardrails, transparency, model cards." },
  { title: "Compliance",      copy: "SOC 2 · ISO 27001 · GDPR · DPDP." },
  { title: "Backups",         copy: "Daily by default. Real-time on Enterprise." },
  { title: "Monitoring",      copy: "24×7 uptime, latency & anomaly alerts." },
  { title: "99.9% Uptime",    copy: "Sovereign, resilient global runtime." },
];

const COUNTER = [
  { value: "250+",    label: "Core Modules" },
  { value: "700+",    label: "Enterprise Components" },
  { value: "4,000+",  label: "Subsystems" },
  { value: "20,000+", label: "Capabilities" },
];

const MODULES: Array<{ icon: React.ElementType; name: string; copy: string }> = [
  { icon: Building2,   name: "Business OS",         copy: "CRM · ERP · HRMS · Finance · Projects." },
  { icon: GraduationCap,name:"Education OS",         copy: "Teachers, tutors, courses, classrooms." },
  { icon: Palette,     name: "Creator OS",          copy: "Image · Video · Voice · Marketing." },
  { icon: Database,    name: "Knowledge OS",        copy: "Documents · Research · Semantic search." },
  { icon: Users,       name: "Community",           copy: "Feed · Groups · Messages · Events." },
  { icon: Briefcase,   name: "Marketplace",         copy: "Products · Services · Vendors." },
  { icon: Globe,       name: "Hyperlocal",          copy: "Businesses · Jobs · Nearby." },
  { icon: Landmark,    name: "Enterprise",          copy: "Multi-tenant · Multi-brand · Global." },
  { icon: Bot,         name: "Digital Human",       copy: "One AI face for every capability." },
  { icon: Cpu,         name: "Enterprise Brain",    copy: "Intent → Plan → Execute → Learn." },
  { icon: Zap,         name: "Runtime",             copy: "Autonomous execution engine." },
  { icon: Code2,       name: "Developer Platform",  copy: "API · SDK · Sandbox · Portal." },
  { icon: Puzzle,      name: "Plugins",             copy: "Extend HAPPY with third-party apps." },
  { icon: Sparkles,    name: "Skills Marketplace",  copy: "Package skills. Sell skills. Use skills." },
  { icon: ArrowRightLeft, name: "Automation",       copy: "Triggers · Workflows · Approvals." },
  { icon: LineChart,   name: "Analytics",           copy: "Dashboards · KPIs · Forecasts." },
  { icon: Shield,      name: "Security",            copy: "SOC · SSO · RBAC · RLS · Audit." },
  { icon: Layers,      name: "Operations",          copy: "Health · Deployments · SLOs." },
  { icon: Radio,       name: "Monitoring",          copy: "Uptime · Latency · Anomalies." },
];

const HAPPY_VS: Array<{ feature: string } & Record<"happy"|"chatgpt"|"claude"|"gemini"|"copilot"|"notion"|"erp"|"crm"|"lms"|"hrms", string>> = [
  { feature: "Unified Digital Human",         happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Enterprise Brain runtime",       happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: "Partial", notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Business OS · CRM · ERP · HRMS", happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: "Partial", crm: "Partial", lms: N,       hrms: "Partial" },
  { feature: "Education OS",                    happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: N,       crm: N,       lms: "Partial", hrms: N },
  { feature: "Creator OS",                      happy: Y, chatgpt: "Partial", claude: N,   gemini: "Partial", copilot: "Partial", notion: "Partial", erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Voice + Vision + Presentation",   happy: Y, chatgpt: "Partial", claude: "Partial", gemini: "Partial", copilot: "Partial", notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Autonomous Runtime",              happy: Y, chatgpt: "Partial", claude: N,       gemini: "Partial", copilot: "Partial", notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Plugins + Skills Marketplace",    happy: Y, chatgpt: "Partial", claude: N,       gemini: N,       copilot: "Partial", notion: "Partial", erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "SSO · SOC · Compliance",          happy: Y, chatgpt: "Partial", claude: "Partial", gemini: "Partial", copilot: Y,       notion: "Partial", erp: "Partial", crm: "Partial", lms: "Partial", hrms: "Partial" },
  { feature: "Dedicated / On-Prem Deployment",  happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: "Partial", crm: "Partial", lms: N,       hrms: N },
  { feature: "Own your data · Export anytime",  happy: Y, chatgpt: "Partial", claude: "Partial", gemini: "Partial", copilot: "Partial", notion: Y,       erp: Y,       crm: Y,       lms: Y,       hrms: Y },
  { feature: "Custom Digital Human",            happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
  { feature: "Single price, everything unified",happy: Y, chatgpt: N,       claude: N,       gemini: N,       copilot: N,       notion: N,       erp: N,       crm: N,       lms: N,       hrms: N },
];

const VS_COLS: Array<{ key: keyof (typeof HAPPY_VS)[number]; label: string }> = [
  { key: "happy",   label: "HAPPY" },
  { key: "chatgpt", label: "ChatGPT" },
  { key: "claude",  label: "Claude" },
  { key: "gemini",  label: "Gemini" },
  { key: "copilot", label: "Copilot" },
  { key: "notion",  label: "Notion AI" },
  { key: "erp",     label: "Traditional ERP" },
  { key: "crm",     label: "Traditional CRM" },
  { key: "lms",     label: "Traditional LMS" },
  { key: "hrms",    label: "Traditional HRMS" },
];

const USE_CASES: Array<{ icon: React.ElementType; name: string; copy: string; plan: string }> = [
  { icon: GraduationCap, name: "Students",     copy: "AI Tutor, notes, flashcards, study plans, exam prep.",   plan: "Starter" },
  { icon: PenTool,       name: "Teachers",     copy: "AI Professor, classrooms, assessments, courses.",        plan: "Pro" },
  { icon: Building2,     name: "Businesses",   copy: "CRM, ERP, HRMS, Automation, Founder Dashboard.",         plan: "Business" },
  { icon: Rocket,        name: "Startups",     copy: "Ship faster with Digital Human + automation.",           plan: "Pro" },
  { icon: Factory,       name: "Manufacturer", copy: "Production, warehouse, IoT-ready, digital twin ready.",   plan: "Business" },
  { icon: Hospital,      name: "Hospitals",    copy: "Patient ops, scheduling, HIPAA-ready deployment.",        plan: "Enterprise" },
  { icon: Stethoscope,   name: "Clinics",      copy: "Appointments, records, AI triage assistant.",             plan: "Business" },
  { icon: GraduationCap, name: "Schools",      copy: "Multi-campus, student CRM, AI teaching assistants.",     plan: "Enterprise" },
  { icon: Code2,         name: "Developers",   copy: "API, SDK, plugins, skills, sandbox, portal.",             plan: "Pro" },
  { icon: Palette,       name: "Creators",     copy: "Image, Video, Voice, Presentation, Marketing.",           plan: "Pro" },
  { icon: Landmark,      name: "Government",   copy: "Sovereign deployment, audit, compliance, residency.",    plan: "Enterprise" },
  { icon: UtensilsCrossed,name:"Restaurants",  copy: "Orders, menu, POS, delivery, loyalty.",                  plan: "Business" },
  { icon: Users,         name: "NGOs",         copy: "50% off, community, events, donations, volunteers.",     plan: "Starter" },
  { icon: Building2,     name: "Company",      copy: "Unlimited teams, unlimited workspaces, analytics.",       plan: "Business" },
  { icon: Landmark,      name: "Enterprise",   copy: "Dedicated Digital Human, dedicated runtime.",             plan: "Enterprise" },
];

const AUDIENCES: Array<{ id: string; label: string; icon: React.ElementType; plan: TierId; reason: string; saves: string }> = [
  { id: "student",    label: "Student",     icon: GraduationCap, plan: "starter",    reason: "AI Tutor + notes + study plans keep you learning faster.",           saves: "₹8,000 / mo in coaching" },
  { id: "teacher",    label: "Teacher",     icon: PenTool,       plan: "pro",        reason: "AI Professor + assessments + lesson planner in one place.",           saves: "₹15,000 / mo in prep time" },
  { id: "business",   label: "Business",    icon: Building2,     plan: "business",   reason: "Unified CRM · ERP · HRMS with an AI advisor.",                        saves: "₹1,20,000 / mo in tools" },
  { id: "startup",    label: "Startup",     icon: Rocket,        plan: "pro",        reason: "Ship faster with a Digital Human co-founder + automation.",           saves: "₹60,000 / mo in headcount" },
  { id: "company",    label: "Company",     icon: Building2,     plan: "business",   reason: "Business OS + analytics + workflow automation.",                       saves: "₹2,50,000 / mo consolidation" },
  { id: "developer",  label: "Developer",   icon: Code2,         plan: "pro",        reason: "API · SDK · plugins · skills · sandbox · portal.",                     saves: "₹40,000 / mo infra" },
  { id: "enterprise", label: "Enterprise",  icon: Landmark,      plan: "enterprise", reason: "Dedicated runtime, SSO, SOC, custom Digital Human.",                    saves: "Millions in consolidation" },
  { id: "government", label: "Government",  icon: Landmark,      plan: "enterprise", reason: "Sovereign deployment, audit, compliance, residency.",                   saves: "Sovereign cost model" },
  { id: "hospital",   label: "Hospital",    icon: Hospital,      plan: "enterprise", reason: "HIPAA-ready deployment + patient operations.",                          saves: "40% ops overhead" },
  { id: "school",     label: "School",      icon: GraduationCap, plan: "enterprise", reason: "Multi-campus, student CRM, AI teaching assistants.",                    saves: "₹5L+ / mo tool spend" },
  { id: "factory",    label: "Manufacturer",icon: Factory,       plan: "business",   reason: "Manufacturing, warehouse, quality, IoT-ready.",                         saves: "30% ops overhead" },
  { id: "restaurant", label: "Restaurant",  icon: UtensilsCrossed,plan:"business",   reason: "POS, menu, orders, delivery, loyalty.",                                 saves: "20% margin uplift" },
];

const TIMELINE = [
  { phase: "v1", copy: "Foundations · Digital Human · UI System (Completed)." },
  { phase: "v2", copy: "AI Agents · Enterprise Modules · Runtime Scaffolding." },
  { phase: "v3", copy: "Enterprise Brain · Autonomous Runtime · 250+ modules." },
  { phase: "v4", copy: "Global Platform · Multi-region · Multi-brand." },
  { phase: "v5", copy: "Enterprise Cloud · Sovereign · Dedicated deployments." },
  { phase: "v6", copy: "Autonomous Enterprise · Self-running organizations." },
];

const MIGRATION: Array<{ from: string; copy: string }> = [
  { from: "ChatGPT",  copy: "Import conversations & prompts. Add reasoning + Digital Human." },
  { from: "Notion",   copy: "Import pages, databases, workspaces into HAPPY Knowledge." },
  { from: "ERP",      copy: "Import products, orders, vendors, ledgers via CSV or API." },
  { from: "CRM",      copy: "Import leads, contacts, deals, pipelines with field mapping." },
  { from: "LMS",      copy: "Import courses, lessons, assessments, and students." },
  { from: "CSV",      copy: "Bulk import any structured data with schema mapping." },
  { from: "Excel",    copy: "Drop in Excel workbooks. HAPPY infers types automatically." },
  { from: "Database", copy: "Direct database import via secure connectors and mapping." },
  { from: "Google",   copy: "Docs, Sheets, Calendar and Drive with a single click." },
];

const STORIES: Array<{ industry: string; problem: string; solution: string; roi: string }> = [
  { industry: "SaaS Startup",     problem: "5 disconnected tools, 30% time lost to switching.",   solution: "Unified Business OS + Digital Human + Automation.", roi: "3.2× productivity · ₹18L/yr saved" },
  { industry: "Manufacturing",    problem: "Manual production planning, downtime blind spots.",   solution: "ERP + Manufacturing + real-time monitoring.",       roi: "28% downtime reduction" },
  { industry: "K-12 School",      problem: "Fragmented LMS, admin, parent comms.",                 solution: "Education OS + Digital Human + Parent Portal.",     roi: "45% admin time saved" },
  { industry: "D2C Brand",        problem: "Slow content ops, low creative throughput.",           solution: "Creator OS + Marketing Studio + Automation.",       roi: "4× content velocity" },
  { industry: "Hospital Network", problem: "Patient scheduling chaos across branches.",            solution: "Enterprise + HRMS + patient ops workflows.",         roi: "22% throughput uplift" },
  { industry: "Government Body",  problem: "Data residency + audit + sovereign deployment.",       solution: "Enterprise · dedicated · on-prem · full audit.",     roi: "100% compliance passed" },
];

const FAQ: Array<{ q: string; a: string }> = [
  { q: "How does the subscription work?", a: "Every plan is billed on your chosen cycle and renews automatically until you cancel." },
  { q: "Is there really a free plan?", a: "Yes. Free is truly free, forever. No card required." },
  { q: "Do you offer refunds?", a: "Every paid plan is covered by a 30-day money-back guarantee." },
  { q: "Can I upgrade later?", a: "Yes. Upgrades apply instantly with a pro-rated charge." },
  { q: "Can I downgrade later?", a: "Yes. Downgrades apply at the end of your current billing cycle." },
  { q: "What does Enterprise include?", a: "Custom-quoted based on scale, deployment, integrations, SLAs, security tier and support depth." },
  { q: "How is data secured?", a: "AES-256 at rest, TLS 1.3 in transit. RBAC and RLS enforced by default." },
  { q: "Do you support SSO?", a: "Yes on Enterprise: SAML, OIDC, Azure AD, Okta, Google Workspace and custom IdPs." },
  { q: "Do you have SOC / ISO / GDPR?", a: "SOC 2 ready. ISO 27001 aligned. Full GDPR and DPDP support on Business and Enterprise." },
  { q: "Which payment methods work?", a: "UPI, Cards, Net Banking, Wallets, Razorpay, Stripe, PayPal. Enterprise adds PO and bank transfer." },
  { q: "Is GST included?", a: "Prices exclude GST. A GST-compliant invoice is generated for every payment." },
  { q: "How do I cancel?", a: "One click, from your account. No cancellation fees, ever." },
  { q: "When does my plan renew?", a: "On the same calendar date each cycle. We remind you 3 days in advance." },
  { q: "Do you support multi-year plans?", a: "Yes. Save 30% on 3-year and 40% on 5-year commitments." },
  { q: "Discounts for students or NGOs?", a: "Verified students, teachers, and non-profits get up to 50% off Starter and Pro." },
  { q: "Team & workspace limits?", a: "Business includes unlimited teams and workspaces. Enterprise adds unlimited companies and brands." },
  { q: "Do I own my data?", a: "Always. Export anytime, delete on demand. We never train foundation models on your data." },
  { q: "Do you offer white-label?", a: "Yes on Enterprise. Full white-label with your brand, domain and dedicated Digital Human." },
  { q: "Can I self-host?", a: "Yes on Enterprise via dedicated deployment — cloud, VPC or on-prem." },
  { q: "How do I talk to sales?", a: "Book a demo, schedule a meeting or request an Enterprise quote below." },
  { q: "Is my data used to train HAPPY?", a: "Never. Your data is yours. We only use anonymised telemetry to improve reliability." },
  { q: "Where is my data stored?", a: "Regional cloud on Business. Configurable data residency on Enterprise." },
  { q: "Can I bring my own model?", a: "Yes on Enterprise. Attach OpenAI, Anthropic, Google, or private endpoints." },
  { q: "What SLAs do you offer?", a: "99.5% Pro · 99.9% Business · 99.99% Enterprise, with credits on breach." },
  { q: "Is support available in my language?", a: "English by default. Enterprise adds multi-language 24×7 support." },
  { q: "Is there a partner program?", a: "Yes. Solution, Reseller, and Technology partners. Apply from Contact." },
  { q: "How long does onboarding take?", a: "Self-serve is instant. Business is 1–2 weeks guided. Enterprise is white-glove." },
  { q: "How do you handle rate limits?", a: "Low on Free, Standard on Starter, High on Pro/Business, Custom on Enterprise." },
  { q: "What if I outgrow a plan?", a: "Upgrade instantly. Enterprise plans scale linearly with usage bands." },
  { q: "Can I try Enterprise before buying?", a: "Yes. Enterprise pilots run 30–90 days with a dedicated success manager." },
  { q: "Do you offer training?", a: "Guided training on Business, and structured programs on Enterprise." },
  { q: "Do you have an uptime page?", a: "Yes. Public status with historical incidents and post-mortems." },
  { q: "Can I export audit logs?", a: "Yes on Pro+. SIEM export on Enterprise." },
  { q: "Do you support offline?", a: "Read-only offline on mobile. Full offline mode planned on Enterprise." },
  { q: "Is there a nonprofit tier?", a: "Yes. 50% off any paid plan for verified non-profits." },
  { q: "Can I gift a plan?", a: "Yes. Any plan can be gifted from checkout." },
  { q: "Do you offer education pricing?", a: "Yes. Verified schools and universities get bulk pricing." },
  { q: "Do you offer government pricing?", a: "Yes. Sovereign deployments and public-sector agreements." },
  { q: "How do integrations work?", a: "Native integrations, plus Zapier/Make, plus webhooks and API on Pro+." },
  { q: "Can I build custom skills?", a: "Yes. Publish public or private skills from Starter onwards." },
  { q: "How do plugins get approved?", a: "Automated safety review + human review for publish-to-marketplace." },
  { q: "Do you support voice cloning?", a: "Yes, with consent, from Business onwards." },
  { q: "How do I know HAPPY is safe?", a: "Guardrails, model cards, red-team, pen-test, bug bounty — all in place." },
  { q: "How often do you ship?", a: "Weekly to Cloud, monthly to Enterprise stable, quarterly to on-prem." },
  { q: "Do you offer credits for outages?", a: "Yes. Automatic service credits on SLA breach, per contract." },
  { q: "What happens to my data if I cancel?", a: "Retained per your policy or exported and deleted on request." },
  { q: "Can I pay in USD?", a: "Yes. USD, EUR, GBP, AED, SGD supported at checkout for eligible plans." },
  { q: "Do you have a mobile app?", a: "Yes. iOS and Android with feature parity for the core experience." },
  { q: "Can I get an invoice in my company name?", a: "Yes. Fully editable billing info and GST/VAT fields." },
  { q: "Is HAPPY safe for regulated industries?", a: "Enterprise is designed for regulated deployments with residency and audit controls." },
];

const CONTACT: Array<{ title: string; copy: string; cta: string; icon: React.ElementType }> = [
  { title: "Talk To HAPPY",       copy: "Chat with the live Digital Human right now.",  cta: "Start Chat",     icon: Bot },
  { title: "Book Demo",           copy: "See the full platform in 30 minutes.",          cta: "Book Demo",      icon: Calendar },
  { title: "Schedule Call",       copy: "Pick a time that works for your team.",         cta: "Schedule",       icon: MessageSquare },
  { title: "Contact Sales",       copy: "Discuss pricing, scale and deployment.",        cta: "Contact Sales",  icon: Phone },
  { title: "Become Partner",      copy: "Solution · Reseller · Technology programs.",    cta: "Apply",          icon: Trophy },
  { title: "Developer Portal",    copy: "APIs, SDKs, plugins and skills.",               cta: "Open Portal",    icon: Code2 },
  { title: "Enterprise Quote",    copy: "Custom-quoted for your organization.",          cta: "Request Quote",  icon: FileText },
  { title: "Start Free",          copy: "No card. Full experience. Ready in seconds.",   cta: "Start Free",     icon: Rocket },
];

/* ─────────────── Small hooks ─────────────── */
function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  useEffect(() => {
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
  }, [target, ms]);
  return v;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* Magnetic button wrapper */
const Magnetic = memo(function Magnetic({ children, className = "", strength = 12 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = "translate3d(0,0,0)"; };
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={reset} className={`will-change-transform transition-transform duration-200 ${className}`}>
      {children}
    </div>
  );
});

const tierAccent = (i: number, featured?: boolean) =>
  featured ? "text-gold" : i === 0 ? "text-soft-gray" : "text-paper";

/* ─────────────── Component ─────────────── */
export function PricingExperience() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [audience, setAudience] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MATRIX.map((c) => [c.id, true])),
  );
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [hoveredTier, setHoveredTier] = useState<TierId | null>(null);

  // ROI
  const [emp, setEmp]         = useState(25);
  const [revenue, setRevenue] = useState(1000000); // ₹ / month
  const [hours, setHours]     = useState(5);
  const [salary, setSalary]   = useState(50000);
  const hourly = salary / 22 / 8;
  const monthlySavings = Math.round(emp * hours * 4 * hourly);
  const annualSavings  = monthlySavings * 12;
  const fiveYearSavings = annualSavings * 5;
  const cMonthly = useCountUp(monthlySavings, 500);
  const cAnnual  = useCountUp(annualSavings, 700);
  const c5y      = useCountUp(fiveYearSavings, 900);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MATRIX;
    return MATRIX
      .map((c) => ({ ...c, rows: c.rows.filter((row) => row.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) }))
      .filter((c) => c.rows.length > 0);
  }, [query]);

  const toggleCat = (id: string) => setOpenCats((s) => ({ ...s, [id]: !s[id] }));
  const recommended = audience ? AUDIENCES.find((a) => a.id === audience) : null;

  /* Cursor spotlight */
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const on = (e: globalThis.MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    };
    el.addEventListener("mousemove", on, { passive: true });
    return () => { el.removeEventListener("mousemove", on); cancelAnimationFrame(raf); };
  }, [reduced]);

  const handlePrint = () => window.print();
  const handleExport = (format: "csv" | "pdf") => {
    const rows: string[] = [];
    rows.push(["Category", "Capability", ...TIERS.map((t) => t.name)].join(","));
    MATRIX.forEach((cat) => cat.rows.forEach((row) => {
      rows.push([cat.name, row.label, ...row.values.map((v) => `"${v}"`)].join(","));
    }));
    if (format === "pdf") {
      // Lightweight print-to-PDF via native browser dialog.
      window.print();
      return;
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "happy-pricing-v4.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="pricing"
      ref={rootRef}
      aria-labelledby="pricing-heading"
      className="relative isolate border-t border-gold/10 py-24"
    >
      {/* Cursor spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-70 motion-reduce:hidden"
        style={{
          background: "radial-gradient(600px circle at var(--mx, 50%) var(--my, 20%), rgba(232,201,106,0.10), transparent 60%)",
          transition: "background 100ms linear",
        }}
      />
      {/* Ambient gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.18),transparent_70%)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(232,201,106,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ═══ SECTION 1 · Live Digital Human Sales Advisor ═══ */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-charcoal/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold backdrop-blur">
              <Sparkle className="h-3.5 w-3.5 motion-safe:animate-pulse" />
              Pricing Experience v4.0 · Ultimate Enterprise
            </div>
            <h2 id="pricing-heading" className="mt-6 font-display text-4xl font-semibold leading-[1.03] tracking-tight text-paper md:text-6xl">
              Talk to <span className="bg-gradient-to-r from-gold via-paper to-gold bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-[shimmer_4s_linear_infinite]">HAPPY</span> — your Digital Human sales advisor.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-soft-gray md:text-lg">
              Ask about plans, features, pricing, deployment or ROI. HAPPY answers in real time — with voice, whiteboard, and live presentation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: MessageSquare, label: "Chat Demo" },
                { icon: Volume2,       label: "Voice Demo" },
                { icon: Presentation,  label: "Presentation" },
                { icon: PenTool,       label: "Whiteboard" },
              ].map(({ icon: Icon, label }) => (
                <Magnetic key={label}>
                  <button type="button" className="group inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-4 py-2 text-[12.5px] font-medium text-paper transition-all duration-200 hover:border-gold/50 hover:bg-obsidian/80 hover:shadow-[0_0_24px_-8px_rgba(232,201,106,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
                    <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {label}
                    <ArrowRight className="h-3 w-3 text-gold opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                </Magnetic>
              ))}
            </div>
          </div>

          {/* Live Digital Human panel */}
          <div className="relative rounded-[2rem] border border-gold/25 bg-gradient-to-b from-charcoal via-charcoal to-obsidian p-6 shadow-[0_0_80px_-25px_rgba(232,201,106,0.55)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(232,201,106,0.18),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                  <Bot className="h-8 w-8 text-gold" aria-hidden />
                  <span aria-hidden className="absolute inset-0 rounded-full border border-gold/40 motion-safe:animate-ping" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-gold">HAPPY · Live · Advisor</div>
                  <p className="mt-1 text-[14px] leading-relaxed text-paper">
                    {hoveredTier
                      ? `That's the ${TIERS.find(t => t.id === hoveredTier)?.name} plan — ${TIERS.find(t => t.id === hoveredTier)?.copy}`
                      : "Hi — I'm HAPPY. Hover any plan and I'll explain it. Tell me who you are for a recommendation."}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
                <div className="text-[11px] uppercase tracking-widest text-soft-gray">Live conversion snapshot</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="numeric font-display text-3xl font-semibold text-gold">₹{cAnnual.toLocaleString("en-IN")}</span>
                  <span className="text-[12px] text-soft-gray">/yr potential team savings</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
                  <div className="h-full bg-gradient-to-r from-gold via-paper to-gold transition-[width] duration-500" style={{ width: `${Math.min(100, Math.round((annualSavings / 5000000) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2 · AI Recommendation Wizard ═══ */}
        <div className="mt-20 rounded-3xl border border-gold/20 bg-charcoal/70 p-6 backdrop-blur md:p-8">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Sparkles className="h-3 w-3" /> AI Recommendation Wizard
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold text-paper md:text-3xl">Not sure which plan?</h3>
              <p className="mt-1 text-sm text-soft-gray">Tell HAPPY who you are — get the plan, the reason, and estimated savings.</p>
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
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 motion-safe:hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    active ? "border-gold bg-gold text-obsidian shadow-[0_0_24px_-4px_rgba(232,201,106,0.75)]"
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
            <div className="mt-6 grid gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-obsidian via-charcoal to-obsidian p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-gold">HAPPY recommends</div>
                <div className="mt-1 font-display text-2xl font-semibold text-paper">
                  {TIERS.find((t) => t.id === recommended.plan)?.name}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-soft-gray">{recommended.reason}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold">
                  <TrendingUp className="h-3 w-3" /> Est. savings: {recommended.saves}
                </div>
              </div>
              <Magnetic>
                <a href="#plans" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-[13px] font-semibold text-obsidian shadow-[0_0_24px_-4px_rgba(232,201,106,0.7)] transition-transform hover:scale-[1.03]">
                  Jump to plan <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Magnetic>
            </div>
          )}
        </div>

        {/* ═══ SECTION 3 · Billing toggle ═══ */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div role="tablist" aria-label="Billing cycle" className="inline-flex flex-wrap items-center gap-1 rounded-full border border-gold/25 bg-charcoal/70 p-1 backdrop-blur">
            {(Object.keys(CYCLE_META) as Cycle[]).map((c) => {
              const meta = CYCLE_META[c];
              const active = cycle === c;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={active}
                  disabled={meta.disabled}
                  onClick={() => !meta.disabled && setCycle(c)}
                  className={`relative rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    active ? "bg-gold text-obsidian shadow-[0_0_20px_-4px_rgba(232,201,106,0.7)]"
                           : meta.disabled ? "cursor-not-allowed text-soft-gray/50"
                           : "text-soft-gray hover:text-paper"
                  }`}
                >
                  {meta.label}
                  {meta.discount && !active && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.disabled ? "bg-obsidian text-soft-gray" : "bg-gold/15 text-gold"}`}>{meta.discount}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[11.5px] uppercase tracking-widest text-soft-gray">
            {cycle === "yearly" ? "Save 20% billed yearly" :
             cycle === "3y" ? "Save 30% on 3-year commitment" :
             cycle === "5y" ? "Save 40% on 5-year commitment" :
             cycle === "lifetime" ? "Lifetime access coming soon" :
             "Switch to yearly or multi-year and save more."}
          </div>
        </div>

        {/* ═══ SECTION 4 · Pricing Cards ═══ */}
        <div id="plans" className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {TIERS.map((t, i) => {
            const p = cyclePrice(t, cycle);
            const isRec = recommended?.plan === t.id;
            return (
              <Magnetic key={t.id} strength={6}>
                <article
                  aria-label={`${t.name} plan`}
                  onMouseEnter={() => setHoveredTier(t.id)}
                  onMouseLeave={() => setHoveredTier((v) => (v === t.id ? null : v))}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 will-change-transform motion-safe:hover:-translate-y-1 focus-within:ring-2 focus-within:ring-gold/40 ${
                    t.featured
                      ? "border-gold/60 bg-gradient-to-b from-charcoal via-charcoal to-obsidian shadow-[0_0_80px_-20px_rgba(232,201,106,0.6)] xl:scale-[1.03]"
                      : "border-gold/15 bg-charcoal/80 backdrop-blur hover:border-gold/45 hover:shadow-[0_0_50px_-20px_rgba(232,201,106,0.5)]"
                  }`}
                >
                  {/* Animated border ring on hover */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
                    background: "conic-gradient(from var(--angle,0deg), transparent, rgba(232,201,106,0.35), transparent 40%)",
                    padding: "1px", WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude",
                  }} />
                  {t.featured && (
                    <>
                      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,201,106,0.20),transparent_60%)]" />
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-full border-x border-b border-gold/50 bg-gold px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-obsidian shadow-[0_4px_20px_-4px_rgba(232,201,106,0.7)]">Most Popular</div>
                    </>
                  )}
                  {isRec && !t.featured && (
                    <div className="absolute right-3 top-3 rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">AI Pick</div>
                  )}
                  <div className="relative flex h-full flex-col">
                    <div className={`text-[11px] uppercase tracking-widest ${tierAccent(i, t.featured)}`}>{t.name}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span key={`${t.id}-${cycle}`} className="numeric font-display text-[32px] font-semibold leading-none text-paper motion-safe:animate-fade-in">
                        {p.primary}
                      </span>
                      {p.secondary && <span className="text-[11.5px] text-soft-gray">{p.secondary}</span>}
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
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold transition-transform duration-200 motion-safe:hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                        t.featured ? "bg-gold text-obsidian shadow-[0_0_30px_-4px_rgba(232,201,106,0.75)]" : "border border-gold/25 text-paper hover:bg-gold/10"
                      }`}
                    >
                      {t.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </article>
              </Magnetic>
            );
          })}
        </div>

        {/* ═══ Counter ═══ */}
        <div className="mt-20 grid grid-cols-2 gap-4 rounded-3xl border border-gold/15 bg-charcoal/80 p-8 backdrop-blur md:grid-cols-4">
          {COUNTER.map((c) => (
            <div key={c.label} className="text-center">
              <div className="numeric font-display text-3xl font-semibold text-gold md:text-4xl">{c.value}</div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-soft-gray">{c.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 6 · Modules Included ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Every module. One platform.</h3>
          <p className="mt-2 text-sm text-soft-gray">Nineteen modules that would normally require twenty vendors.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {MODULES.map(({ icon: Icon, name, copy }) => (
              <article key={name} className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/80 p-5 backdrop-blur transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.6)]">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(232,201,106,0.10),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <div className="mt-3 text-[13.5px] font-semibold text-paper">{name}</div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-soft-gray">{copy}</div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 5 · Feature Matrix ═══ */}
        <div className="mt-24">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Feature comparison matrix</h3>
              <p className="mt-2 text-sm text-soft-gray">{TOTAL_ROWS}+ capabilities across {MATRIX.length} categories. Search, expand, print or export.</p>
            </div>
            <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
              <label className="relative min-w-[200px] flex-1">
                <span className="sr-only">Search features</span>
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-gray" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${TOTAL_ROWS}+ features…`}
                  className="w-full rounded-full border border-gold/20 bg-charcoal py-2.5 pl-9 pr-4 text-[13px] text-paper placeholder:text-soft-gray focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </label>
              <button type="button" onClick={() => setOpenCats(Object.fromEntries(MATRIX.map((c) => [c.id, true])))} className="rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50">Expand</button>
              <button type="button" onClick={() => setOpenCats(Object.fromEntries(MATRIX.map((c) => [c.id, false])))} className="rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50">Collapse</button>
              <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50"><Printer className="h-3.5 w-3.5" /> Print</button>
              <button type="button" onClick={() => handleExport("csv")} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50"><Download className="h-3.5 w-3.5" /> CSV</button>
              <button type="button" onClick={() => handleExport("pdf")} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:border-gold/50"><FileText className="h-3.5 w-3.5" /> PDF</button>
            </div>
          </div>

          <div className="mt-8 max-h-[720px] overflow-auto rounded-2xl border border-gold/15 bg-charcoal">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-20 bg-charcoal">
                <tr className="border-b border-gold/15 text-[11px] uppercase tracking-widest text-soft-gray">
                  <th scope="col" className="sticky left-0 z-30 bg-charcoal px-5 py-4 font-medium">Capability</th>
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
                          <th scope="row" className="sticky left-0 z-10 bg-inherit px-5 py-2.5 text-[12.5px] font-normal text-paper">{row.label}</th>
                          {row.values.map((v, idx) => (
                            <td key={idx} className={`px-4 py-2.5 text-[12.5px] ${v === "—" ? "text-soft-gray/60" : TIERS[idx].featured ? "text-gold" : "text-paper"}`}>{v}</td>
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

        {/* ═══ SECTION 7 · Enterprise Comparison ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">HAPPY vs the alternatives</h3>
          <p className="mt-2 text-sm text-soft-gray">Factual, feature-based. Not a chatbot. Not a legacy suite.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/15 bg-charcoal">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 bg-charcoal">
                <tr className="border-b border-gold/15 text-[11px] uppercase tracking-widest text-soft-gray">
                  <th className="sticky left-0 z-10 bg-charcoal px-5 py-4 font-medium">Capability</th>
                  {VS_COLS.map((c) => (
                    <th key={c.key} className={`px-3 py-4 font-medium ${c.key === "happy" ? "text-gold" : "text-paper"}`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HAPPY_VS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-obsidian/40" : ""}>
                    <th scope="row" className="sticky left-0 z-10 bg-inherit px-5 py-2.5 text-[12.5px] font-normal text-paper">{row.feature}</th>
                    {VS_COLS.map((c) => {
                      const v = row[c.key];
                      const isHappy = c.key === "happy";
                      return (
                        <td key={c.key} className={`px-3 py-2.5 text-[12.5px] ${v === "—" ? "text-soft-gray/60" : isHappy ? "font-semibold text-gold" : "text-paper"}`}>{v}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-soft-gray">Comparison reflects publicly documented capabilities. "Partial" = the capability exists but is narrower than HAPPY's equivalent. All trademarks belong to their respective owners.</p>
        </div>

        {/* ═══ SECTION 8 · Interactive ROI ═══ */}
        <div className="mt-24 grid gap-8 rounded-3xl border border-gold/20 bg-charcoal/80 p-8 backdrop-blur lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
              <TrendingUp className="h-3 w-3" /> Interactive ROI
            </div>
            <h3 className="mt-3 font-display text-2xl font-semibold text-paper md:text-3xl">Model your ROI in real time</h3>
            <p className="mt-2 text-sm text-soft-gray">Every slider updates monthly, annual, and 5-year ROI live.</p>
            <div className="mt-6 space-y-5">
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray"><span>Employees</span><span className="numeric text-paper">{emp}</span></div>
                <input type="range" min={1} max={1000} step={1} value={emp} onChange={(e) => setEmp(+e.target.value)} className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray"><span>Monthly revenue (₹)</span><span className="numeric text-paper">₹{revenue.toLocaleString("en-IN")}</span></div>
                <input type="range" min={100000} max={100000000} step={100000} value={revenue} onChange={(e) => setRevenue(+e.target.value)} className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray"><span>Hours saved / person / week</span><span className="numeric text-paper">{hours}h</span></div>
                <input type="range" min={1} max={40} step={1} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
              <label className="block">
                <div className="flex items-center justify-between text-[12px] text-soft-gray"><span>Avg monthly salary (₹)</span><span className="numeric text-paper">₹{salary.toLocaleString("en-IN")}</span></div>
                <input type="range" min={10000} max={500000} step={5000} value={salary} onChange={(e) => setSalary(+e.target.value)} className="mt-2 w-full accent-[color:var(--color-gold,#e8c96a)]" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 self-start">
            <div className="col-span-2 rounded-2xl border border-gold/25 bg-gradient-to-br from-obsidian via-charcoal to-obsidian p-6">
              <div className="text-[11px] uppercase tracking-widest text-gold">5-year savings</div>
              <div className="numeric mt-2 font-display text-4xl font-semibold text-paper md:text-5xl">₹{c5y.toLocaleString("en-IN")}</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-obsidian">
                <div className="h-full bg-gradient-to-r from-gold via-paper to-gold transition-[width] duration-500" style={{ width: `${Math.min(100, Math.round((fiveYearSavings / (revenue * 60)) * 100))}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Monthly</div>
              <div className="numeric mt-2 font-display text-2xl font-semibold text-gold">₹{cMonthly.toLocaleString("en-IN")}</div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Annual</div>
              <div className="numeric mt-2 font-display text-2xl font-semibold text-gold">₹{cAnnual.toLocaleString("en-IN")}</div>
            </div>
            <div className="col-span-2 rounded-2xl border border-gold/15 bg-obsidian/60 p-5">
              <div className="text-[11px] uppercase tracking-widest text-soft-gray">Company size · Revenue</div>
              <div className="mt-2 flex items-baseline gap-3 text-paper">
                <span className="numeric font-display text-lg">{emp} employees</span>
                <span className="text-soft-gray">·</span>
                <span className="numeric font-display text-lg">₹{revenue.toLocaleString("en-IN")}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 9 · Enterprise Success Stories ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Enterprise success stories</h3>
          <p className="mt-2 text-sm text-soft-gray">Real problems. Real solutions. Measurable ROI.</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STORIES.map((s) => (
              <article key={s.industry} className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/80 p-6 backdrop-blur transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_0_40px_-20px_rgba(232,201,106,0.6)]">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(232,201,106,0.10),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="text-[11px] uppercase tracking-widest text-gold">{s.industry}</div>
                  <div className="mt-3 text-[13px] font-semibold text-paper">Problem</div>
                  <p className="text-[12.5px] text-soft-gray">{s.problem}</p>
                  <div className="mt-3 text-[13px] font-semibold text-paper">Solution</div>
                  <p className="text-[12.5px] text-soft-gray">{s.solution}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11.5px] font-semibold text-gold">
                    <TrendingUp className="h-3 w-3" /> {s.roi}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 10 · Enterprise Security ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Enterprise security & trust</h3>
          <p className="mt-2 text-sm text-soft-gray">Built for regulated industries from day one.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {TRUST.map((b) => (
              <div key={b.title} className="group rounded-2xl border border-gold/15 bg-charcoal/80 p-5 backdrop-blur transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.5)]">
                <Shield className="h-5 w-5 text-gold transition-transform group-hover:scale-110" aria-hidden />
                <div className="mt-3 text-[13px] font-semibold text-paper">{b.title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-soft-gray">{b.copy}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Use case gallery ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Built for every use case</h3>
          <p className="mt-2 text-sm text-soft-gray">One platform. Endless applications.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {USE_CASES.map(({ icon: Icon, name, copy, plan }) => (
              <article key={name} className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/80 p-5 backdrop-blur transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.6)]">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(232,201,106,0.10),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <div className="mt-3 text-[13.5px] font-semibold text-paper">{name}</div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-soft-gray">{copy}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest text-gold">Recommended · {plan}</div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 11 · Integrations ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Integrations</h3>
          <p className="mt-2 text-sm text-soft-gray">Twenty native integrations. Plus Zapier, Make and webhooks.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {INTEGRATIONS.map((i) => (
              <span key={i} className="rounded-full border border-gold/20 bg-charcoal/80 px-4 py-2 text-[12.5px] font-medium text-paper backdrop-blur transition-all duration-200 motion-safe:hover:scale-[1.05] hover:border-gold/45">{i}</span>
            ))}
          </div>
        </div>

        {/* ═══ Payments ═══ */}
        <div className="mt-16 rounded-2xl border border-gold/15 bg-charcoal/80 p-7 backdrop-blur">
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

        {/* ═══ SECTION 12 · Migration ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Migration Center</h3>
          <p className="mt-2 text-sm text-soft-gray">Already using something else? Bring everything with you.</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MIGRATION.map((m) => (
              <div key={m.from} className="group rounded-2xl border border-gold/15 bg-charcoal/80 p-5 backdrop-blur transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_-16px_rgba(232,201,106,0.5)]">
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

        {/* ═══ SECTION 13 · Digital Human Demo ═══ */}
        <div className="mt-24 overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-charcoal via-obsidian to-charcoal p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
                <Bot className="h-3 w-3" /> Digital Human Demo
              </div>
              <h3 className="mt-3 font-display text-3xl font-semibold text-paper md:text-4xl">Try HAPPY, live.</h3>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-soft-gray">
                Voice, whiteboard, presentations, live avatar, memory — the same Digital Human, five ways to experience it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: MessageSquare, label: "Live Chat" },
                  { icon: Mic,           label: "Voice" },
                  { icon: PlayCircle,    label: "Watch Demo" },
                  { icon: PenTool,       label: "Whiteboard" },
                  { icon: Presentation,  label: "Presentation" },
                  { icon: Database,      label: "Memory" },
                ].map(({ icon: Icon, label }) => (
                  <Magnetic key={label}>
                    <button type="button" className="group inline-flex items-center gap-2 rounded-full border border-gold/25 bg-obsidian/60 px-4 py-2 text-[12.5px] font-medium text-paper transition-all duration-200 hover:border-gold/50 hover:bg-obsidian/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
                      <Icon className="h-3.5 w-3.5 text-gold" aria-hidden /> {label}
                      <ArrowRight className="h-3 w-3 text-gold opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  </Magnetic>
                ))}
              </div>
            </div>
            <div className="relative aspect-square w-full max-w-md justify-self-center rounded-[2rem] border border-gold/25 bg-obsidian/60 p-8 backdrop-blur">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(232,201,106,0.24),transparent_60%)]" />
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

        {/* ═══ SECTION 14 · Roadmap ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Roadmap</h3>
          <p className="mt-2 text-sm text-soft-gray">Where we are and where HAPPY is going.</p>
          <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {TIMELINE.map((s, i) => (
              <li key={s.phase} className="relative rounded-2xl border border-gold/15 bg-charcoal/80 p-5 backdrop-blur transition-colors hover:border-gold/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-[12px] font-semibold text-gold">{s.phase}</div>
                </div>
                <div className="mt-3 text-[12px] leading-relaxed text-soft-gray">{s.copy}</div>
                {i < TIMELINE.length - 1 && (
                  <ArrowRight aria-hidden className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-gold/40 lg:block" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* ═══ SECTION 15 · FAQ (50) ═══ */}
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold text-paper md:text-3xl">Enterprise FAQ</h3>
          <p className="mt-2 text-sm text-soft-gray">{FAQ.length} of the most-asked questions from teams evaluating HAPPY.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {FAQ.map((f, i) => {
              const open = !!openFaqs[i];
              return (
                <div key={f.q} className={`rounded-2xl border bg-charcoal/80 p-5 backdrop-blur transition-colors ${open ? "border-gold/40" : "border-gold/15"}`}>
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

        {/* ═══ SECTION 16 · Enterprise CTA ═══ */}
        <div className="mt-24 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-charcoal via-charcoal to-obsidian p-8 backdrop-blur md:p-12">
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
                <Magnetic key={title}>
                  <button type="button"
                    className="group flex w-full flex-col items-start gap-2 rounded-2xl border border-gold/20 bg-obsidian/60 p-4 text-left backdrop-blur transition-all duration-200 hover:border-gold/50 hover:bg-obsidian/80 hover:shadow-[0_0_24px_-8px_rgba(232,201,106,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold text-paper">{title}</span>
                    <span className="text-[11.5px] leading-relaxed text-soft-gray">{copy}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-gold">
                      {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </button>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </section>
  );
}
