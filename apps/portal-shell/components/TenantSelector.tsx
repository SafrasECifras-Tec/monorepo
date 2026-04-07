"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { setTenantId } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import type { Fazenda } from "@socios/database";

interface TenantSelectorProps {
  fazendas: Fazenda[];
  currentTenantId: string | null;
}

export function TenantSelector({ fazendas, currentTenantId }: TenantSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentFazenda = fazendas.find((f) => f.id === currentTenantId);

  const handleSelect = (fazendaId: string) => {
    setTenantId(fazendaId);
    startTransition(() => {
      router.refresh(); // re-runs Server Components with the new cookie value
    });
  };

  if (fazendas.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-medium",
            "border border-border/60 bg-background/70 shadow-soft",
            "hover:bg-accent hover:border-border transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            isPending && "opacity-60 pointer-events-none"
          )}
        >
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="max-w-[160px] truncate">
            {currentFazenda?.nome ?? "Selecionar Fazenda"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-0.5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 min-w-[240px] max-h-80 overflow-y-auto",
            "rounded-2xl border border-border bg-popover shadow-float p-1.5",
            "animate-scale-in"
          )}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Fazendas
          </p>

          {fazendas.map((fazenda) => (
            <DropdownMenu.Item
              key={fazenda.id}
              onSelect={() => handleSelect(fazenda.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer",
                "outline-none hover:bg-accent focus:bg-accent transition-colors duration-150",
                fazenda.id === currentTenantId && "text-primary"
              )}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "truncate text-[13px]",
                    fazenda.id === currentTenantId ? "font-semibold" : "font-medium"
                  )}
                >
                  {fazenda.nome}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {fazenda.municipio}, {fazenda.estado}
                  {fazenda.area_total_ha != null &&
                    ` · ${fazenda.area_total_ha.toLocaleString("pt-BR")} ha`}
                </p>
              </div>
              {fazenda.id === currentTenantId && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
