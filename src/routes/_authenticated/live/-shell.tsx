import { Link, useRouterState } from "@tanstack/react-router";
import { Container, PageHeader } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { to: "/live/dashboard", label: "Dashboard" },
  { to: "/live/presence", label: "Presence" },
  { to: "/live/context", label: "Context" },
  { to: "/live/relationship", label: "Relationship" },
  { to: "/live/activity", label: "Activity" },
  { to: "/live/language", label: "Language" },
  { to: "/live/home", label: "Home" },
  { to: "/live/founder", label: "Founder" },
  { to: "/live/settings", label: "Settings" },
] as const;

export function LiveShell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Container className="py-8 space-y-6">
      <PageHeader eyebrow="HAPPY Presence" title={title} description={description} actions={actions} />
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-3" aria-label="Live tabs">
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
