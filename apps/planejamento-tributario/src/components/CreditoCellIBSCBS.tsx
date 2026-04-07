import { useState, useRef, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { CreditoIBSCBS } from "@/contexts/CalcirContext";
import { formatNumber } from "@/lib/format";

const CONFIG: Record<CreditoIBSCBS, { label: string; pill: string; dot: string }> = {
  cheia: {
    label: "Créd. Cheio",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
  reducao60: {
    label: "Red. 60%",
    pill: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  diesel: {
    label: "Diesel",
    pill: "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
    dot: "bg-orange-500",
  },
  simples_nacional: {
    label: "S. Nacional",
    pill: "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700",
    dot: "bg-violet-500",
  },
  sem_credito: {
    label: "Sem Créd.",
    pill: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground/50",
  },
};

const OPTIONS: { label: string; value: CreditoIBSCBS }[] = [
  { label: "Crédito Cheio", value: "cheia" },
  { label: "Redução 60%", value: "reducao60" },
  { label: "Diesel (por litro)", value: "diesel" },
  { label: "Simples Nacional", value: "simples_nacional" },
  { label: "Sem Crédito", value: "sem_credito" },
];

function applyNumberMask(input: string): string {
  const cleaned = input.replace(/[^\d,]/g, "");
  const commaIdx = cleaned.indexOf(",");
  const hasComma = commaIdx !== -1;
  const intPart = hasComma ? cleaned.slice(0, commaIdx) : cleaned;
  const decPart = hasComma ? cleaned.slice(commaIdx + 1).replace(/,/g, "") : "";
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasComma ? `${formattedInt},${decPart}` : formattedInt;
}

function parseBRNumber(str: string): number {
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function SubValueInput({
  value,
  onSave,
  suffix,
}: {
  value: number;
  onSave: (v: number) => void;
  suffix: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const num = parseBRNumber(editValue);
    if (num !== value) onSave(num);
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      if (e.key === "Escape") setEditing(false);
    },
    [commit]
  );

  if (editing) {
    return (
      <span className="inline-flex items-baseline gap-0.5 mt-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(applyNumberMask(e.target.value))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-14 h-5 text-[11px] text-right border-b-2 border-primary bg-transparent px-0.5 focus:outline-none"
        />
        <span className="text-[10px] text-muted-foreground font-medium">{suffix}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditValue(value === 0 ? "" : formatNumber(value));
        setEditing(true);
      }}
      className="mt-1 inline-flex items-baseline gap-0.5 px-1 cursor-pointer group"
      title="Clique para editar"
    >
      <span className={`text-[11px] font-medium border-b border-dashed pb-px transition-colors group-hover:border-foreground ${value === 0 ? "text-muted-foreground/50 border-muted-foreground/30" : "border-current"}`}>
        {value === 0 ? "—" : formatNumber(value)}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium">{suffix}</span>
    </button>
  );
}

interface CreditoCellIBSCBSProps {
  creditoIBSCBS: CreditoIBSCBS;
  quantidadeLitros?: number;
  percentualCreditoSN?: number;
  onChangeCreditoType: (v: CreditoIBSCBS) => void;
  onChangeLitros: (v: number) => void;
  onChangeSN: (v: number) => void;
}

export default function CreditoCellIBSCBS({
  creditoIBSCBS,
  quantidadeLitros = 0,
  percentualCreditoSN = 0,
  onChangeCreditoType,
  onChangeLitros,
  onChangeSN,
}: CreditoCellIBSCBSProps) {
  const cfg = CONFIG[creditoIBSCBS];

  return (
    <div className="flex flex-col items-center gap-0">
      <Select value={creditoIBSCBS} onValueChange={(v) => onChangeCreditoType(v as CreditoIBSCBS)}>
        <SelectTrigger
          className={`h-6 px-2 py-0 text-[10px] font-semibold rounded-full shadow-none gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${cfg.pill}`}
          style={{ minWidth: 0, width: "auto" }}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          <span>{cfg.label}</span>
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${CONFIG[opt.value].dot}`} />
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {creditoIBSCBS === "diesel" && (
        <SubValueInput value={quantidadeLitros} onSave={onChangeLitros} suffix="L" />
      )}
      {creditoIBSCBS === "simples_nacional" && (
        <SubValueInput value={percentualCreditoSN} onSave={onChangeSN} suffix="%" />
      )}
    </div>
  );
}
