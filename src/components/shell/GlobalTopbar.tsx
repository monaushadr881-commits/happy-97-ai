/**
 * GlobalTopbar — R20 Enterprise Shell
 * Persistent adaptive top navigation for every authenticated route.
 * Provides: global search trigger, quick create, notifications, theme,
 * HAPPY quick-launch, and profile menu. No business logic — pure UX layer.
 */
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Bell,
  Sparkles,
  Plus,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Crown,
  ChevronRight,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, useNotifications } from "@/kernel";
import { useShell } from "./ShellContext";

function useCrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segs = pathname.split("/").filter(Boolean);
  return segs.map((s, i) => ({
    label: s.replace(/-/g, " "),
    href: "/" + segs.slice(0, i + 1).join("/"),
  }));
}

export function GlobalTopbar() {
  const { theme, setTheme } = useTheme();
  const { notifications } = useNotifications();
  const { openPalette } = useShell();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const crumbs = useCrumbs();
  const unread = notifications.length;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b border-white/5 bg-obsidian/80 backdrop-blur px-3 md:px-4">
      <SidebarTrigger className="text-paper" />
      <div className="h-4 w-px bg-white/10" />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="hidden md:flex items-center gap-1 text-xs text-soft-gray min-w-0">
        <Link to="/dashboard" className="hover:text-paper">HAPPY X</Link>
        {crumbs.slice(0, 3).map((c) => (
          <span key={c.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />
            <Link to={c.href} className="capitalize hover:text-paper truncate">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      {/* Search trigger */}
      <button
        onClick={openPalette}
        aria-label="Open global search"
        className="ml-auto md:ml-6 flex-1 max-w-md flex items-center gap-2 h-9 px-3 rounded-full border border-white/10 bg-white/[0.02] text-soft-gray hover:text-paper hover:border-gold/40 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs flex-1 text-left truncate">
          Search projects, apps, CRM, invoices…
        </span>
        <kbd className="hidden sm:inline text-[10px] font-mono border border-white/10 rounded px-1.5 py-0.5 text-soft-gray/80">
          ⌘K
        </kbd>
      </button>

      {/* Quick create */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-soft-gray hover:text-paper hover:bg-white/5 min-h-11 min-w-11"
            aria-label="Quick create"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-charcoal border-white/10">
          <DropdownMenuLabel className="text-xs uppercase tracking-[0.2em] text-soft-gray/70">
            Quick create
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate({ to: "/studio" })}>New creative</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/business" })}>New business record</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/knowledge" })}>New note</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/enterprise" })}>New workspace item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* HAPPY quick-launch */}
      <Button
        onClick={() => navigate({ to: "/assistant" })}
        size="sm"
        className="hidden sm:inline-flex h-9 rounded-full bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 gap-1.5"
        aria-label="Open HAPPY assistant"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">HAPPY</span>
      </Button>

      {/* Theme */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setTheme(theme === "obsidian" ? "platinum" : "obsidian")}
        className="text-soft-gray hover:text-paper hover:bg-white/5 min-h-11 min-w-11"
        aria-label="Toggle theme"
      >
        {theme === "obsidian" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="relative text-soft-gray hover:text-paper hover:bg-white/5 min-h-11 min-w-11"
            aria-label={`Notifications (${unread} unread)`}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-gold ring-2 ring-obsidian" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-charcoal border-white/10">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-soft-gray/70">Notifications</span>
            {unread > 0 && (
              <span className="text-[10px] text-gold">{unread} new</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-soft-gray">
              You're all caught up.
            </div>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                <span className="text-xs font-medium text-paper">{n.title}</span>
                {n.description && <span className="text-[11px] text-soft-gray line-clamp-2">{n.description}</span>}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-9 w-9 bg-white/5 text-paper hover:bg-white/10 min-h-11 min-w-11"
            aria-label="Profile menu"
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-charcoal border-white/10">
          <DropdownMenuLabel className="text-xs uppercase tracking-[0.2em] text-soft-gray/70">
            Account
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/founder" })}>
            <Crown className="mr-2 h-4 w-4" /> Founder mode
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem onClick={signOut} className="text-danger">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
