import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { formatCurrency } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';
import { shortTermLiquidity } from '@/data/cashflow/cashFlowChartData';

interface ShortTermRadarCardProps {
  data: typeof shortTermLiquidity;
  currencyMode: CurrencyMode;
  onClickAPagar?: () => void;
  onClickAReceber?: () => void;
  onClickVerDetalhado?: () => void;
}

export function ShortTermRadarCard({ data, currencyMode, onClickAPagar, onClickAReceber, onClickVerDetalhado }: ShortTermRadarCardProps) {
  const gap = data.aPagar - data.aReceber; // positivo = déficit, negativo = superávit
  const isDeficit = gap > 0;
  const coverage = data.aPagar > 0
    ? Math.min(100, Math.round((data.aReceber / data.aPagar) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex flex-col"
    >
      <GlassCard className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Radar de Curto Prazo</h2>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Próximos 30 dias</span>
        </div>

        <div className="flex-1 flex flex-col justify-between gap-6">
          {/* Liquidity Overview */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClickAPagar}
              className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-left hover:bg-red-50 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group/pagar"
            >
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">A Pagar</span>
              <span className="text-xl font-bold text-slate-800">{formatCurrency(data.aPagar, currencyMode)}</span>
              <p className="text-[10px] text-slate-500 mt-1 group-hover/pagar:text-red-500 transition-colors">{data.aPagarCount} compromissos agendados →</p>
            </button>
            <button
              onClick={onClickAReceber}
              className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-left hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group/receber"
            >
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">A Receber</span>
              <span className="text-xl font-bold text-slate-800">{formatCurrency(data.aReceber, currencyMode)}</span>
              <p className="text-[10px] text-slate-500 mt-1 group-hover/receber:text-emerald-600 transition-colors">{data.aReceberCount} recebimentos previstos →</p>
            </button>
          </div>

          {/* Liquidity Gap Visualizer */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-medium text-slate-500 block">Gap de Liquidez</span>
                <span className={`text-2xl font-bold ${isDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isDeficit ? '-' : '+'}{formatCurrency(Math.abs(gap), currencyMode)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase block">Cobertura</span>
                <span className={`text-sm font-bold ${coverage >= 100 ? 'text-emerald-600' : coverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {coverage}%
                </span>
              </div>
            </div>

            <div className="relative h-3 w-full bg-red-100 rounded-full overflow-hidden">
              {isDeficit && (
                <div className="absolute top-0 left-0 h-full w-full bg-red-400/60 rounded-full" />
              )}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coverage}%` }}
                transition={{ duration: 1.5, delay: 1 }}
                className={`absolute top-0 left-0 h-full rounded-full ${coverage >= 100 ? 'bg-emerald-500' : 'bg-emerald-500'}`}
              />
            </div>

            {isDeficit ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
                <p className="text-xs text-slate-900 font-medium">
                  Atenção: Os recebimentos cobrem apenas <span className="font-bold">{coverage}%</span> dos compromissos. Déficit de <span className="font-bold">{formatCurrency(gap, currencyMode)}</span> nos próximos 30 dias.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                <p className="text-xs text-slate-900 font-medium">
                  Recebimentos cobrem 100% dos compromissos com superávit de <span className="font-bold">{formatCurrency(Math.abs(gap), currencyMode)}</span>.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onClickVerDetalhado}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer"
          >
            Ver Fluxo Diário Detalhado
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
