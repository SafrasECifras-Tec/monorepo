import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  LineChart,
  PieChart,
  Settings,
  LogOut,
  Wallet,
  FileText,
  TrendingDown,
  Target,
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Warehouse
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientSelector } from '@/components/layout/ClientSelector';
import { type AuthUser } from '@/contexts/AuthContext';

interface SidebarProps {
  activeModule: string;
  onNavigate: (module: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export function Sidebar({ activeModule, onNavigate, isCollapsed = false, onToggleCollapse, isMobileOpen = false, onCloseMobile, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'debt', label: 'Endividamento', icon: TrendingDown },
    { id: 'patrimony', label: 'Balanço Patrimonial', icon: PieChart },
    { id: 'cashflow', label: 'Fluxo de caixa', icon: Wallet },
    { id: 'estoque', label: 'Estoque', icon: Warehouse },
    { id: 'dre', label: 'DRE', icon: FileText },
    { id: 'goals', label: 'Plano de metas', icon: Target },
    { id: 'strategic', label: 'Plan. Estratégico', icon: Compass },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full p-4 z-50 transition-[width,transform] duration-300 ease-in-out",
        // Desktop
        "md:block",
        isCollapsed ? "md:w-28" : "md:w-72",
        // Mobile
        "w-72",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <GlassCard className="h-full flex flex-col bg-white/50 border-white/40 relative !overflow-visible">
          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden absolute right-4 top-4 p-2 text-slate-500 hover:text-slate-800 bg-white/50 rounded-lg z-20"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Toggle Button (Desktop Only) */}
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className={cn(
                "hidden md:block absolute -right-3 bg-white border border-slate-200 rounded-full p-1.5 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all duration-300 z-10",
                isCollapsed ? "top-[89px]" : "top-[105px]"
              )}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}

          {/* Logo Area */}
          <div className={cn("p-8 pb-4 transition-all duration-300", isCollapsed ? "md:px-2" : "")}>
            <div className={cn("flex items-center justify-center transition-all duration-300", isCollapsed ? "h-12" : "h-16")}>
              <img 
                src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png" 
                alt="Safras & Cifras" 
                className={cn("h-full w-auto object-contain transition-all duration-300", isCollapsed ? "md:scale-150" : "scale-110")}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

          {/* Client Selector */}
          <ClientSelector isCollapsed={isCollapsed} />

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 overflow-hidden transition-all duration-200", isCollapsed ? "md:opacity-0 md:max-h-0 md:mb-0" : "opacity-100 max-h-8")}>
              Menu Principal
            </div>
            
            {menuItems.map((item) => {
              const isActive = activeModule === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden cursor-pointer",
                    isCollapsed ? "md:justify-center py-3.5 md:px-0 gap-3 px-4" : "gap-3 px-4 py-3.5",
                    isActive
                      ? "bg-emerald-600/10 text-emerald-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-white/40 hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
                  )}
                  <Icon className={cn("h-5 w-5 transition-colors shrink-0", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className={cn("whitespace-nowrap text-sm overflow-hidden transition-all duration-200", isCollapsed ? "md:opacity-0 md:w-0 md:max-w-0" : "opacity-100 max-w-xs")}>{item.label}</span>
                </button>
              );
            })}

            <div className={cn("mt-8 mb-4", isCollapsed ? "md:px-0 md:text-center px-2" : "px-2")}>
              <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider overflow-hidden transition-all duration-200", isCollapsed ? "md:opacity-0 md:max-h-0" : "opacity-100 max-h-8")}>
                Configurações
              </div>
              <div className={cn("w-full h-px bg-slate-200 hidden", isCollapsed ? "md:block" : "")} />
            </div>
            
            <button
              title={isCollapsed ? "Ajustes" : undefined}
              onClick={() => onNavigate('ajustes')}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden cursor-pointer",
                isCollapsed ? "md:justify-center py-3.5 md:px-0 gap-3 px-4" : "gap-3 px-4 py-3.5",
                activeModule === 'ajustes'
                  ? "bg-emerald-600/10 text-emerald-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-white/40 hover:text-slate-900"
              )}
            >
              {activeModule === 'ajustes' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
              )}
              <Settings className={cn("h-5 w-5 transition-colors shrink-0", activeModule === 'ajustes' ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
              <span className={cn("whitespace-nowrap text-sm overflow-hidden transition-all duration-200", isCollapsed ? "md:opacity-0 md:w-0 md:max-w-0" : "opacity-100 max-w-xs")}>Ajustes</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 mt-auto">
            <GlassCard className={cn(
              "flex items-center bg-white/40 border-white/30",
              isCollapsed ? "md:p-2 md:justify-center p-3 gap-3" : "p-3 gap-3"
            )}>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="rounded-lg object-cover border border-white/50 shadow-sm h-10 w-10 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="rounded-lg bg-emerald-100 border border-emerald-200/50 shadow-sm h-10 w-10 shrink-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-700">
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
              )}
              <div className={cn("flex-1 min-w-0 flex items-center justify-between overflow-hidden transition-all duration-200", isCollapsed ? "md:opacity-0 md:w-0 md:max-w-0" : "opacity-100 max-w-full")}>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sair"
                  className="p-1.5 rounded-lg hover:bg-red-50 group transition-colors shrink-0"
                >
                  <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            </GlassCard>
          </div>
        </GlassCard>
      </aside>
    </>
  );
}
