/**
 * HAPPY OS — Workspace Registry (R21)
 * Declarative list of every top-level workspace. Drives the switcher,
 * launcher grid, and workspace memory. UX-layer only — no business logic.
 */
import {
  Crown,
  Shield,
  Code2,
  Building2,
  DollarSign,
  Users,
  Factory,
  BookOpen,
  GraduationCap,
  Store,
  Rocket,
  Cloud,
  Sparkles,
  Palette,
  Bot,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceId =
  | "founder"
  | "admin"
  | "developer"
  | "business"
  | "finance"
  | "crm"
  | "erp"
  | "manufacturing"
  | "library"
  | "education"
  | "marketplace"
  | "builder"
  | "deployment"
  | "assistant"
  | "studio"
  | "digital-human"
  | "hyperlocal";

export interface WorkspaceDef {
  id: WorkspaceId;
  label: string;
  tagline: string;
  route: string;
  icon: LucideIcon;
  group: "executive" | "operations" | "creation" | "growth" | "platform";
  accent: string; // tailwind accent for card
}

export const WORKSPACES: readonly WorkspaceDef[] = Object.freeze([
  { id: "founder",       label: "Founder",       tagline: "Sovereign command",         route: "/founder",       icon: Crown,         group: "executive",  accent: "from-gold/25 to-gold/5" },
  { id: "admin",         label: "Admin",         tagline: "Enterprise control",        route: "/enterprise",    icon: Shield,        group: "executive",  accent: "from-emerald-400/20 to-emerald-500/5" },
  { id: "developer",     label: "Developer",     tagline: "Build & deploy",            route: "/business",      icon: Code2,         group: "creation",   accent: "from-sky-400/20 to-sky-500/5" },
  { id: "business",      label: "Business",      tagline: "Run the company",           route: "/business",      icon: Building2,     group: "operations", accent: "from-amber-400/20 to-amber-500/5" },
  { id: "finance",       label: "Finance",       tagline: "Revenue & wallet",          route: "/business",      icon: DollarSign,    group: "operations", accent: "from-lime-400/20 to-lime-500/5" },
  { id: "crm",           label: "CRM",           tagline: "Customers & pipeline",      route: "/business",      icon: Users,         group: "growth",     accent: "from-rose-400/20 to-rose-500/5" },
  { id: "erp",           label: "ERP",           tagline: "Orders & approvals",        route: "/business",      icon: Factory,       group: "operations", accent: "from-orange-400/20 to-orange-500/5" },
  { id: "manufacturing", label: "Manufacturing", tagline: "Inventory & warehouse",     route: "/business",      icon: Factory,       group: "operations", accent: "from-yellow-400/20 to-yellow-500/5" },
  { id: "library",       label: "Library",       tagline: "Knowledge base",            route: "/knowledge",     icon: BookOpen,      group: "growth",     accent: "from-violet-400/20 to-violet-500/5" },
  { id: "education",     label: "Education",     tagline: "Razvi Academy",             route: "/education",     icon: GraduationCap, group: "growth",     accent: "from-indigo-400/20 to-indigo-500/5" },
  { id: "marketplace",   label: "Marketplace",   tagline: "Sell & buy",                route: "/marketplace",   icon: Store,         group: "growth",     accent: "from-fuchsia-400/20 to-fuchsia-500/5" },
  { id: "builder",       label: "Builder",       tagline: "Website & app builder",     route: "/business",      icon: Rocket,        group: "creation",   accent: "from-cyan-400/20 to-cyan-500/5" },
  { id: "deployment",    label: "Deployment",    tagline: "Hosting & domains",         route: "/business",      icon: Cloud,         group: "platform",   accent: "from-teal-400/20 to-teal-500/5" },
  { id: "assistant",     label: "HAPPY AI",      tagline: "Always-on assistant",       route: "/assistant",     icon: Sparkles,      group: "platform",   accent: "from-gold/25 to-transparent" },
  { id: "studio",        label: "Studio",        tagline: "Create anything",           route: "/studio",        icon: Palette,       group: "creation",   accent: "from-pink-400/20 to-pink-500/5" },
  { id: "digital-human", label: "Digital Human", tagline: "Talk to HAPPY",             route: "/digital-human", icon: Bot,           group: "platform",   accent: "from-purple-400/20 to-purple-500/5" },
  { id: "hyperlocal",    label: "Hyperlocal",    tagline: "AAS PAAS",                  route: "/hyperlocal",    icon: MapPin,        group: "growth",     accent: "from-red-400/20 to-red-500/5" },
]);

export function getWorkspace(id: WorkspaceId): WorkspaceDef | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

export function workspaceForRoute(pathname: string): WorkspaceDef | undefined {
  // longest matching route wins
  return [...WORKSPACES]
    .sort((a, b) => b.route.length - a.route.length)
    .find((w) => pathname === w.route || pathname.startsWith(w.route + "/"));
}

/* Multi-business identities. Selection is UX-only; company scoping remains
 * enforced by RLS/`is_company_member` on the backend. */
export interface BusinessIdentity {
  id: string;
  name: string;
  tagline: string;
}

export const BUSINESSES: readonly BusinessIdentity[] = Object.freeze([
  { id: "hp",         name: "H.P PRIVATE LIMITED", tagline: "Parent holding" },
  { id: "shuddh",     name: "H.P SHUDDH MASALE",   tagline: "Consumer brand" },
  { id: "aaspaas",    name: "AAS PAAS",            tagline: "Hyperlocal" },
  { id: "library",    name: "H.P LIBRARY",         tagline: "Digital library" },
  { id: "razvi",      name: "Razvi Academy",       tagline: "Education" },
]);
