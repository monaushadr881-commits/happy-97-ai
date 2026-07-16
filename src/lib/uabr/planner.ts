/** R67 UABR — deterministic project planner. No external AI required. */
import type {
  UabrIndustry, UabrMode, UabrProjectPlan, UabrStep, UabrExternalDeps,
} from "./contracts";
import { NATIVE_BLOCK } from "./contracts";

const INDUSTRY_MAP: { keywords: string[]; industry: UabrIndustry; modules: string[]; features: string[] }[] = [
  { keywords: ["restaurant", "cafe", "kitchen", "food", "menu"], industry: "restaurant",
    modules: ["Menu", "Orders", "Tables", "KOT", "Billing", "Inventory", "Loyalty"],
    features: ["Online ordering", "Table reservations", "Kitchen display", "Split bills"] },
  { keywords: ["hotel", "room", "booking", "stay", "reservation"], industry: "hotel",
    modules: ["Rooms", "Bookings", "Guests", "Housekeeping", "Billing", "Reviews"],
    features: ["Room search", "Availability calendar", "Guest CRM", "Invoicing"] },
  { keywords: ["hospital", "clinic", "patient", "doctor", "appointment"], industry: "hospital",
    modules: ["Patients", "Appointments", "Doctors", "EMR", "Billing", "Lab", "Pharmacy"],
    features: ["Appointment booking", "EMR", "Prescriptions", "Insurance claims"] },
  { keywords: ["lab", "laboratory", "test", "sample"], industry: "laboratory",
    modules: ["Samples", "Tests", "Reports", "Billing", "Doctors"],
    features: ["Sample tracking", "Report delivery", "Doctor portal"] },
  { keywords: ["school", "college", "university", "student", "class", "course"], industry: "school",
    modules: ["Students", "Classes", "Attendance", "Exams", "Fees", "Library"],
    features: ["Attendance", "Grade book", "Parent portal", "Fee collection"] },
  { keywords: ["retail", "store", "shop", "pos"], industry: "retail",
    modules: ["Catalog", "Inventory", "POS", "Customers", "Loyalty", "Promotions"],
    features: ["Barcode POS", "Multi-store", "Loyalty tiers"] },
  { keywords: ["wholesale", "distributor"], industry: "wholesale",
    modules: ["Catalog", "Bulk Orders", "Dealers", "Credit", "Dispatch"],
    features: ["Tiered pricing", "Credit terms", "Dispatch tracking"] },
  { keywords: ["manufactur", "factory", "assembly", "production"], industry: "manufacturing",
    modules: ["BOM", "Production", "Quality", "Maintenance", "Warehouse", "Purchase"],
    features: ["BOM planning", "Shop-floor tracking", "Quality gates"] },
  { keywords: ["construct", "site", "project"], industry: "construction",
    modules: ["Projects", "Contractors", "Materials", "Progress", "Billing"],
    features: ["Site diary", "BoQ", "Progress billing"] },
  { keywords: ["real estate", "property", "listing"], industry: "real_estate",
    modules: ["Listings", "Leads", "Site visits", "Deals", "Documents"],
    features: ["Listing search", "Virtual tours", "Deal pipeline"] },
  { keywords: ["finance", "loan", "lending"], industry: "finance",
    modules: ["Customers", "Products", "Loans", "Repayments", "Collections", "KYC"],
    features: ["KYC", "EMI schedule", "Collections"] },
  { keywords: ["insurance", "policy"], industry: "insurance",
    modules: ["Policies", "Claims", "Customers", "Agents", "Payments"],
    features: ["Policy issuance", "Claims workflow", "Renewals"] },
  { keywords: ["bank"], industry: "banking",
    modules: ["Accounts", "Transactions", "Cards", "Loans", "Compliance"],
    features: ["Account opening", "Transfers", "Statements"] },
  { keywords: ["logistic", "shipping", "fleet", "delivery"], industry: "logistics",
    modules: ["Fleet", "Trips", "Drivers", "Consignments", "POD"],
    features: ["Route planning", "POD capture", "Fleet health"] },
  { keywords: ["travel", "tour", "trip"], industry: "travel",
    modules: ["Packages", "Bookings", "Itineraries", "Guides", "Payments"],
    features: ["Package builder", "Itinerary", "Payments"] },
  { keywords: ["salon", "spa"], industry: "salon",
    modules: ["Services", "Appointments", "Stylists", "Loyalty", "Billing"],
    features: ["Slot booking", "Loyalty", "Product upsell"] },
  { keywords: ["gym", "fitness"], industry: "gym",
    modules: ["Members", "Trainers", "Classes", "Plans", "Attendance"],
    features: ["Membership plans", "Class scheduling", "Trainer app"] },
  { keywords: ["event"], industry: "event_management",
    modules: ["Events", "Attendees", "Tickets", "Sponsors", "Check-in"],
    features: ["Ticket types", "Check-in", "Sponsor kits"] },
  { keywords: ["marketplace"], industry: "marketplace",
    modules: ["Vendors", "Catalog", "Orders", "Commissions", "Payouts"],
    features: ["Multi-vendor", "Commission engine", "Vendor payouts"] },
  { keywords: ["ecommerce", "e-commerce", "shop online", "online store"], industry: "ecommerce",
    modules: ["Catalog", "Cart", "Checkout", "Orders", "Shipping", "Customers"],
    features: ["Product catalog", "Cart", "Payments", "Order tracking"] },
  { keywords: ["ngo", "non-profit", "donation"], industry: "ngo",
    modules: ["Programs", "Donors", "Donations", "Volunteers", "Impact"],
    features: ["Donation forms", "Donor CRM", "Impact reports"] },
  { keywords: ["government", "citizen", "municipal"], industry: "government",
    modules: ["Services", "Requests", "Citizens", "Payments", "Notices"],
    features: ["Grievance", "Service requests", "Notices"] },
  { keywords: ["portfolio"], industry: "portfolio",
    modules: ["Home", "Work", "Case Studies", "Contact"],
    features: ["Case studies", "Contact form", "Blog"] },
  { keywords: ["saas", "ai"], industry: "ai_saas",
    modules: ["Workspace", "Projects", "Members", "Billing", "AI Runtime"],
    features: ["Workspaces", "Team roles", "Usage metering"] },
  { keywords: ["corporate", "company website"], industry: "corporate",
    modules: ["Home", "About", "Services", "Case Studies", "Contact", "Blog"],
    features: ["Services", "Case studies", "Contact"] },
];

