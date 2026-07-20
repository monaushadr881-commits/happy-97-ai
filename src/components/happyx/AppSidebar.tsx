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
  Handshake,
  UserCircle,
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
];

const portals = [
  { title: "Dealer Portal", url: "/portal/dealer", icon: Handshake },
  { title: "Customer Portal", url: "/portal/customer", icon: UserCircle },
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
      <SidebarHeader className="border-b border-white/5 h-14 flex-row items-center px-4">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-gold to-gold-deep flex items-center justify-center text-obsidian font-black text-sm shrink-0">
          H
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight ml-1">
            <span className="text-sm font-semibold text-paper tracking-tight">HAPPY X</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold/70">Executive</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-charcoal">
        {renderGroup("Workspace", primary)}
        {renderGroup("Modules", modules)}
        {renderGroup("Portals", portals)}
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
