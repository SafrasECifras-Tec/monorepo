import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  activeModule?: string;
  onNavigate?: (module: string) => void;
}

export function MainLayout({ children, activeModule = 'dre', onNavigate }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const [internalModule, setInternalModule] = React.useState(activeModule);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const currentModule = onNavigate ? activeModule : internalModule;
  const handleNavigate = (module: string) => {
    if (onNavigate) onNavigate(module);
    else setInternalModule(module);
    setIsMobileOpen(false);
  };

  return (
    <div className="min-h-screen w-full relative font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background Elements for Glassmorphism Depth */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-chart-4/20 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-chart-5/10 blur-[100px] pointer-events-none" />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-card sticky top-0 z-30 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-card rounded-xl border border-border text-muted-foreground shadow-soft"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png"
            alt="Safras & Cifras"
            className="h-6 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="h-8 w-8 rounded-xl object-cover border border-border/50 shadow-soft"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-soft">
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar
        activeModule={currentModule}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className={cn(
        "relative z-10 min-h-screen transition-all duration-300",
        isCollapsed ? "md:pl-[6.25rem]" : "md:pl-[18rem]",
        "p-4 md:pr-8 md:py-8"
      )}>
        {children}
      </main>
    </div>
  );
}
