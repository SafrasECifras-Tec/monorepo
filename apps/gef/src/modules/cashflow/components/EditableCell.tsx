import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { CurrencyMode } from '@/lib/formatters';

const formatValue = (value: number, currencyMode: CurrencyMode) => {
  if (value === 0) return <span className="text-[#B0B0B0]">-</span>;

  let displayValue = value;
  if (currencyMode === 'SOJA') displayValue = value / 120;
  if (currencyMode === 'USD') displayValue = value / 5.5; // Mock rate

  return displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatFullValue = (value: number, currencyMode: CurrencyMode) => {
  if (value === 0) return '-';

  let displayValue = value;
  let prefix = 'R$ ';

  if (currencyMode === 'SOJA') {
    displayValue = value / 120;
    prefix = 'scs ';
  }
  if (currencyMode === 'USD') {
    displayValue = value / 5.5; // Mock rate
    prefix = 'US$ ';
  }

  return prefix + displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface EditableCellProps {
  value: number;
  onChange: (val: number | null) => void;
  currencyMode: CurrencyMode;
  isOverride?: boolean;
}

export function EditableCell({
  value,
  onChange,
  currencyMode,
  isOverride = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const evaluateExpression = (input: string): number | null => {
    try {
      let expr = input.trim();
      if (!expr) return null;

      // Normalize numbers in the expression
      // A number is a sequence of digits, dots, and commas
      expr = expr.replace(/[\d\.,]+/g, (match) => {
        if (match.includes(',')) {
          // Has comma: treat comma as decimal, dots as thousands
          return match.replace(/\./g, '').replace(',', '.');
        } else {
          // No comma
          if ((match.match(/\./g) || []).length > 1) {
            // Multiple dots: treat as thousands
            return match.replace(/\./g, '');
          }
          // Single dot or no dot: leave as is (treat dot as decimal)
          return match;
        }
      });

      // Now expr has standard numbers (with . as decimal)
      // Remove anything that is not a digit, dot, or operator
      expr = expr.replace(/[^0-9\.\+\-\*\/\(\)]/g, '');

      if (expr) {
        // Evaluate the math expression
        const result = new Function(`return ${expr}`)();
        if (!isNaN(result) && isFinite(result)) {
          return result;
        }
      }
    } catch (e) {
      // Silent fail for preview
    }
    return null;
  };

  const handleEditClick = () => {
    setInputValue(value === 0 && !isOverride ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (!inputValue.trim()) {
      onChange(null);
      return;
    }

    const result = evaluateExpression(inputValue);
    if (result !== null) {
      onChange(result);
    }
  };

  const previewResult = evaluateExpression(inputValue);
  const isExpression =
    inputValue.includes('+') ||
    inputValue.includes('-') ||
    inputValue.includes('*') ||
    inputValue.includes('/') ||
    inputValue.includes('(');

  if (isEditing) {
    return (
      <div className="relative w-full">
        <input
          autoFocus
          className="w-full text-right bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 font-mono text-sm"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            }
            if (e.key === 'Escape') {
              setIsEditing(false);
            }
          }}
          placeholder="Ex: 200 * 150"
        />
        {isExpression && previewResult !== null && (
          <div className="absolute top-full left-0 mt-1 z-[100] bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg font-bold whitespace-nowrap flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <span className="opacity-70">=</span>
            {formatFullValue(previewResult, currencyMode)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-end group/cell cursor-pointer"
      onClick={handleEditClick}
    >
      <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 mr-1.5 transition-opacity" />
      <span className="transition-colors border-b border-transparent group-hover/cell:border-slate-300 whitespace-nowrap">
        {formatValue(value, currencyMode)}
      </span>
    </div>
  );
}
