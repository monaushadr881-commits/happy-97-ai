import { Link, useRouterState } from "@tanstack/react-router";
import { Container, PageHeader } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { to: "/uabr/dashboard", label: "Dashboard" },
  { to: "/uabr/planner", label: "Planner" },
  { to: "/uabr/design", label: "Design" },
  { to: "/uabr/database", label: "Database" },
  { to: "/uabr/backend", label: "Backend" },
  { to: "/uabr/frontend", label: "Frontend" },
  { to: "/uabr/documentation", label: "Docs" },
  { to: "/uabr/tests", label: "Tests" },
  { to: "/uabr/deployment", label: "Deployment" },
  { to: "/uabr/history", label: "History" },
] as const;

export function UabrShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Container className="py-8 space-y-6">
      <PageHeader eyebrow="Universal AI Builder" title={title} description={description} />
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-3" aria-label="UABR tabs">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to} className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              active ? "bg-gold/10 text-gold border border-gold/30" : "text-soft-gray hover:text-paper",
            )}>{t.label}</Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </Container>
  );
}
