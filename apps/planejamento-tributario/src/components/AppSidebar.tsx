import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText, Calculator, Users, TrendingUp, TrendingDown,
  User, Building2, Scale, ShieldCheck, LayoutDashboard, ChevronLeft,
  ChevronDown, Wallet, Layers, CreditCard,
  MessageSquareText, ArrowLeftRight, LogOut, Compass, Settings, Link2, FileUp, Share2
} from "lucide-react";
import logoSafrasCifras from "@/assets/logo-safras-cifras.png";
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
import { useCalcir } from "@/contexts/CalcirContext";
import { supabase } from "@/integrations/supabase/client";
import { getUserFarmRole } from "@/services/supabaseData";
import ShareFarmModal from "@/components/ShareFarmModal";

const clienteItems = [
  { title: "Gerais", url: "/", icon: LayoutDashboard },
];

const operacionalItems = [
  { title: "Receitas Agro", url: "/receitas", icon: TrendingUp },
  { title: "Despesas Agro", url: "/despesas", icon: TrendingDown },
  { title: "Atividade Rural Partic.", url: "/particular-pf", icon: User },
  { title: "Rec. Não Rurais", url: "/rec-nao-rurais", icon: Wallet },
];

const configurarEstrategiaItems = [
  { title: "Simulação PJ", url: "/simulacao-pj", icon: Building2 },
  { title: "Simulação IBS/CBS", url: "/simulacao-ibs-cbs", icon: Scale },
  { title: "Gestão de Créditos", url: "/gestao-creditos", icon: CreditCard },
  { title: "Simulação IRPFM", url: "/simulacao-irpfm", icon: ShieldCheck },
];

const dashboardItems = [
  { title: "Dashboard / Análises", url: "/dashboard", icon: LayoutDashboard },
  { title: "Análises CALCIR", url: "/analises", icon: Layers },
  { title: "Relatório Final", url: "/relatorio-final", icon: FileText },
  { title: "Apuração Final", url: "/apuracao", icon: Calculator },
];

const conselheiroItem = { title: "Conselheiro", url: "/conselheiro", icon: MessageSquareText };

const configSubItems = [
  { title: "Usuários", tab: "usuarios", icon: Users },
  { title: "Importação", tab: "importacao", icon: FileUp },
  { title: "Integração", tab: "integracao", icon: Link2 },
];

