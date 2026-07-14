/**
 * Business OS — company selector + sub-navigation.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useBusiness } from "./BusinessContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, Users, ShoppingCart, PackageSearch, Warehouse, Factory,
  UserCog, Wallet, FolderKanban, Sparkles, Workflow, BarChart3, Search,
  Truck,
} from "lucide-react";

const TABS = [
  { to: "/business", label: "Cockpit", icon: LayoutDashboard, exact: true },
  { to: "/business/crm", label: "CRM", icon: Users, exact: false },
  { to: "/business/sales", label: "Sales", icon: ShoppingCart, exact: false },
  { to: "/business/purchase", label: "Purchase", icon: Truck, exact: false },
  { to: "/business/inventory", label: "Inventory", icon: PackageSearch, exact: false },
  { to: "/business/warehouse", label: "Warehouse", icon: Warehouse, exact: false },
  { to: "/business/manufacturing", label: "Manufacturing", icon: Factory, exact: false },
  { to: "/business/hr", label: "HRMS", icon: UserCog, exact: false },
  { to: "/business/finance", label: "Finance", icon: Wallet, exact: false },
  { to: "/business/projects", label: "Projects", icon: FolderKanban, exact: false },
  { to: "/business/automation", label: "Automation", icon: Workflow, exact: false },
  { to: "/business/ai", label: "AI Advisor", icon: Sparkles, exact: false },
  { to: "/business/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/business/search", label: "Search", icon: Search, exact: false },
] as const;

export function BusinessNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { companies, companyId, setCompanyId, current } = useBusiness();

  return (
    <div className="sticky top-14 z-20 -mx-6 md:-mx-10 mb-6 border-b border-white/5 bg-obsidian/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-6 md:px-10 pt-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-soft-gray">Company</span>
        <Select value={companyId ?? undefined} onValueChange={setCompanyId}>
          <SelectTrigger className="h-8 min-w-[240px] bg-white/[0.03] border-white/10 text-paper">
            <SelectValue placeholder={companies.length ? "Select company" : "No companies"} />
          </SelectTrigger>
          <SelectContent className="bg-obsidian border-white/10 text-paper">
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.display_name ?? c.legal_name ?? c.slug ?? c.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {current && (
          <span className="text-[11px] text-soft-gray">
            <span className="text-gold">{current.slug ?? "—"}</span>
          </span>
        )}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-6 md:px-10 py-2">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors",
                active ? "bg-gold/10 text-gold" : "text-soft-gray hover:bg-white/5 hover:text-paper",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
