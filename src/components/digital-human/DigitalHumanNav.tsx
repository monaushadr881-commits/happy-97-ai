/** HDHOS — sub-navigation. Every tab is a HAPPY surface, one identity. */
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { MessageSquare, GraduationCap, Presentation, PenTool, Building2, History, Settings } from "lucide-react";

const TABS: ReadonlyArray<{ to: string; label: string; icon: typeof MessageSquare; exact?: boolean }> = [
  { to: "/digital-human", label: "Conversation", icon: MessageSquare, exact: true },
  { to: "/digital-human/classroom", label: "Classroom", icon: GraduationCap },
  { to: "/digital-human/boardroom", label: "Boardroom", icon: Building2 },
  { to: "/digital-human/presentation", label: "Presentation", icon: Presentation },
  { to: "/digital-human/whiteboard", label: "Whiteboard", icon: PenTool },
  { to: "/digital-human/sessions", label: "Sessions", icon: History },
  { to: "/digital-human/settings", label: "Settings", icon: Settings },
];

export function DigitalHumanNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="sticky top-14 z-20 -mx-6 md:-mx-10 mb-6 border-b border-white/5 bg-obsidian/85 backdrop-blur">
      <nav className="flex gap-1 overflow-x-auto px-6 md:px-10 py-2">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to}
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