const MODE_MAP: { keywords: string[]; modes: UabrMode[] }[] = [
  { keywords: ["website", "landing"], modes: ["website"] },
  { keywords: ["pwa", "progressive"], modes: ["pwa"] },
  { keywords: ["android"], modes: ["android"] },
  { keywords: ["ios", "iphone", "ipad"], modes: ["ios"] },
  { keywords: ["desktop", "windows app", "mac app"], modes: ["desktop"] },
  { keywords: ["mobile app", "app store", "play store"], modes: ["android", "ios", "pwa"] },
  { keywords: ["backend", "api only"], modes: ["backend"] },
  { keywords: ["frontend only"], modes: ["frontend"] },
  { keywords: ["enterprise", "erp", "everything", "full platform"], modes: ["enterprise"] },
  { keywords: ["complete", "end to end"], modes: ["complete"] },
];

function match<T extends { keywords: string[] }>(text: string, table: T[]): T | undefined {
  const t = text.toLowerCase();
  return table.find((row) => row.keywords.some((k) => t.includes(k)));
}

export function planFromPrompt(rawPrompt: string, opts?: { projectName?: string; modes?: UabrMode[] }): UabrProjectPlan {
  const prompt = rawPrompt.trim();
  const ind = match(prompt, INDUSTRY_MAP) ?? { industry: "custom" as UabrIndustry, modules: ["Home", "Auth", "Dashboard", "Settings"], features: ["User accounts", "Dashboard"] };
  const modeMatch = match(prompt, MODE_MAP);
  const modes: UabrMode[] = (opts?.modes && opts.modes.length ? opts.modes : (modeMatch?.modes ?? ["website"]));

  const roles = ["founder", "admin", "manager", "user"];
  const permissions = ["read", "write", "approve", "publish"];
  const pages = [
    ...ind.modules.map((m) => `/${m.toLowerCase().replace(/\s+/g, "-")}`),
    "/admin", "/dashboard", "/settings", "/auth",
  ];
  const database_tables = ind.modules.map((m) => m.toLowerCase().replace(/\s+/g, "_"));
  const api_endpoints = ind.modules.flatMap((m) => {
    const s = m.toLowerCase().replace(/\s+/g, "_");
    return [`GET /api/${s}`, `POST /api/${s}`, `PATCH /api/${s}/:id`, `DELETE /api/${s}/:id`];
  });

  const projectName = opts?.projectName ?? deriveName(prompt, ind.industry);
  const steps: UabrStep[] = [];
  let order = 1;
  const push = (s: Omit<UabrStep, "order">) => steps.push({ order: order++, ...s });

  push({ title: "Project planning", category: "planning", status: "ready", risk: "low" });
  push({ title: "Design system + brand kit", category: "design", status: "ready", risk: "low" });
  push({ title: "Database schema + RLS", category: "database", status: "ready", risk: "medium",
    detail: `${database_tables.length} tables, RBAC via has_role, RLS scoped to auth.uid()` });
  push({ title: "Backend server functions + realtime channels", category: "backend", status: "ready", risk: "medium" });
  push({ title: "Frontend routes, layouts, dashboards", category: "frontend", status: "ready", risk: "low" });
  push({ title: "Documentation (README, architecture, admin/user guides)", category: "documentation", status: "ready", risk: "low" });
  push({ title: "Test suites (unit + integration + e2e + a11y)", category: "testing", status: "ready", risk: "low" });

  const external: UabrExternalDeps = { toolchain: [], secrets: [], accounts: [], certificates: [], environment: [] };
  const mergeExt = (e?: UabrExternalDeps) => {
    if (!e) return;
    external.toolchain?.push(...(e.toolchain ?? []));
    external.secrets?.push(...(e.secrets ?? []));
    external.accounts?.push(...(e.accounts ?? []));
    external.certificates?.push(...(e.certificates ?? []));
    external.environment?.push(...(e.environment ?? []));
  };

  if (modes.includes("website") || modes.includes("pwa") || modes.includes("complete") || modes.includes("enterprise") || modes.includes("frontend")) {
    push({ title: "Web deployment (Lovable Publish)", category: "deployment", status: "ready", risk: "low",
      detail: "Deployment triggered by the Lovable Publish flow." });
  }
  if (modes.includes("android") || modes.includes("complete") || modes.includes("enterprise")) {
    const b = NATIVE_BLOCK.android;
    mergeExt(b);
    push({ title: "Android APK/AAB native build", category: "native_build", status: "blocked", risk: "high",
      blocked_reason: b.reason, external: b });
    push({ title: "Google Play publication", category: "publishing", status: "blocked", risk: "high",
      blocked_reason: "Google Play Console credentials + signed AAB required", external: b });
  }
  if (modes.includes("ios") || modes.includes("complete") || modes.includes("enterprise")) {
    const b = NATIVE_BLOCK.ios;
    mergeExt(b);
    push({ title: "iOS IPA native build", category: "native_build", status: "blocked", risk: "high",
      blocked_reason: b.reason, external: b });
    push({ title: "App Store publication", category: "publishing", status: "blocked", risk: "high",
      blocked_reason: "Apple Developer credentials + signed IPA required", external: b });
  }
  if (modes.includes("desktop") || modes.includes("enterprise")) {
    const b = NATIVE_BLOCK.desktop;
    mergeExt(b);
    push({ title: "Desktop packaging", category: "native_build", status: "blocked", risk: "medium",
      blocked_reason: b.reason, external: b });
  }

  const complexity = classifyComplexity(ind.modules.length, modes.length);
  const timeline = complexity === "small" ? 3 : complexity === "medium" ? 7 : complexity === "large" ? 14 : 30;
  const credits = complexity === "small" ? 400 : complexity === "medium" ? 1200 : complexity === "large" ? 3500 : 8000;

  const blocked = steps.some((s) => s.status === "blocked");

  return {
    summary: `Generate a ${modes.join("+")} ${ind.industry.replace("_", " ")} platform: ${ind.modules.slice(0, 4).join(", ")}${ind.modules.length > 4 ? "…" : ""}`,
    project_name: projectName,
    domain: `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.app`,
    industry: ind.industry,
    modes,
    features: ind.features,
    modules: ind.modules,
    roles,
    permissions,
    pages,
    api_endpoints,
    database_tables,
    security: ["Supabase Auth", "RBAC via has_role", "RLS on every user-data table", "Audit logs", "Founder approval gate", "Secrets isolation"],
    accessibility: ["WCAG AA", "Keyboard navigation", "ARIA landmarks", "Reduced motion", "Screen reader", "High contrast toggle"],
    seo: ["Route-level head()", "Semantic HTML", "OG tags", "JSON-LD", "Sitemap", "Robots.txt"],
    performance: ["Streaming SSR", "React Query", "Route-level code split", "GPU animations", "Virtualized tables", "Zero CLS target", "60 FPS"],
    timeline_days: timeline,
    estimated_credits: credits,
    complexity,
    steps,
    external_dependencies: dedupeExternal(external),
    blocked_reason: blocked ? "Some steps blocked pending external toolchains/credentials." : undefined,
  };
}

function dedupeExternal(e: UabrExternalDeps): UabrExternalDeps {
  const uniq = (arr?: string[]) => arr ? Array.from(new Set(arr)) : [];
  return {
    toolchain: uniq(e.toolchain),
    secrets: uniq(e.secrets),
    accounts: uniq(e.accounts),
    certificates: uniq(e.certificates),
    environment: uniq(e.environment),
  };
}

function classifyComplexity(modules: number, modes: number): "small" | "medium" | "large" | "enterprise" {
  const score = modules + modes * 2;
  if (score <= 5) return "small";
  if (score <= 10) return "medium";
  if (score <= 18) return "large";
  return "enterprise";
}

function deriveName(prompt: string, industry: string): string {
  const words = prompt.split(/\s+/).filter((w) => /^[A-Za-z]{3,}$/.test(w)).slice(0, 2);
  if (words.length >= 1) return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return industry.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, "");
}
