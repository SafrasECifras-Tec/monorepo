import React, { useRef, useEffect, useState } from 'react';
import {
  LayoutDashboard,
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
  ChevronDown,
  X,
  Warehouse,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClient } from '@/contexts/ClientContext';
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

const gestaoItems = [
  { id: 'dashboard',  label: 'Visão Geral',        icon: LayoutDashboard },
  { id: 'debt',       label: 'Endividamento',       icon: TrendingDown },
  { id: 'patrimony',  label: 'Balanço Patrimonial', icon: PieChart },
  { id: 'cashflow',   label: 'Fluxo de Caixa',      icon: Wallet },
  { id: 'estoque',    label: 'Estoque',             icon: Warehouse },
];

const analysisItems = [
  { id: 'dre',       label: 'DRE',               icon: FileText },
  { id: 'goals',     label: 'Plano de Metas',    icon: Target },
  { id: 'strategic', label: 'Plan. Estratégico', icon: Compass },
];

/** Width in px when sidebar is collapsed — matches md:w-[5.25rem] */
const COLLAPSED_PX = 84;

export function Sidebar({
  activeModule,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  user,
  onLogout,
}: SidebarProps) {
  const { clients, activeClient, switchClient } = useClient();

  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [tooltip,        setTooltip]        = useState<{ label: string; top: number } | null>(null);

  const userMenuRef   = useRef<HTMLDivElement>(null);
  const clientMenuRef = useRef<HTMLDivElement>(null);

  const userInitials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  // Close menus on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
      if (clientMenuRef.current && !clientMenuRef.current.contains(e.target as Node))
        setClientMenuOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Clear tooltip when sidebar expands
  useEffect(() => { if (!isCollapsed) setTooltip(null); }, [isCollapsed]);

  // ── Nav item ─────────────────────────────────────────────────────────────
  const NavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => {
    const isActive = activeModule === id;
    return (
      <button
        onClick={() => onNavigate(id)}
        onMouseEnter={(e) => {
          if (!isCollapsed) return;
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setTooltip({ label, top: r.top + r.height / 2 });
        }}
        onMouseLeave={() => setTooltip(null)}
        className={cn(
          'flex items-center rounded-[1.25rem] transition-all duration-200 cursor-pointer',
          isCollapsed
            ? 'w-11 h-11 p-0 justify-center mx-auto'
            : 'w-full gap-3 px-3.5 py-3',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-card'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/90 hover:shadow-soft',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-muted')} />
        {!isCollapsed && <span className="text-[13px]">{label}</span>}
      </button>
    );
  };

  // ── Section label / collapsed divider ────────────────────────────────────
  const SectionLabel = ({ label }: { label: string }) =>
    isCollapsed ? (
      <div className="border-t border-sidebar-border/40 mx-2 my-1.5" />
    ) : (
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60 px-3 pt-3 pb-2">
        {label}
      </p>
    );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 md:hidden" onClick={onCloseMobile} />
      )}

      {/* Fixed tooltip — outside aside to avoid overflow clipping */}
      {isCollapsed && tooltip && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{ top: tooltip.top, left: COLLAPSED_PX, transform: 'translateY(-50%)' }}
        >
          <div className="ml-3 bg-foreground/90 text-[11px] font-semibold text-primary-foreground px-2.5 py-1.5 rounded-lg shadow-float whitespace-nowrap">
            {tooltip.label}
          </div>
        </div>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 transition-[width,transform] duration-300 ease-in-out',
          isCollapsed ? 'md:w-[5.25rem]' : 'md:w-[17rem]',
          'w-[17rem]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border/60 relative">

          {/* Mobile close */}
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden absolute right-4 top-4 p-2 text-sidebar-muted hover:text-sidebar-foreground rounded-xl z-20">
              <X className="h-5 w-5" />
            </button>
          )}

          {/* ── Logo / Client Header ── */}
          <div
            ref={clientMenuRef}
            className={cn(
              'relative border-b border-sidebar-border/60',
              isCollapsed ? 'p-3 flex justify-center' : 'px-5 py-5',
            )}
          >
            <button
              onClick={() => !isCollapsed && setClientMenuOpen((v) => !v)}
              className={cn(
                'flex items-center gap-3 w-full',
                !isCollapsed && 'hover:opacity-80 transition-opacity duration-150 cursor-pointer',
                isCollapsed && 'cursor-default justify-center',
              )}
            >
              {/* Logo icon */}
              <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-primary/5">
                <img
                  src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png"
                  alt="Safras & Cifras"
                  className="h-12 w-12 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Name + subtitle (hidden when collapsed) */}
              <div
                className={cn(
                  'min-w-0 flex-1 text-left transition-opacity duration-150',
                  isCollapsed ? 'opacity-0 pointer-events-none w-0 overflow-hidden' : 'opacity-100',
                )}
              >
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
                    {activeClient?.name ?? 'Safras & Cifras'}
                  </p>
                  {clients.length > 1 && (
                    <ChevronDown className={cn('h-3.5 w-3.5 text-sidebar-muted shrink-0 transition-transform duration-200', clientMenuOpen && 'rotate-180')} />
                  )}
                </div>
                <p className="text-[11px] text-sidebar-muted truncate mt-0.5">Gestão Estratégica de Fazenda</p>
              </div>
            </button>

            {/* Client switcher dropdown */}
            {clientMenuOpen && !isCollapsed && (
              <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-card rounded-xl shadow-float border border-border/80 overflow-hidden animate-fade-in-up">
                <div className="max-h-48 overflow-y-auto py-1">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => { switchClient(client.id); setClientMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left',
                        client.id === activeClient?.id
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      {client.id === activeClient?.id
                        ? <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        : <div className="h-3.5 w-3.5 shrink-0" />
                      }
                      <span className="truncate">{client.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border/50 p-2">
                  <button
                    onClick={() => { onNavigate('ajustes'); setClientMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Gerenciar clientes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <nav className={cn('flex-1 py-3', isCollapsed ? 'px-2' : 'px-3', !isCollapsed && 'overflow-y-auto')}>

            {/* GEF section label — like PLT's "PLANEJAMENTO TRIBUTÁRIO" */}
            {!isCollapsed && (
              <p className="text-[11px] uppercase tracking-[0.06em] font-bold text-sidebar-foreground px-3 py-1.5 mb-1">
                Gestão Estratégica
              </p>
            )}

            <SectionLabel label="Gestão Fazenda" />
            <div className="space-y-0.5">
              {gestaoItems.map((item) => <NavItem key={item.id} {...item} />)}
            </div>

            <SectionLabel label="Análises" />
            <div className="space-y-0.5">
              {analysisItems.map((item) => <NavItem key={item.id} {...item} />)}
            </div>

          </nav>

          {/* ── Bottom User Bar — exact PLT layout ── */}
          <div
            ref={userMenuRef}
            className={cn(
              'border-t border-sidebar-border/60 flex items-center gap-2 relative',
              isCollapsed ? 'p-2 flex-col' : 'px-3 py-2',
            )}
          >

            {/* User dropdown popup */}
            {userMenuOpen && (
              isCollapsed ? (
                /* Collapsed → opens RIGHT */
                <div className="absolute left-full bottom-0 ml-3 z-50 w-52 bg-card rounded-xl shadow-float border border-border/80 overflow-hidden animate-fade-in-up">
                  <div className="px-3 py-2.5 border-b border-border/60">
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? user?.name ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => { onNavigate('ajustes'); setUserMenuOpen(false); }}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left',
                      activeModule === 'ajustes' ? 'bg-primary/5 text-primary font-medium' : 'text-foreground hover:bg-accent')}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Ajustes
                  </button>
                  <div className="border-t border-border/60" />
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              ) : (
                /* Expanded → opens UP */
                <div className="absolute bottom-full left-2 right-2 mb-1 z-50 bg-card rounded-xl shadow-float border border-border/80 overflow-hidden animate-fade-in-up">
                  <div className="px-3 py-2.5 border-b border-border/60">
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? user?.name ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => { onNavigate('ajustes'); setUserMenuOpen(false); }}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left',
                      activeModule === 'ajustes' ? 'bg-primary/5 text-primary font-medium' : 'text-foreground hover:bg-accent')}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Ajustes
                  </button>
                  <div className="border-t border-border/60" />
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )
            )}

            {/* User trigger — PLT style: avatar + truncated email */}
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl transition-colors duration-200 hover:bg-sidebar-accent',
                isCollapsed ? 'p-2 justify-center w-full' : 'flex-1 min-w-0 px-2 py-2',
              )}
            >
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="h-7 w-7 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{userInitials}</span>
                </div>
              )}
              {!isCollapsed && (
                <span className="text-[12px] text-sidebar-foreground/70 truncate min-w-0 flex-1 text-left">
                  {user?.email ?? user?.name ?? '—'}
                </span>
              )}
            </button>

            {/* Collapse toggle — PLT: ChevronLeft (expanded) / ChevronLeft rotate-180 (collapsed) */}
            {onToggleCollapse && !isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {onToggleCollapse && isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center p-2 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            )}

          </div>

        </div>
      </aside>
    </>
  );
}
