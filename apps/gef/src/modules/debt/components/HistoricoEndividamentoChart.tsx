import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LabelList,
} from 'recharts';
import { GlassCard } from '@socios/ui';
import {
  DEBT_CHART_COLORS,
} from '@/data/debt/debtChartData';
import type { HistoricoEndividamentoItem } from '@/data/debt/debtChartData';
import {
  CHART_GRID_PROPS,
  CHART_AXIS_TICK,
  CHART_CURSOR,
  stackedTopRadius,
  ChartBarTopLabel,
  gefTooltipClass,
  gefTooltipTitleClass,
} from '@/lib/chartTheme';

interface Props {
  data: HistoricoEndividamentoItem[];
  currencyMode: 'BRL' | 'SOJA';
  sojaPrice?: number;
  viewMode?: 'Safra' | 'Ano';
}

const NAME_MAP: Record<string, string> = {
  compraDeTerras:    'Compra de Terras',
  custeios:          'Custeios',
  investimentos:     'Investimentos',
  investimentosDolar: 'Investimentos em Dólar',
};

const fmt = (value: number, mode: 'BRL' | 'SOJA', sojaPrice: number) =>
  mode === 'BRL'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value / sojaPrice) + ' sc';

const fmtCompact = (value: number) =>
  value >= 1_000_000
    ? `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`
    : value >= 1_000
    ? `R$ ${(value / 1_000).toFixed(0)}k`
    : `R$ ${value}`;

const TotalLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle"
      fill="hsl(var(--foreground))" fontSize={11} fontWeight={700}>
      {fmtCompact(value)}
    </text>
  );
};

const HISTORICO_KEYS = ['compraDeTerras', 'custeios', 'investimentos', 'investimentosDolar'] as const;

export function HistoricoEndividamentoChart({ data, currencyMode, sojaPrice = 120, viewMode = 'Ano' }: Props) {
  if (!data.length) return null;

  const HistoricoTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, e: any) => s + (e.value || 0), 0);
    return (
      <div className={gefTooltipClass}>
        <p className={gefTooltipTitleClass}>{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                {NAME_MAP[entry.dataKey] ?? entry.name}
              </span>
              <span className="font-semibold tabular-nums">
                {fmt(entry.value, currencyMode, sojaPrice)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs pt-2 mt-2 border-t border-border/50 font-bold">
          <span>Total</span>
          <span>{fmt(total, currencyMode, sojaPrice)}</span>
        </div>
      </div>
    );
  };

  return (
    <GlassCard className="p-6 flex flex-col hover:shadow-float transition-all duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">Histórico do Endividamento</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Evolução por {viewMode === 'Safra' ? 'safra' : 'ano'} até a posição atual</p>
      </div>

      <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="h-[320px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="data"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={72}
              tick={CHART_AXIS_TICK}
              tickFormatter={(v) =>
                currencyMode === 'BRL'
                  ? `R$ ${(v / 1_000_000).toFixed(0)}M`
                  : `${(v / sojaPrice / 1000).toFixed(0)}k sc`
              }
            />
            <Tooltip cursor={CHART_CURSOR} content={<HistoricoTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-muted-foreground text-xs font-medium">
                  {NAME_MAP[value] ?? value}
                </span>
              )}
            />
            <Bar dataKey="compraDeTerras"     stackId="a" fill={DEBT_CHART_COLORS.compraDeTerras}     shape={stackedTopRadius(data, 'compraDeTerras',     HISTORICO_KEYS)} barSize={36} isAnimationActive={false} />
            <Bar dataKey="custeios"           stackId="a" fill={DEBT_CHART_COLORS.custeios}           shape={stackedTopRadius(data, 'custeios',           HISTORICO_KEYS)} barSize={36} isAnimationActive={false} />
            <Bar dataKey="investimentos"      stackId="a" fill={DEBT_CHART_COLORS.investimentos}      shape={stackedTopRadius(data, 'investimentos',      HISTORICO_KEYS)} barSize={36} isAnimationActive={false} />
            <Bar dataKey="investimentosDolar" stackId="a" fill={DEBT_CHART_COLORS.investimentosDolar} shape={stackedTopRadius(data, 'investimentosDolar', HISTORICO_KEYS)} barSize={36} isAnimationActive={false}>
              <LabelList dataKey="total" content={<TotalLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}
