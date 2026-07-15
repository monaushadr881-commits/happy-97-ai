/**
 * WorkspaceSwitcher — R21
 * Dropdown for switching between Founder / Business / CRM / ERP / … and
 * between H.P businesses. Pure UX layer over WorkspaceProvider.
 */
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/workspace";

export function WorkspaceSwitcher() {
  const { activeWorkspace, workspaces, setActiveWorkspace, activeBusiness, businesses, setActiveBusiness } = useWorkspace();
  const navigate = useNavigate();

  const Icon = activeWorkspace?.icon ?? Building2;
  const label = activeWorkspace?.label ?? "Workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex h-9 gap-2 rounded-full border border-white/10 bg-white/[0.02] text-paper hover:bg-white/5 hover:border-gold/40"
          aria-label="Switch workspace or business"
        >
          <Icon className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs font-medium max-w-[9rem] truncate">{label}</span>
          <span className="hidden lg:inline text-[10px] text-soft-gray/70">· {activeBusiness.name}</span>
          <ChevronsUpDown className="h-3 w-3 text-soft-gray" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-charcoal border-white/10 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-soft-gray/70">
          Business
        </DropdownMenuLabel>
        {businesses.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => setActiveBusiness(b.id)}
            className="flex items-start gap-2"
          >
            <Check className={`mt-1 h-3.5 w-3.5 shrink-0 ${b.id === activeBusiness.id ? "text-gold" : "opacity-0"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-paper truncate">{b.name}</p>
              <p className="text-[10px] text-soft-gray truncate">{b.tagline}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-soft-gray/70">
          Workspace
        </DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => {
              setActiveWorkspace(w.id);
              navigate({ to: w.route });
            }}
            className="flex items-center gap-2"
          >
            <w.icon className="h-3.5 w-3.5 text-gold/80 shrink-0" />
            <span className="flex-1 text-xs text-paper truncate">{w.label}</span>
            <span className="text-[10px] text-soft-gray/70 truncate">{w.tagline}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
