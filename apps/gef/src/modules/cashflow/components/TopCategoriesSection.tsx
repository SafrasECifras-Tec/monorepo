import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';
import { topSaidas as topSaidasData, topEntradas as topEntradasData } from '@/data/cashflow/cashFlowChartData';

interface TopCategoriesSectionProps {
  topSaidas: typeof topSaidasData;
  topEntradas: typeof topEntradasData;
  currencyMode: CurrencyMode;
}

export function TopCategoriesSection({
  topSaidas,
  topEntradas,
  currencyMode,
}: TopCategoriesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col"
    >
      <GlassCard className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Para onde está indo o dinheiro?</h2>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">Top 5 Categorias</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Saídas */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-destructive uppercase tracking-tight flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Maiores Saídas
            </h3>
            <div className="space-y-4">
              {topSaidas.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]" title={item.category}>{item.category}</span>
                    <span className="font-bold text-foreground">{formatCurrency(item.value, currencyMode)}</span>
                  </div>
                  <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: 0.8 + (idx * 0.1) }}
                      className="absolute top-0 left-0 h-full bg-red-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.percentage}% do total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Entradas */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-primary uppercase tracking-tight flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Maiores Entradas
            </h3>
            <div className="space-y-4">
              {topEntradas.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]" title={item.category}>{item.category}</span>
                    <span className="font-bold text-foreground">{formatCurrency(item.value, currencyMode)}</span>
                  </div>
                  <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: 0.8 + (idx * 0.1) }}
                      className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.percentage}% do total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
