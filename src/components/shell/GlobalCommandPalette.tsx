/**
 * GlobalCommandPalette — R20 Enterprise Shell
 * Universal ⌘K palette available on every authenticated route. Natural-
 * language commands, module navigation, quick create, and voice input.
 * Pure UX layer — no business mutations.
 */
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  Palette,
  GraduationCap,
  Shield,
  Store,
  BookOpen,
  Users,
  MapPin,
  Bot,
  Crown,
  Settings,
  Rocket,
  BarChart3,
  Activity,
  DollarSign,
  FileText,
  Globe,
} from "lucide-react";
import { useShell } from "./ShellContext";

const MODULES = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, hint: "home" },
  { label: "HAPPY Assistant", to: "/assistant", icon: Sparkles, hint: "open happy" },
  { label: "Digital Human", to: "/digital-human", icon: Bot, hint: "talk to happy" },
  { label: "Business OS", to: "/business", icon: Building2, hint: "run the company" },
  { label: "Creator Studio", to: "/studio", icon: Palette, hint: "create anything" },
  { label: "Education", to: "/education", icon: GraduationCap, hint: "learn" },
  { label: "Enterprise", to: "/enterprise", icon: Shield, hint: "control center" },
  { label: "Marketplace", to: "/marketplace", icon: Store, hint: "buy & sell" },
  { label: "Knowledge", to: "/knowledge", icon: BookOpen, hint: "search knowledge" },
  { label: "Community", to: "/community", icon: Users, hint: "people" },
  { label: "Hyperlocal", to: "/hyperlocal", icon: MapPin, hint: "hyperlocal" },
] as const;

const ACTIONS = [
  { label: "Create a website", to: "/business", icon: Globe },
  { label: "Build an Android app", to: "/business", icon: Rocket },
  { label: "Deploy project", to: "/business", icon: Rocket },
  { label: "Show revenue", to: "/founder", icon: DollarSign },
  { label: "Open CRM", to: "/business", icon: Users },
  { label: "Find invoices", to: "/business", icon: FileText },
  { label: "Start presentation", to: "/digital-human/presentation", icon: Sparkles },
  { label: "Generate report", to: "/founder/analytics", icon: BarChart3 },
] as const;

const ADMIN = [
  { label: "Founder Command Center", to: "/founder", icon: Crown },
  { label: "Operations", to: "/founder/ops", icon: Activity },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function GlobalCommandPalette() {
  const { paletteOpen, closePalette } = useShell();
  const navigate = useNavigate();

  const go = useCallback(
    (to: string) => {
      closePalette();
      // defer navigation so dialog closes cleanly
      setTimeout(() => navigate({ to }), 40);
    },
    [closePalette, navigate]
  );

  return (
    <CommandDialog open={paletteOpen} onOpenChange={(o) => (o ? null : closePalette())}>
      <CommandInput placeholder="Type a command, module or say 'open CRM'…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          {ACTIONS.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.to)}>
              <a.icon className="mr-2 h-4 w-4 text-gold/80" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modules">
          {MODULES.map((m) => (
            <CommandItem key={m.to} onSelect={() => go(m.to)} keywords={[m.hint]}>
              <m.icon className="mr-2 h-4 w-4 text-gold/80" />
              <span className="flex-1">{m.label}</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-soft-gray/60">{m.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Administration">
          {ADMIN.map((a) => (
            <CommandItem key={a.to} onSelect={() => go(a.to)}>
              <a.icon className="mr-2 h-4 w-4 text-gold/80" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
