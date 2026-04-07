import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LabelList, ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DEBT_CHART_COLORS,
} from '@/data/debt/debtChartData';
import type { EndividamentoPorSafraItem } from '@/data/debt/debtChartData';

interface Props {
  data: EndividamentoPorSafraItem[];
  currencyMode: 'BRL' | 'SOJA';
  sojaPrice?: number;
}

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

// Label exibido no TOPO da barra (total)
const TotalLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill="#1e293b"
      fontSize={11}
      fontWeight={700}
    >
      {fmtCompact(value)}
    </text>
  );
};

export function EndividamentoPorSafraChart({ data, currencyMode, sojaPrice = 120 }: Props) {
  if (!data.length) return null;

  return (
    <GlassCard className="p-6 flex flex-col hover:shadow-card transition-all duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">Endividamento por Safra</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Composição por categoria</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
            <XAxis
              dataKey="safra"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
              dy={8}
              tickFormatter={(v) => v.replace('Safra ', '')}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={72}
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickFormatter={(v) =>
                currencyMode === 'BRL'
                  ? `R$ ${(v / 1_000_000).toFixed(0)}M`
                  : `${(v / sojaPrice / 1000).toFixed(0)}k sc`
              }
            />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [
                fmt(value, currencyMode, sojaPrice),
                name === 'custeios' ? 'Custeios'
                : name === 'investimentos' ? 'Investimentos'
                : 'Investimentos em Dólar',
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-muted-foreground text-xs font-medium">
                  {value === 'custeios' ? 'Custeios'
                    : value === 'investimentos' ? 'Investimentos'
                    : 'Investimentos em Dólar'}
                </span>
              )}
            />

            {/* Custeios — base da barra */}
            <Bar dataKey="custeios" stackId="a" fill={DEBT_CHART_COLORS.custeios} barSize={36} isAnimationActive={false} />

            {/* Investimentos — meio */}
            <Bar dataKey="investimentos" stackId="a" fill={DEBT_CHART_COLORS.investimentos} barSize={36} isAnimationActive={false} />

            {/* Investimentos em Dólar — topo */}
            <Bar dataKey="investimentosDolar" stackId="a" fill={DEBT_CHART_COLORS.investimentosDolar} radius={[4, 4, 0, 0]} barSize={36} isAnimationActive={false}>
              <LabelList dataKey="total" content={<TotalLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
