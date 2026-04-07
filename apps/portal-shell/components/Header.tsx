import { TenantSelector } from "@/components/TenantSelector";
import type { User } from "@supabase/supabase-js";
import type { Fazenda } from "@socios/database";

interface HeaderProps {
  user: User;
  fazendas: Fazenda[];
  currentTenantId: string | null;
}

// Server Component — receives data as props from the page RSC
export function Header({ fazendas, currentTenantId }: HeaderProps) {
  return (
    <header className="glass-card flex h-14 items-center justify-between px-5 mx-3 mt-3 rounded-[2rem] shrink-0 sticky top-3 z-30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-foreground tracking-tight">
          Sócios do Agro
        </span>
        <span className="h-1 w-1 rounded-full bg-primary/40" />
        <span className="text-xs text-muted-foreground">Plataforma</span>
      </div>

      <div className="flex items-center gap-3">
        <TenantSelector fazendas={fazendas} currentTenantId={currentTenantId} />
      </div>
    </header>
  );
}
