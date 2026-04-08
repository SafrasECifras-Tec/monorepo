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
    <div className="min-h-screen w-full bg-[#E8ECF2] relative font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Background Elements for Glassmorphism Depth */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-300/10 blur-[100px] pointer-events-none" />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/50 backdrop-blur-md border-b border-white/40 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm"
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
            className="h-8 w-8 rounded-lg object-cover border border-white/50 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-emerald-100 border border-emerald-200/50 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-emerald-700">
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
        isCollapsed ? "md:pl-28" : "md:pl-80",
        "p-4 md:pr-8 md:py-8"
      )}>
        {children}
      </main>
    </div>
  );
}
