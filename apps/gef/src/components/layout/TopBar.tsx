import { SidebarTrigger } from "@/components/ui/sidebar";
import { useClient } from "@/contexts/ClientContext";

interface TopBarProps {
  activeModule?: string;
}

const moduleLabels: Record<string, string> = {
  dashboard: "Visao Geral",
  debt: "Endividamento",
  patrimony: "Balanco Patrimonial",
  cashflow: "Fluxo de Caixa",
  estoque: "Estoque",
  dre: "DRE",
  goals: "Plano de Metas",
  strategic: "Plan. Estrategico",
  ajustes: "Ajustes",
};

export function TopBar({ activeModule }: TopBarProps) {
  const { activeClient } = useClient();

  return (
    <header className="glass-card flex h-14 items-center justify-between rounded-[2rem] px-5 shrink-0 shadow-float">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="lg:hidden rounded-full border border-border/60 bg-background/70 text-foreground shadow-soft" />
        <div className="flex items-center gap-2 min-w-0">
          {activeClient && (
            <span className="text-sm font-semibold text-foreground truncate">
              {activeClient.name}
            </span>
          )}
          {activeModule && moduleLabels[activeModule] && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-sm text-muted-foreground truncate">
                {moduleLabels[activeModule]}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
