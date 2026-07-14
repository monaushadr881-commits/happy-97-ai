/**
 * Education OS — sticky sub-navigation.
 * No teacher entity anywhere. "AI Teacher" is a HAPPY mode surfaced in-lesson.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, GraduationCap, StickyNote, Layers,
  ClipboardList, Award, Sparkles, BarChart3, Search, PenSquare, UploadCloud,
} from "lucide-react";

const TABS = [
  { to: "/education", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/education/library", label: "Library", icon: BookOpen, exact: false },
  { to: "/education/my", label: "My Learning", icon: GraduationCap, exact: false },
  { to: "/education/tutor", label: "AI Teacher", icon: Sparkles, exact: false },
  { to: "/education/notes", label: "Notes", icon: StickyNote, exact: false },
  { to: "/education/flashcards", label: "Flashcards", icon: Layers, exact: false },
  { to: "/education/exams", label: "Exams", icon: ClipboardList, exact: false },
  { to: "/education/plans", label: "Study Plans", icon: PenSquare, exact: false },
  { to: "/education/certificates", label: "Certificates", icon: Award, exact: false },
  { to: "/education/creator", label: "Creator", icon: UploadCloud, exact: false },
  { to: "/education/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/education/search", label: "Search", icon: Search, exact: false },
] as const;

export function EducationNav() {
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
