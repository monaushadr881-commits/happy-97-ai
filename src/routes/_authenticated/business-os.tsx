/**
 * /business-os — HAPPY Business Operating System™ (R282)
 *
 * Thin desktop-style shell that composes the ONE canonical
 * HappyUniversalPromptBar + HappyUniversalActionBar with in-app navigation
 * to existing canonical business routes/runtimes. No new runtime, no new
 * API, no new component.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2, Building, GitBranch, Users2, Users, UserCog,
  UserRound, Truck, Store, Handshake, Package2, Boxes,
  Calculator, Receipt, Banknote, Wallet, Contact, Factory,
  Warehouse, ClipboardList, ShieldCheck, FileSearch, BarChart3, Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/business-os")({
  head: () => ({
    meta: [
      { title: "HAPPY Business Operating System" },
      { name: "description", content: "Enterprise Business OS — Organizations, Companies, HR, Finance, CRM, ERP, Manufacturing, Inventory, Approvals, Audit, Analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessOsPage,
});

type Tile = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Group = { id: string; title: string; tiles: Tile[] };

const GROUPS: Group[] = [
  {
    id: "organization",
    title: "Organization",
    tiles: [
      { to: "/founder/companies", label: "Organizations", icon: Network },
      { to: "/founder/companies", label: "Companies", icon: Building2 },
      { to: "/founder/companies", label: "Branches", icon: Building },
      { to: "/business/hr", label: "Departments", icon: GitBranch },
      { to: "/business/hr", label: "Teams", icon: Users2 },
      { to: "/hr", label: "Employees", icon: UserCog },
    ],
  },
  {
    id: "network",
    title: "Network",
    tiles: [
      { to: "/enterprise/customers", label: "Customers", icon: UserRound },
      { to: "/business/purchase", label: "Suppliers", icon: Truck },
      { to: "/business/purchase", label: "Vendors", icon: Store },
      { to: "/founder/dealers", label: "Partners", icon: Handshake },
      { to: "/founder/dealers", label: "Dealers", icon: Package2 },
      { to: "/founder/dealers", label: "Distributors", icon: Boxes },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    tiles: [
      { to: "/business/finance", label: "Accounting", icon: Calculator },
      { to: "/business/finance", label: "GST", icon: Receipt },
      { to: "/business/hr", label: "Payroll", icon: Banknote },
      { to: "/finance", label: "Finance", icon: Wallet },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    tiles: [
      { to: "/crm", label: "CRM", icon: Contact },
      { to: "/erp", label: "ERP", icon: Building2 },
      { to: "/manufacturing", label: "Manufacturing", icon: Factory },
      { to: "/business/inventory", label: "Inventory", icon: Boxes },
      { to: "/business/warehouse", label: "Warehouse", icon: Warehouse },
      { to: "/business/projects", label: "Projects", icon: ClipboardList },
    ],
  },
  {
    id: "governance",
    title: "Governance",
    tiles: [
      { to: "/mission-control", label: "Approvals", icon: ShieldCheck },
      { to: "/mission-control", label: "Audit", icon: FileSearch },
      { to: "/business/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

function BusinessOsPage() {
  const [activeGroup, setActiveGroup] = React.useState<string>("organization");

  const onSend = React.useCallback((p: HuppSendPayload) => {
    toast.success("Dispatched to Business Runtime", { description: p.prompt.slice(0, 120) });
  }, []);
  const onAction = React.useCallback((intent: HuppActionIntent) => {
    toast.message(`Action: ${intent}`);
  }, []);

  const group = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r border-border/60 bg-muted/20">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">HAPPY</Badge>
            <span className="text-sm font-semibold">Business OS</span>
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100%-4rem)]">
          <nav className="p-2 space-y-1">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                  activeGroup === g.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                {g.title}
                <span className="ml-2 text-xs opacity-60">{g.tiles.length}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-border/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">{group.title}</h1>
            <Badge variant="secondary" className="text-xs">Canonical Business Runtime</Badge>
          </div>
          <HappyUniversalActionBar mode="mission-control" payload={group.title} compact />
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {group.tiles.map((t) => (
                <Link
                  key={`${t.to}-${t.label}`}
                  to={t.to}
                  className="group rounded-xl border border-border/60 bg-card hover:bg-accent hover:border-primary/40 transition-colors p-4 flex flex-col items-start gap-3 min-h-24"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium leading-tight">{t.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 bg-card/40 p-3">
          <HappyUniversalPromptBar
            defaultSurface="chat"
            placeholder="Ask HAPPY to build, analyze, or automate any business module…"
            onSend={onSend}
            onAction={onAction}
          />
        </div>
      </main>
    </div>
  );
}
