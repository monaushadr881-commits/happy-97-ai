/**
 * HAPPY X — Founder Command Palette
 * Cmd/Ctrl+K opens a universal search + quick-action dispatcher.
 * Consumes only the versioned server API (never the DB directly).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Building2,
  Users,
  Sparkles,
  Activity,
  Shield,
  Settings2,
  BarChart3,
  MessageSquare,
  Search,
} from "lucide-react";
import { apiListCompanies, apiSearchKnowledge } from "@/lib/api-v1.functions";

const NAV = [
  { label: "Overview", to: "/founder", icon: LayoutDashboard },
  { label: "Companies", to: "/founder/companies", icon: Building2 },
  { label: "Users & Access", to: "/founder/users", icon: Users },
  { label: "AI Management", to: "/founder/ai", icon: Sparkles },
  { label: "Operations", to: "/founder/ops", icon: Activity },
  { label: "Security", to: "/founder/security", icon: Shield },
  { label: "Analytics", to: "/founder/analytics", icon: BarChart3 },
  { label: "System", to: "/founder/system", icon: Settings2 },
  { label: "Founder AI", to: "/assistant", icon: MessageSquare },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const companies = useQuery({
    queryKey: ["founder", "cmd", "companies"],
    queryFn: () => apiListCompanies(),
    enabled: open,
    staleTime: 30_000,
  });

  const knowledge = useQuery({
    queryKey: ["founder", "cmd", "knowledge", query],
    queryFn: () => apiSearchKnowledge({ data: { q: query, limit: 5 } }),
    enabled: open && query.length > 1,
  });

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search entities, jump to a page, run a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(n.to)}>
              <n.icon className="mr-2 h-4 w-4 text-gold/80" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {Array.isArray(companies.data) && companies.data.length > 0 && (
          <CommandGroup heading="Companies">
            {(companies.data as Array<{ id: string; display_name?: string; legal_name?: string; slug?: string }>).slice(0, 6).map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => go(`/founder/companies`)}
              >
                <Building2 className="mr-2 h-4 w-4 text-gold/80" />
                {c.display_name ?? c.legal_name ?? c.slug ?? c.id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {knowledge.data && Array.isArray(knowledge.data) && knowledge.data.length > 0 && (
          <CommandGroup heading="Knowledge">
            {(knowledge.data as Array<{ id: string; title: string }>).map((k) => (
              <CommandItem key={k.id} onSelect={() => go(`/knowledge`)}>
                <Search className="mr-2 h-4 w-4 text-gold/80" />
                {k.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
