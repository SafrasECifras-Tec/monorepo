import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useCalcir } from "@/contexts/CalcirContext";
import { Loader2 } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ConflictWarningDialog from "@/components/ConflictWarningDialog";

interface AppLayoutProps {
  children: React.ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-card rounded-2xl border border-border/50 min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Carregando dados</p>
          <p className="text-xs text-muted-foreground mt-1.5">Preparando receitas, despesas e parceiros…</p>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, conflictDetected, resolveConflict } = useCalcir();
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevPathname = useRef<string>(location.pathname);

  useLayoutEffect(() => {
    if (prevPathname.current !== location.pathname) {
      scrollPositions.current.set(prevPathname.current, window.scrollY);
    }

    const savedPosition = scrollPositions.current.get(location.pathname) ?? 0;
    window.scrollTo(0, savedPosition);

    prevPathname.current = location.pathname;
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-transparent px-3 py-4">
        <div className="mx-auto flex w-full max-w-[1720px] gap-4">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <div className="sticky top-4 z-30">
            <TopBar />
          </div>
          {loading ? (
            <LoadingScreen />
          ) : (
            <main className="flex-1 rounded-[2rem] border border-border/70 bg-card p-6 shadow-card overflow-auto lg:p-7">
              {children}
            </main>
          )}
        </div>
        </div>
      </div>
      <ConflictWarningDialog
        open={conflictDetected}
        onReload={() => resolveConflict("reload")}
        onOverwrite={() => resolveConflict("overwrite")}
        onCancel={() => resolveConflict("cancel")}
      />
    </SidebarProvider>
  );
}
