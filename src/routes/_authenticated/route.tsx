import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/happyx/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-obsidian text-paper">
      <p className="text-sm text-soft-gray">{error.message}</p>
    </div>
  ),
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-obsidian text-paper">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-white/5 px-4 backdrop-blur bg-obsidian/80 sticky top-0 z-30">
            <SidebarTrigger className="text-paper" />
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs uppercase tracking-[0.2em] text-soft-gray">HAPPY X</span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-gold/70">
              Executive Console
            </span>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
