import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface MainLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onNavigate: (module: string) => void;
}

export function MainLayout({ children, activeModule, onNavigate }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-transparent px-3 py-4">
        <div className="mx-auto flex w-full max-w-[1720px] gap-4">
          <AppSidebar activeModule={activeModule} onNavigate={onNavigate} />
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            <div className="sticky top-4 z-30">
              <TopBar activeModule={activeModule} />
            </div>
            <main className="flex-1 rounded-[2rem] border border-border/70 bg-card p-6 shadow-card overflow-auto lg:p-7">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
