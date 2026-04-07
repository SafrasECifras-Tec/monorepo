import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { formatSacas } from '@/lib/formatters';
import type { CropStock } from '@/data/cashflow/estoqueData';

const fmtCurrency = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

interface CropCardProps {
  crop: CropStock;
}

export function CropCard({ crop }: CropCardProps) {
  const [open, setOpen] = useState(false);

  const saldo        = crop.initialStock - crop.soldStock;
  const percentVend  = Math.round((crop.soldStock / crop.initialStock) * 100);
  const receita      = crop.sales.reduce((s, v) => s + v.totalValue, 0);
  const avgPriceAll  = crop.soldStock > 0
    ? crop.sales.reduce((s, v) => s + v.avgPrice * v.quantity, 0) / crop.soldStock
    : 0;

  return (
    <GlassCard className="overflow-hidden">
      {/* Header da cultura */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Badge cultura */}
          <div className={cn('px-3 py-1 rounded-full border text-sm font-semibold', crop.bgColor, crop.color)}>
            {crop.name}
          </div>

          {/* Métricas rápidas */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              Estoque inicial:{' '}
              <span className="font-semibold text-foreground">{formatSacas(crop.initialStock)}</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Vendido:{' '}
              <span className="font-semibold text-foreground">{formatSacas(crop.soldStock)}</span>
              <span className="ml-1 text-xs text-muted-foreground">({percentVend}%)</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Saldo:{' '}
              <span className="font-semibold text-primary">{formatSacas(saldo)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Receita Realizada</span>
            <span className="text-sm font-semibold text-blue-700">{fmtCurrency(receita)}</span>
          </div>
          {open
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Barra de progresso de comercialização */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Comercialização</span>
          <span className="text-xs font-medium text-muted-foreground">{percentVend}% vendido</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percentVend}%` }}
          />
        </div>
      </div>

      {/* Tabela de vendas */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-border/50">
              {/* Resumo de métricas (mobile) */}
              <div className="sm:hidden px-6 py-3 grid grid-cols-3 gap-3 bg-accent/50">
                <div>
                  <p className="text-xs text-muted-foreground">Estoque</p>
                  <p className="text-sm font-semibold text-foreground">{formatSacas(crop.initialStock)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendido</p>
                  <p className="text-sm font-semibold text-foreground">{formatSacas(crop.soldStock)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="text-sm font-semibold text-primary">{formatSacas(saldo)}</p>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent/80 border-b border-border/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qtd. Sacas</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço Médio</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {crop.sales.map((sale, idx) => (
                      <tr key={idx} className="hover:bg-accent/60 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground tabular-nums">{sale.date}</td>
                        <td className="px-6 py-3 text-right font-medium text-foreground tabular-nums">
                          {sale.quantity.toLocaleString('pt-BR')} scs
                        </td>
                        <td className="px-6 py-3 text-right text-muted-foreground tabular-nums">
                          {fmtCurrency(sale.avgPrice)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-foreground tabular-nums">
                          {fmtCurrency(sale.totalValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Rodapé com totais */}
                  <tfoot>
                    <tr className="bg-accent/80 border-t border-border">
                      <td className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-foreground tabular-nums">
                        {formatSacas(crop.soldStock)}
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-muted-foreground tabular-nums">
                        Média: {fmtCurrency(avgPriceAll)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-blue-700 tabular-nums">
                        {fmtCurrency(receita)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
