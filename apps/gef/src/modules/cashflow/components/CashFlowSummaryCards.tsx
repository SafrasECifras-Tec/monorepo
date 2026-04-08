import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Calculator } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { formatCurrency } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';

interface CashFlowSummaryCardsProps {
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinalProjetado: number;
  currencyMode: CurrencyMode;
}

export function CashFlowSummaryCards({
  saldoInicial,
  totalEntradas,
  totalSaidas,
  saldoFinalProjetado,
  currencyMode,
}: CashFlowSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Inicial */}
      <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saldo Inicial</h3>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatCurrency(saldoInicial, currencyMode)}
        </div>
      </GlassCard>

      {/* Total de Entradas */}
      <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total de Entradas</h3>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatCurrency(totalEntradas, currencyMode)}
        </div>
      </GlassCard>

      {/* Total de Saídas */}
      <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total de Saídas</h3>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatCurrency(totalSaidas, currencyMode)}
        </div>
      </GlassCard>

      {/* Saldo Final Projetado */}
      <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saldo Final Projetado</h3>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatCurrency(saldoFinalProjetado, currencyMode)}
        </div>
      </GlassCard>
    </div>
  );
}
