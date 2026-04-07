import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CULTURAS = [
  "ARROZ COM CASCA",
  "SOJA",
  "MILHO EM GRÃO",
  "SORGO",
  "GERGELIM",
  "ALGODÃO",
  "CAFÉ",
  "UVA",
  "BEZERRO",
  "TERNEIRO",
  "NOVILHO",
  "VACA",
  "BOI",
  "FEIJÃO",
  "PEIXES",
  "PEIXES EXÓTICOS",
  "TRIGO",
  "AVEIA",
  "CEVADA",
  "CENTEIO",
  "CANOLA",
  "GIRASSOL",
  "AMENDOIM",
  "MAMONA",
  "CANA-DE-AÇÚCAR",
  "MANDIOCA",
  "BATATA",
  "TOMATE",
  "LARANJA",
  "LIMÃO",
  "BANANA",
  "MANGA",
  "MELANCIA",
  "ABACAXI",
  "MAÇÃ",
  "PÊSSEGO",
  "ERVA-MATE",
  "TABACO",
  "CACAU",
  "BORRACHA",
  "EUCALIPTO",
  "PINUS",
  "LEITE",
  "OVOS",
  "MEL",
  "LÃ",
  "SUÍNO",
  "FRANGO",
  "OVELHA",
  "CABRA",
  "BÚFALO",
  "CAVALO",
] as const;

interface ProductComboboxProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const STOP_WORDS = new Set(["de", "da", "do", "das", "dos", "em", "e", "com"]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getTokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function mapToCanonicalCultura(value: string): string {
  if (!value.trim()) return value;

  const normalizedValue = normalizeText(value);
  const exactMatch = CULTURAS.find((cultura) => normalizeText(cultura) === normalizedValue);
  if (exactMatch) return exactMatch;

  const valueTokens = new Set(getTokens(value));
  if (valueTokens.size === 0) return value;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const cultura of CULTURAS) {
    const culturaTokens = getTokens(cultura);
    const score = culturaTokens.reduce((acc, token) => acc + (valueTokens.has(token) ? 1 : 0), 0);

    if (score > bestScore && score > 0) {
      bestScore = score;
      bestMatch = cultura;
    }
  }

  return bestMatch ?? value;
}

export default function ProductCombobox({ value, onSave, className, disabled }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canonicalValue = mapToCanonicalCultura(value);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (value && canonicalValue !== value) {
      onSave(canonicalValue);
    }
  }, [value, canonicalValue, onSave]);

  const filtered = search
    ? CULTURAS.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : CULTURAS;

  const handleSelect = (cultura: string) => {
    onSave(cultura);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 h-7 px-1 py-0.5 text-xs text-left rounded cursor-pointer hover:bg-accent/30 transition-colors min-w-[80px]",
            disabled && "cursor-default opacity-60",
            className
          )}
          title={disabled ? undefined : "Clique para selecionar cultura"}
        >
          <span className="truncate font-medium">{canonicalValue || "Selecionar..."}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-popover z-50" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cultura..."
            className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm"
          />
        </div>
        <ScrollArea className="h-[240px]">
          <div className="p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma cultura encontrada</p>
            )}
            {filtered.map((cultura) => (
              <button
                key={cultura}
                onClick={() => handleSelect(cultura)}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  canonicalValue === cultura && "bg-accent/50"
                )}
              >
                <Check className={cn("h-3 w-3 shrink-0", canonicalValue === cultura ? "opacity-100" : "opacity-0")} />
                <span>{cultura}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
