import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/happyx/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ShellProvider } from "@/components/shell/ShellContext";
import { WorkspaceProvider } from "@/workspace";
import { GlobalTopbar } from "@/components/shell/GlobalTopbar";
import { GlobalCommandPalette } from "@/components/shell/GlobalCommandPalette";
import { FloatingHappy } from "@/components/shell/FloatingHappy";

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
    <ShellProvider>
      <WorkspaceProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-obsidian text-paper">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <GlobalTopbar />
              <main className="flex-1 min-w-0">
                <Outlet />
              </main>
            </div>
          </div>
          <GlobalCommandPalette />
          <FloatingHappy />
        </SidebarProvider>
      </WorkspaceProvider>
    </ShellProvider>
  );
}