export function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const { role, user, signOut } = useAuth();
  const { clienteId, setClienteId } = useCalcir();

  const collapsed = !isMobile && state === "collapsed";

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [calcirOpen, setCalcirOpen] = useState(true);
  const [clienteNome, setClienteNome] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!clienteId) { setClienteNome(""); return; }
    supabase.from("clientes").select("nome").eq("id", clienteId).single()
      .then(({ data }) => setClienteNome(data?.nome || ""));
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId || !user || role !== "consultor") { setIsOwner(false); return; }
    getUserFarmRole(user.id, clienteId).then((r) => setIsOwner(r === "owner"));
  }, [clienteId, user, role]);

  const isConfigActive = location.pathname === "/configuracoes";
  const currentTab = searchParams.get("tab") || "usuarios";

  const handleTrocarCliente = () => {
    setClienteId(null);
    navigate("/clientes");
    if (isMobile) toggleSidebar();
  };

  const handleSair = () => {
    signOut();
    if (isMobile) toggleSidebar();
  };

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";
  const userEmail = user?.email || "";

  // Renders nav items — tooltip always wraps but TooltipContent only shows in icon mode.
  const renderItems = (items: typeof clienteItems) =>
    items.map((item) => {
      const isActive = location.pathname === item.url;
      return (
        <SidebarMenuItem key={item.title} className={cn(collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                className={cn(
                  "flex items-center gap-3 py-3 rounded-[1.25rem]",
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/90 hover:shadow-soft",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-card hover:bg-sidebar-primary/95 hover:text-sidebar-primary-foreground",
                  collapsed ? "!w-11 !p-3 justify-center" : "w-full px-3.5"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-muted")} />
                {!collapsed && <span className="text-[13px]">{item.title}</span>}
              </SidebarMenuButton>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
            )}
          </Tooltip>
        </SidebarMenuItem>
      );
    });

  // Icon-only nav (always in DOM — shown when collapsed)
  const collapsedNav = (
    <SidebarGroup className="p-0">
      <SidebarGroupContent>
        <SidebarMenu className="items-center space-y-0.5">
          <SidebarMenuItem className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={() => setCalcirOpen(!calcirOpen)}
                  className="flex items-center justify-center !w-11 !p-3 rounded-[1.25rem] text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/90"
                >
                  <Compass className="h-[18px] w-[18px] shrink-0 text-sidebar-muted" />
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Planejamento Tributário</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>

          {calcirOpen && (
            <>
              <div className="w-6 border-t border-sidebar-border/40 my-1" />
              {renderItems(clienteItems)}
              {renderItems(operacionalItems)}
              {renderItems(configurarEstrategiaItems)}
              {renderItems(dashboardItems)}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // Full nav with labels (always in DOM — shown when expanded)
  const expandedNav = (
    <Collapsible open={calcirOpen} onOpenChange={setCalcirOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 group rounded-full">
        <span className={cn(
          "text-[11px] uppercase tracking-[0.06em] transition-all duration-200",
          calcirOpen ? "font-bold text-sidebar-foreground" : "font-semibold text-muted-foreground"
        )}>Planejamento Tributário</span>
        <ChevronDown className={cn(
          "h-3 w-3 text-sidebar-muted transition-transform duration-200",
          calcirOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Informações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(clienteItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Operacional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(operacionalItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Estratégia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(configurarEstrategiaItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="px-3 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Análises</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">{renderItems(dashboardItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Sidebar
      variant="sidebar"
      className={cn("border-0 bg-transparent", collapsed ? "w-[5.25rem]" : "w-[17rem]")}
      collapsible="icon"
    >
      <div className="flex h-full flex-col border-r border-sidebar-border/60 bg-sidebar">

        {/* ── Logo header ── */}
        <div className={cn(
          "flex items-center gap-3 border-b border-sidebar-border/60",
          collapsed ? "p-3 justify-center" : "px-5 py-5"
        )}>
          <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-primary/5">
            <img src={logoSafrasCifras} alt="Safras & Cifras" className="h-12 w-12 object-contain" />
          </div>
          <div className={cn(
            "min-w-0 flex-1 transition-opacity duration-150",
            collapsed ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"
          )}>
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
              {clienteNome || "Safras & Cifras"}
            </p>
            <p className="text-[11px] text-sidebar-muted truncate mt-0.5">Planejamento Tributário</p>
          </div>
        </div>

        {/* ── Nav ──
            Both nav trees are always mounted in the DOM.
            CSS opacity crossfade (GPU-composited) — zero React re-mount cost,
            zero layout reflow from the nav itself. ── */}
        <SidebarContent className={cn("flex-1 overflow-y-auto py-4 relative", collapsed ? "px-2" : "px-3")}>

          {/* Icon-only nav — visible when collapsed */}
          <div className={cn(
            "transition-opacity duration-150",
            collapsed
              ? "opacity-100"
              : "opacity-0 pointer-events-none absolute inset-x-0 top-0 px-2"
          )}>
            {collapsedNav}
          </div>

          {/* Full nav — visible when expanded */}
          <div className={cn(
            "transition-opacity duration-150",
            collapsed
              ? "opacity-0 pointer-events-none absolute inset-x-0 top-0 px-3"
              : "opacity-100"
          )}>
            {expandedNav}
          </div>

        </SidebarContent>

        {/* ── Bottom bar ── */}
        <div className={cn(
          "border-t border-sidebar-border/60 flex items-center gap-2",
          collapsed ? "p-2 flex-col" : "px-3 py-2"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2.5 rounded-xl transition-colors duration-200 hover:bg-sidebar-accent",
                collapsed ? "p-2 justify-center w-full" : "flex-1 min-w-0 px-2 py-2"
              )}>
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{userInitials}</span>
                </div>
                {!collapsed && (
                  <span className="text-[12px] text-sidebar-foreground/70 truncate min-w-0 flex-1 text-left">{userEmail}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              {role === "consultor" && (
                <>
                  <DropdownMenuItem onClick={handleTrocarCliente}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Trocar Cliente
                  </DropdownMenuItem>
                  {clienteId && (
                    <DropdownMenuItem onClick={() => setShareModalOpen(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                  )}
                  {configSubItems.map((item) => (
                    <DropdownMenuItem
                      key={item.tab}
                      onClick={() => navigate(`/configuracoes?tab=${item.tab}`)}
                      className={cn(isConfigActive && currentTab === item.tab && "bg-accent")}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
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

      {/* Share Farm Modal */}
      {role === "consultor" && clienteId && (
        <ShareFarmModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          clienteId={clienteId}
          isOwner={isOwner}
        />
      )}
    </Sidebar>
  );
}
