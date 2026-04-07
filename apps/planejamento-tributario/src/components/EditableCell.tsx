import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { Pencil } from "lucide-react";

interface EditableCellProps {
  value: number | string;
  type?: "currency" | "number" | "text" | "percent" | "cpf";
  onSave: (value: number | string) => void;
  className?: string;
  disabled?: boolean;
  cellId?: string;
  enterNextCellId?: string;
  emptyText?: string;
  placeholder?: string;
  /** Exibe ícone de lápis e estilo de input para indicar editabilidade */
  showEditIcon?: boolean;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value).slice(0, 11);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

function parseBRNumber(str: string): number {
  // Remove R$, spaces, dots (thousand sep), replace comma with dot
  const cleaned = str.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Aplica máscara de número enquanto o usuário digita: 10000 → 10.000, suporta vírgula decimal */
function applyNumberMask(input: string): string {
  // Permite apenas dígitos e uma vírgula
  const cleaned = input.replace(/[^\d,]/g, "");
  const commaIdx = cleaned.indexOf(",");
  const hasComma = commaIdx !== -1;
  const intPart = hasComma ? cleaned.slice(0, commaIdx) : cleaned;
  const decPart = hasComma ? cleaned.slice(commaIdx + 1).replace(/,/g, "") : "";
  // Formata parte inteira com pontos de milhar
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasComma ? `${formattedInt},${decPart}` : formattedInt;
}

function computeExpression(str: string): number | null {
  const sanitized = str
    .replace(/[R$\s]/g, "")
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2") // remove separadores de milhar (1.000 → 1000)
    .replace(/,/g, ".")                        // vírgula decimal → ponto
    .replace(/[^0-9+\-*/().]/g, "");           // apenas chars seguros

  // só trata como expressão se tiver operador
  if (!/[+*/]/.test(sanitized) && !/\d-\d/.test(sanitized)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)() as unknown;
    if (typeof result !== "number" || !isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

export default function EditableCell({
  value,
  type = "currency",
  onSave,
  className = "",
  disabled,
  cellId,
  enterNextCellId,
  emptyText = "Clique para editar",
  placeholder,
  showEditIcon = false,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const formatted = type === "currency" ? formatCurrency(value as number)
    : type === "percent" ? formatPercent(value as number)
    : type === "number" ? formatNumber(value as number)
    : type === "cpf" ? formatCPF(String(value ?? ""))
    : String(value);
  const isEmptyText = type === "text" && String(value ?? "").trim().length === 0;
  const isEmptyCpf = type === "cpf" && onlyDigits(String(value ?? "")).length === 0;

  const startEdit = useCallback(() => {
    if (disabled) return;
    if (type === "cpf") {
      setEditValue(onlyDigits(String(value ?? "")).slice(0, 11));
    } else if (type === "text") {
      setEditValue(String(value));
    } else {
      // currency, number, percent: inicializa formatado com separadores de milhar
      setEditValue(formatNumber(Number(value) || 0));
    }
    setErrorMessage(null);
    setEditing(true);
  }, [value, type, disabled]);

  const commitEdit = useCallback(() => {
    if (type === "cpf") {
      const digits = onlyDigits(editValue).slice(0, 11);
      if (digits.length === 0) {
        setErrorMessage(null);
        setEditing(false);
        if (String(value) !== "") onSave("");
        return;
      }
      if (digits.length !== 11 || !isValidCPF(digits)) {
        setErrorMessage("CPF inválido");
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      const next = formatCPF(digits);
      setErrorMessage(null);
      setEditing(false);
      if (next !== String(value)) onSave(next);
      return;
    }

    setEditing(false);
    setErrorMessage(null);
    if (type === "text") {
      if (editValue !== value) onSave(editValue);
    } else {
      const exprResult = computeExpression(editValue);
      const num = exprResult !== null ? exprResult : parseBRNumber(editValue);
      if (num !== value) onSave(num);
    }
  }, [editValue, value, type, onSave]);

  const focusNextCell = useCallback(() => {
    if (!enterNextCellId) return;

    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-editable-cell-id="${enterNextCellId}"]`);
      if (!target) return;
      target.focus();
      target.click();
    });
  }, [enterNextCellId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitEdit();
      focusNextCell();
    }
    if (e.key === "Escape") setEditing(false);
  }, [commitEdit, focusNextCell]);

  if (editing) {
    const exprPreview = type !== "text" && type !== "cpf" ? computeExpression(editValue) : null;
    const previewLabel = exprPreview !== null
      ? `= ${type === "currency" ? formatCurrency(exprPreview) : type === "percent" ? formatPercent(exprPreview) : formatNumber(exprPreview)}`
      : null;

    return (
      <div className="relative inline-flex flex-col">
        <Input
          ref={inputRef}
          value={type === "cpf" ? formatCPF(editValue) : editValue}
          onChange={(e) => {
            if (type === "cpf") {
              setEditValue(onlyDigits(e.target.value).slice(0, 11));
              setErrorMessage(null);
              return;
            }
            if (type === "text") {
              setEditValue(e.target.value);
              return;
            }
            // currency, number, percent: aplica máscara de milhar enquanto digita
            setEditValue(applyNumberMask(e.target.value));
          }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={`h-7 px-1 py-0 text-sm border-primary/50 bg-background ${(type === "text" || type === "cpf") ? "text-left" : "text-right"} ${errorMessage ? "border-destructive" : ""} ${className}`}
          type={type === "text" ? "text" : "text"}
          inputMode={type === "cpf" ? "numeric" : undefined}
          maxLength={type === "cpf" ? 14 : undefined}
          aria-invalid={!!errorMessage}
          title={errorMessage ?? undefined}
          placeholder={placeholder || emptyText}
        />
        {previewLabel && (
          <div className="absolute top-full left-0 z-50 mt-0.5 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded shadow-md whitespace-nowrap pointer-events-none">
            {previewLabel}
          </div>
        )}
        {errorMessage && (
          <div className="absolute top-full left-0 z-50 mt-0.5 px-2 py-0.5 text-xs bg-destructive/10 border border-destructive rounded text-destructive whitespace-nowrap pointer-events-none">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  if (showEditIcon) {
    return (
      <span
        onClick={startEdit}
        data-editable-cell-id={cellId}
        tabIndex={disabled ? -1 : 0}
        className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted hover:border-primary/40 px-2 py-0.5 transition-colors min-h-7 ${disabled ? "cursor-default opacity-50" : ""} ${className}`}
        title={disabled ? undefined : "Clique para editar"}
      >
        {isEmptyText || isEmptyCpf ? <span className="text-muted-foreground/60">{emptyText}</span> : formatted}
        {!disabled && <Pencil className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />}
      </span>
    );
  }

  return (
    <span
      onClick={startEdit}
      data-editable-cell-id={cellId}
      tabIndex={disabled ? -1 : 0}
      className={`cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5 transition-colors inline-flex items-center min-h-7 ${disabled ? "cursor-default" : ""} ${className}`}
      title={disabled ? undefined : "Clique para editar"}
    >
      {isEmptyText || isEmptyCpf ? <span className="text-muted-foreground/60">{emptyText}</span> : formatted}
    </span>
  );
}
