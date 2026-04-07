import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import { formatNumber } from "@/lib/format";

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

interface InlineNumberInputProps {
  value: number;
  onSave: (value: number) => void;
  suffix?: string;
  placeholder?: string;
  /** Tailwind width class for the input when editing, e.g. "w-16" */
  inputWidth?: string;
  className?: string;
}

export default function InlineNumberInput({
  value,
  onSave,
  suffix,
  placeholder = "0",
  inputWidth = "w-16",
  className = "",
}: InlineNumberInputProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setEditValue(value === 0 ? "" : formatNumber(value));
    setEditing(true);
  }, [value]);

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
      <span className="inline-flex items-center gap-0.5">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(applyNumberMask(e.target.value))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${inputWidth} h-5 text-[10px] text-right border border-primary/50 rounded bg-background px-1 focus:outline-none`}
        />
        {suffix && (
          <span className="text-[9px] text-muted-foreground font-medium">{suffix}</span>
        )}
      </span>
    );
  }

  return (
    <span
      onClick={startEdit}
      className={`cursor-pointer inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 hover:bg-muted hover:border-primary/40 px-1.5 py-0.5 transition-colors ${className}`}
      title="Clique para editar"
    >
      <span className="text-[10px] font-medium">
        {value === 0 ? (
          <span className="text-muted-foreground/60">{placeholder}</span>
        ) : (
          formatNumber(value)
        )}
      </span>
      {suffix && (
        <span className="text-[9px] text-muted-foreground font-medium">{suffix}</span>
      )}
      <Pencil className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
    </span>
  );
}
