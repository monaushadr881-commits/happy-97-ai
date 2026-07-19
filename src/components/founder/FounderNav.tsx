/**
 * Founder Command Center sub-navigation.
 * A horizontal tab bar of the executive OS surfaces.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Users, Sparkles, Activity, Shield,
  BarChart3, Settings2, Newspaper, Crown, Plug,
} from "lucide-react";

const TABS = [
  { to: "/founder", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/founder/brief", label: "Brief", icon: Newspaper, exact: false },
  { to: "/founder/executive", label: "Executive", icon: Crown, exact: false },
  { to: "/founder/companies", label: "Companies", icon: Building2, exact: false },
  { to: "/founder/users", label: "Users", icon: Users, exact: false },
  { to: "/founder/ai", label: "AI", icon: Sparkles, exact: false },
  { to: "/founder/ops", label: "Operations", icon: Activity, exact: false },
  { to: "/founder/security", label: "Security", icon: Shield, exact: false },
  { to: "/founder/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/founder/integrations", label: "Integrations", icon: Plug, exact: false },
  { to: "/founder/system", label: "System", icon: Settings2, exact: false },
] as const;

export function FounderNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky top-14 z-20 -mx-6 md:-mx-10 mb-6 border-b border-white/5 bg-obsidian/85 px-6 md:px-10 backdrop-blur">
      <div className="flex gap-1 overflow-x-auto py-2">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "group inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors",
                active
                  ? "bg-gold/10 text-gold"
                  : "text-soft-gray hover:bg-white/5 hover:text-paper",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
