import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { formatCurrency } from '@/lib/formatters';
import type { IndicatorRow } from '@/data/debt/debtDashboardData';
import { safraDetalhesData } from '@/data/debt/debtDashboardData';
import { cn } from '@/lib/utils';

interface Props {
  data: IndicatorRow[];
  currencyMode: 'BRL' | 'SOJA';
}

const TIPO_COLORS: Record<string, string> = {
  'Custeio':      'bg-blue-500',
  'Empréstimos':  'bg-violet-500',
  'Fazenda':      'bg-primary',
  'Consórcios':   'bg-warning',
  'Investimento': 'bg-rose-500',
};

export function DebtSafraTable({ data, currencyMode }: Props) {
  const [expandedSafra, setExpandedSafra] = useState<string | null>(null);

  const toggle = (safra: string) =>
    setExpandedSafra(prev => (prev === safra ? null : safra));

  return (
    <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-bold text-foreground">Por Safra</h3>
      </div>

      <div className="w-full">
        <div className="flex flex-col gap-4">
          {data.map((row, index) => {
            const isOpen = expandedSafra === row.safra;
            const detalhes = safraDetalhesData[row.safra] ?? [];

            return (
              <div key={index} className="bg-card/80 border border-border/60 rounded-lg overflow-hidden shadow-soft flex flex-col">
                {/* Header — clicável */}
                <button
                  onClick={() => toggle(row.safra)}
                  title={isOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
                  className="w-full text-left bg-accent/80 px-4 py-3 border-b border-border/50 flex items-center justify-between border-l-4 border-l-foreground hover:bg-muted/80 transition-colors duration-150 cursor-pointer"
                >
                  <span className="font-semibold text-muted-foreground text-base">{row.safra}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180"
                  )} />
                </button>

                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-l-4 border-l-transparent">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Endividamento</span>
                    <span className="text-base font-bold text-foreground">{formatCurrency(row.endividamento, currencyMode)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Valor Principal</span>
                    <span className="text-base font-bold text-foreground">{formatCurrency(row.principal, currencyMode)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Juros</span>
                    <span className="text-base font-bold text-foreground">{formatCurrency(row.juros, currencyMode)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Taxa Efetiva</span>
                    <span className="text-base font-bold text-foreground">{row.taxa.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Detalhamento expandido */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}>
                  <div className="border-t border-border/50 bg-accent/60 px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detalhamento por Tipo</p>

                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-5 gap-2 px-2 mb-1">
                      {['Tipo', 'Endividamento', 'Principal', 'Juros', 'Taxa'].map(h => (
                        <span key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {detalhes.map((d, i) => (
                        <div key={i} className="grid grid-cols-5 gap-2 bg-card/70 rounded-lg px-2 py-2 items-center border border-border/60">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", TIPO_COLORS[d.tipo] ?? 'bg-muted-foreground')} />
                            <span className="text-xs font-semibold text-foreground">{d.tipo}</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">{formatCurrency(d.endividamento, currencyMode)}</span>
                          <span className="text-xs font-medium text-foreground">{formatCurrency(d.principal, currencyMode)}</span>
                          <span className="text-xs font-medium text-foreground">{formatCurrency(d.juros, currencyMode)}</span>
                          <span className="text-xs font-medium text-foreground">{d.taxa}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
