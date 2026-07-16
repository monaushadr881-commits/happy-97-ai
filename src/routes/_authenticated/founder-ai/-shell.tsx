import { Link, useRouterState } from "@tanstack/react-router";
import { Container, PageHeader } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { to: "/founder-ai/dashboard", label: "Dashboard" },
  { to: "/founder-ai/workspace", label: "Workspace" },
  { to: "/founder-ai/chat", label: "Chat" },
  { to: "/founder-ai/voice", label: "Voice" },
  { to: "/founder-ai/memory", label: "Memory" },
  { to: "/founder-ai/terminal", label: "Terminal" },
  { to: "/founder-ai/history", label: "History" },
  { to: "/founder-ai/tasks", label: "Tasks" },
  { to: "/founder-ai/activity", label: "Activity" },
  { to: "/founder-ai/settings", label: "Settings" },
] as const;

export function FaiosShell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Container className="py-8 space-y-6">
      <PageHeader eyebrow="Founder AI OS" title={title} description={description} actions={actions} />
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-3" aria-label="Founder AI tabs">
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
