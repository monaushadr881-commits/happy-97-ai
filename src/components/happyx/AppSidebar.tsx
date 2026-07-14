import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  GraduationCap,
  Building2,
  Palette,
  Shield,
  BookOpen,
  Users,
  Store,
  Crown,
  Settings,
  LogOut,
  Bot,
  MapPin,
  BrainCircuit,
  Globe2,
  Cloud,
  Cpu,
  Rocket,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import happyAiLogoAsset from "@/assets/happy-ai-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const primary = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/assistant", icon: Sparkles },
];

const modules = [
  { title: "Digital Human", url: "/digital-human", icon: Bot },
  { title: "Education", url: "/education", icon: GraduationCap },
  { title: "Business OS", url: "/business", icon: Building2 },
  { title: "Creator Studio", url: "/studio", icon: Palette },
  { title: "Enterprise", url: "/enterprise", icon: Shield },
  { title: "Knowledge", url: "/knowledge", icon: BookOpen },
  { title: "Community", url: "/community", icon: Users },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Hyperlocal", url: "/hyperlocal", icon: MapPin },
];

// Reserved surfaces for the v2.0 – v6.0 roadmap. Routes, feature flags,
// permissions, and API contracts already exist — implementation ships per
// phase without changing this sidebar.
const roadmap = [
  { title: "Agent OS · v2.0", url: "/agent-os", icon: Bot },
  { title: "Intelligence · v3.0", url: "/intelligence", icon: BrainCircuit },
  { title: "Global · v4.0", url: "/global", icon: Globe2 },
  { title: "Enterprise Cloud · v5.0", url: "/enterprise-cloud", icon: Cloud },
  { title: "Autonomous · v6.0", url: "/autonomous", icon: Cpu },
  { title: "Roadmap", url: "/roadmap", icon: Rocket },
];

const admin = [
  { title: "Founder", url: "/founder", icon: Crown },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const renderGroup = (label: string, items: typeof primary) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-soft-gray/70 px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={`h-10 rounded-lg transition-colors ${
                    active
                      ? "bg-gold/10 text-gold border-l-2 border-gold"
                      : "text-soft-gray hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  <Link to={item.url}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-charcoal">
      <SidebarHeader className="border-b border-white/5 h-14 flex-row items-center gap-2 px-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-gold/30 bg-obsidian shadow-[0_0_18px_-6px_rgba(212,175,55,0.6)]">
          <img
            src={happyAiLogoAsset.url}
            alt="HAPPY AI"
            className="h-full w-full object-contain p-0.5"
            loading="eager"
            decoding="async"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-paper tracking-tight">HAPPY <span className="text-gradient-gold">AI</span></span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-gold/70">Human-Centered AI</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-charcoal">
        {renderGroup("Workspace", primary)}
        {renderGroup("Modules", modules)}
        {renderGroup("Roadmap · Reserved", roadmap)}
        {renderGroup("Administration", admin)}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 bg-charcoal p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="h-10 rounded-lg text-soft-gray hover:bg-white/5 hover:text-paper"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm">Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
