import { useCalcir } from "@/contexts/CalcirContext";
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';

interface ParceiroSelectorProps {
  value: string;
  onValueChange: (id: string) => void;
}

export default function ParceiroSelector({ value, onValueChange }: ParceiroSelectorProps) {
  const { state } = useCalcir();

  if (state.parceiros.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="text-xs font-semibold">Parceiro:</span>
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 w-[220px] sm:w-[240px] bg-background">
          <SelectValue placeholder="Selecionar parceiro" />
        </SelectTrigger>
        <SelectContent>
          {state.parceiros.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
