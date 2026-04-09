import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onNavigate: (module: string) => void;
}

export function MainLayout({ children, activeModule, onNavigate }: MainLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen w-full bg-transparent px-3 py-4">
        <div className="mx-auto flex w-full max-w-[1720px] gap-4">
          <AppSidebar activeModule={activeModule} onNavigate={onNavigate} />
          <main className="flex-1 min-w-0 rounded-[2rem] border border-border/70 bg-card p-6 shadow-card overflow-auto lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
