/**
 * TabBar — pure UI primitive for URL-driven in-page tab navigation.
 * R140 Business OS UI Completion. Reads / writes `?tab=<slug>` via TanStack Router.
 *
 * Not a route, not a runtime — just a controlled UI shell used by canonical
 * Business OS pages (CRM, ERP, HRMS, Inventory, Revenue, Enterprise) to expose
 * every required screen without duplicating routes or services.
 */
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

export type Tab = {
  slug: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

/** Resolve the currently active tab slug from the URL, defaulting to first. */
export function useActiveTab(tabs: Tab[]): string {
  const search = useRouterState({ select: (s) => s.location.search as { tab?: string } });
  const slug = (search?.tab ?? "").toString();
  return tabs.some((t) => t.slug === slug) ? slug : tabs[0].slug;
}

/** Programmatic switch (used by inline links / buttons). */
export function useSetTab() {
  const navigate = useNavigate();
  return (slug: string) =>
    navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, tab: slug }), replace: true });
}

export function TabBar({ tabs, ariaLabel = "Section navigation" }: { tabs: Tab[]; ariaLabel?: string }) {
  const active = useActiveTab(tabs);
  return (
    <nav aria-label={ariaLabel} className="mt-4 flex gap-1 overflow-x-auto border-b border-white/5 pb-1">
      {tabs.map((t) => {
        const isActive = t.slug === active;
        const Icon = t.icon;
        return (
          <Link
            key={t.slug}
            to="."
            search={(prev) => ({ ...(prev as object), tab: t.slug })}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors",
              isActive ? "bg-gold/10 text-gold" : "text-soft-gray hover:bg-white/5 hover:text-paper",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
