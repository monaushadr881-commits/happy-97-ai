import { Link, useRouterState } from "@tanstack/react-router";
import { Container, PageHeader } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { to: "/production/dashboard", label: "Dashboard" },
  { to: "/production/performance", label: "Performance" },
  { to: "/production/security", label: "Security" },
  { to: "/production/testing", label: "Testing" },
  { to: "/production/deployment", label: "Deployment" },
  { to: "/production/quality", label: "Quality" },
] as const;

export function ProductionShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Container className="py-8 space-y-6">
      <PageHeader eyebrow="Production" title={title} description={description} />
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-3" aria-label="Production tabs">
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
