import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Construction } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import logoConnectere from "@/assets/logo-connectere.png";
import logoAegro from "@/assets/logo-aegro.png";

export type SourceSystem = "connectere" | "aegro";

interface IntegrationSelectorProps {
  currentSystem: SourceSystem | null;
  onSelect: (system: SourceSystem) => void;
  onDisconnect: () => void;
}

const systems: { id: SourceSystem; label: string; description: string; logo: string }[] = [
  {
    id: "connectere",
    label: "Connectere (+Gestão)",
    description: "Sincronize notas fiscais, lançamentos contábeis e financeiros via API Connectere.",
    logo: logoConnectere,
  },
  {
    id: "aegro",
    label: "Aegro",
    description: "Sincronize lançamentos financeiros, patrimônios e safras via API pública Aegro.",
    logo: logoAegro,
  },
];

export default function IntegrationSelector({ currentSystem, onSelect, onDisconnect }: IntegrationSelectorProps) {
  const [confirmSwitch, setConfirmSwitch] = useState<SourceSystem | null>(null);

  const handleClick = (systemId: SourceSystem) => {
    if (currentSystem && currentSystem !== systemId) {
      setConfirmSwitch(systemId);
    } else {
      onSelect(systemId);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {systems.map((sys) => {
          const isActive = currentSystem === sys.id;
          return (
            <Card
              key={sys.id}
              className={cn(
                "cursor-pointer border-2 transition-all duration-200 hover:shadow-md",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 hover:border-border"
              )}
              onClick={() => handleClick(sys.id)}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center bg-muted">
                    <img src={sys.logo} alt={sys.label} className="h-full w-full object-cover" />
                  </div>
                  {isActive && (
                    <Badge className="text-[10px]">Conectado</Badge>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                      {sys.label}
                    </p>
                    {sys.id === "aegro" && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
                        <Construction className="h-3 w-3" />
                        Em desenvolvimento
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{sys.description}</p>
                </div>
                {isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive h-7 px-2"
                    onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                  >
                    Desconectar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!confirmSwitch} onOpenChange={() => setConfirmSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Trocar sistema de integração?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao trocar de sistema, os dados importados pelo sistema anterior serão removidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmSwitch) onSelect(confirmSwitch);
                setConfirmSwitch(null);
              }}
            >
              Trocar Sistema
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
