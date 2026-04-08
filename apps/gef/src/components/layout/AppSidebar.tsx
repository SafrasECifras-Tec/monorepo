import { useState } from "react";
import {
  LayoutDashboard, PieChart, Settings, LogOut, LayoutGrid, Wallet,
  FileText, TrendingDown, Target, Compass, ChevronLeft, ChevronDown,
  Warehouse, Check, X,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";

interface AppSidebarProps {
  activeModule: string;
  onNavigate: (module: string) => void;
}

const gestaoItems = [
  { id: "dashboard",  label: "Visao Geral",        icon: LayoutDashboard },
  { id: "debt",       label: "Endividamento",       icon: TrendingDown },
  { id: "patrimony",  label: "Balanco Patrimonial", icon: PieChart },
  { id: "cashflow",   label: "Fluxo de Caixa",     icon: Wallet },
  { id: "estoque",    label: "Estoque",             icon: Warehouse },
];

const analysisItems = [
  { id: "dre",       label: "DRE",               icon: FileText },
  { id: "goals",     label: "Plano de Metas",    icon: Target },
  { id: "strategic", label: "Plan. Estrategico",  icon: Compass },
];

export function AppSidebar({ activeModule, onNavigate }: AppSidebarProps) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const { user, logout } = useAuth();
  const { clients, activeClient, switchClient } = useClient();

  const collapsed = !isMobile && state === "collapsed";
  const [sectionOpen, setSectionOpen] = useState(true);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);

  const PORTAL_URL = (import.meta as any).env?.VITE_PORTAL_URL ?? "http://localhost:4000";

  const handleVoltar = () => {
    if (isMobile) toggleSidebar();
    window.location.href = PORTAL_URL;
  };

  const handleSair = () => {
    if (isMobile) toggleSidebar();
    logout();
  };

  const userInitials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const renderItems = (items: typeof gestaoItems) =>
    items.map((item) => {
      const isActive = activeModule === item.id;
      return (
        <SidebarMenuItem key={item.id} className={cn(collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => {
                  onNavigate(item.id);
                  if (isMobile) toggleSidebar();
                }}
                className={cn(
                  "flex items-center gap-3 py-3 rounded-[1.25rem]",
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/90 hover:shadow-soft",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-card hover:bg-sidebar-primary/95 hover:text-sidebar-primary-foreground",
                  collapsed ? "!w-11 !p-3 justify-center" : "w-full px-3.5",
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-muted")} />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </SidebarMenuButton>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            )}
          </Tooltip>
        </SidebarMenuItem>
      );
    });

  // Icon-only nav (collapsed state)
  const collapsedNav = (
    <SidebarGroup className="p-0">
      <SidebarGroupContent>
        <SidebarMenu className="items-center space-y-0.5">
          <SidebarMenuItem className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={() => setSectionOpen(!sectionOpen)}
                  className="flex items-center justify-center !w-11 !p-3 rounded-[1.25rem] text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/90"
                >
                  <Compass className="h-[18px] w-[18px] shrink-0 text-sidebar-muted" />
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Gestao Estrategica</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>

          {sectionOpen && (
            <>
              <div className="w-6 border-t border-sidebar-border/40 my-1" />
              {renderItems(gestaoItems)}
              <div className="w-6 border-t border-sidebar-border/40 my-1" />
              {renderItems(analysisItems)}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // Full nav with labels (expanded state)
  const expandedNav = (
    <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 group rounded-full">
        <span className={cn(
          "text-[11px] uppercase tracking-[0.06em] transition-all duration-200",
          sectionOpen ? "font-bold text-sidebar-foreground" : "font-semibold text-muted-foreground",
        )}>Gestao Estrategica</span>
        <ChevronDown className={cn(
          "h-3 w-3 text-sidebar-muted transition-transform duration-200",
          sectionOpen && "rotate-180",
        )} />
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Gestao Fazenda</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(gestaoItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Analises</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(analysisItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Sidebar
      variant="sidebar"
      className="border-0 bg-transparent"
      collapsible="icon"
    >
      <div className="flex h-full flex-col border-r border-sidebar-border/60 bg-sidebar">

        {/* Logo / Client Header */}
        <div className={cn(
          "relative border-b border-sidebar-border/60",
          collapsed ? "p-3 flex justify-center" : "px-5 py-5",
        )}>
          <button
            onClick={() => !collapsed && clients.length > 1 && setClientMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-3 w-full",
              !collapsed && clients.length > 1 && "hover:opacity-80 transition-opacity duration-150 cursor-pointer",
              (collapsed || clients.length <= 1) && "cursor-default",
              collapsed && "justify-center",
            )}
          >
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-primary/5">
              <img
                src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png"
                alt="Safras & Cifras"
                className="h-12 w-12 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className={cn(
              "min-w-0 flex-1 text-left transition-opacity duration-150",
              collapsed ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100",
            )}>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
                  {activeClient?.name ?? "Safras & Cifras"}
                </p>
                {clients.length > 1 && (
                  <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-muted shrink-0 transition-transform duration-200", clientMenuOpen && "rotate-180")} />
                )}
              </div>
              <p className="text-[11px] text-sidebar-muted truncate mt-0.5">Gestao Estrategica de Fazenda</p>
            </div>
          </button>

          {/* Client switcher dropdown */}
          {clientMenuOpen && !collapsed && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-card rounded-xl shadow-float border border-border/80 overflow-hidden animate-fade-in-up">
              <div className="max-h-48 overflow-y-auto py-1">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => { switchClient(client.id); setClientMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left",
                      client.id === activeClient?.id
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-foreground hover:bg-accent",
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
                  onClick={() => { onNavigate("ajustes"); setClientMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Gerenciar clientes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation — crossfade between collapsed/expanded */}
        <SidebarContent className={cn("flex-1 overflow-y-auto py-4 relative", collapsed ? "px-2" : "px-3")}>
          <div className={cn(
            "transition-opacity duration-150",
            collapsed ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-x-0 top-0 px-2",
          )}>
            {collapsedNav}
          </div>
          <div className={cn(
            "transition-opacity duration-150",
            collapsed ? "opacity-0 pointer-events-none absolute inset-x-0 top-0 px-3" : "opacity-100",
          )}>
            {expandedNav}
          </div>
        </SidebarContent>

        {/* Bottom user bar */}
        <div className={cn(
          "border-t border-sidebar-border/60 flex items-center gap-2",
          collapsed ? "p-2 flex-col" : "px-3 py-2",
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2.5 rounded-xl transition-colors duration-200 hover:bg-sidebar-accent",
                collapsed ? "p-2 justify-center w-full" : "flex-1 min-w-0 px-2 py-2",
              )}>
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="h-7 w-7 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{userInitials}</span>
                  </div>
                )}
                {!collapsed && (
                  <span className="text-[12px] text-sidebar-foreground/70 truncate min-w-0 flex-1 text-left">
                    {user?.email ?? user?.name ?? "—"}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? user?.name ?? "—"}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("ajustes")}>
                <Settings className="h-4 w-4 mr-2" />
                Ajustes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleVoltar}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Voltar ao Portal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSair} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
