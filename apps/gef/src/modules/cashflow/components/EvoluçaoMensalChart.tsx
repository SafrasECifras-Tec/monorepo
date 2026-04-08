import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Cell,
} from 'recharts';
import { GlassCard } from '@socios/ui';
import { formatCurrency, formatCompactCurrency } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';
import { cashFlowData, monthFullNames } from '@/data/cashflow/cashFlowChartData';
import { cn } from '@/lib/utils';

interface EvoluçaoMensalChartProps {
  data: typeof cashFlowData;
  currencyMode: CurrencyMode;
  onMonthClick: (month: string) => void;
  periodMode: string;
}

export function EvoluçaoMensalChart({
  data,
  currencyMode,
  onMonthClick,
  periodMode,
}: EvoluçaoMensalChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const hasValeDaMorte = useMemo(
    () => data.some(d => d.saldoAcumulado < 0),
    [data]
  );

  const axisCalibration = useMemo(() => {
    const getNiceStep = (rawStep: number) => {
      if (rawStep === 0) return 1000;
      const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const norm = rawStep / mag;
      let stepMultiplier = 10;
      if (norm <= 1) stepMultiplier = 1;
      else if (norm <= 2) stepMultiplier = 2;
      else if (norm <= 5) stepMultiplier = 5;
      return stepMultiplier * mag;
    };

    const dataMaxBar = Math.max(...data.map(d => Math.max(d.entradas, d.saidas)));
    const dataMaxLine = Math.max(...data.map(d => d.saldoAcumulado));
    const dataMinLine = Math.min(0, ...data.map(d => d.saldoAcumulado));

    const safeDataMaxBar = Math.max(dataMaxBar, 1000);
    const safeDataMaxLine = Math.max(dataMaxLine, 1000);

    const leftStep = getNiceStep(safeDataMaxBar / 4);
    const rightStep = getNiceStep(safeDataMaxLine / 4);

    const leftMax = leftStep * 4;
    const rightMax = rightStep * 4;

    const negativeSteps = dataMinLine < 0 ? Math.ceil(Math.abs(dataMinLine) / rightStep) : 0;

    const leftMin = -negativeSteps * leftStep;
    const rightMin = -negativeSteps * rightStep;

    const leftTicks: number[] = [];
    const rightTicks: number[] = [];
    for (let i = -negativeSteps; i <= 4; i++) {
      leftTicks.push(i * leftStep);
      rightTicks.push(i * rightStep);
    }

    return { leftMin, leftMax, leftTicks, rightMin, rightMax, rightTicks };
  }, [data]);

  const { leftMin, leftMax, leftTicks, rightMin, rightMax, rightTicks } = axisCalibration;

  return (
    <GlassCard className={cn(
      'p-6 flex flex-col min-h-[350px] transition-colors duration-500',
      hasValeDaMorte ? 'bg-destructive/5 border-destructive/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''
    )}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Evolução Mensal</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-full">Clique no mês para detalhar</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Entradas, Saídas e Saldo Acumulado</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {hasValeDaMorte && (
            <div className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold uppercase tracking-wider animate-pulse mb-2">
              Alerta de Caixa Negativo
            </div>
          )}
          {/* Custom Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
              <span className="text-muted-foreground font-medium">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
              <span className="text-muted-foreground font-medium">Saídas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
              <span className="text-muted-foreground font-medium">Saldo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 10, bottom: 20, left: 10 }}
            barGap={8}
            barCategoryGap="20%"
            onMouseMove={(state) => {
              if (state && state.isTooltipActive && state.activeTooltipIndex !== undefined) {
                setActiveIndex(state.activeTooltipIndex);
              } else {
                setActiveIndex(null);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value < 0 ? '' : formatCompactCurrency(value, currencyMode)}
              width={80}
              domain={[leftMin, leftMax]}
              ticks={leftTicks}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#3b82f6', fontSize: 12, fontWeight: 600 }}
              tickFormatter={(value) => formatCompactCurrency(value, currencyMode)}
              width={80}
              domain={[rightMin, rightMax]}
              ticks={rightTicks}
            />
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const entries = payload.filter(p => p.dataKey !== 'saldoAcumulado');
                  const saldo = payload.find(p => p.dataKey === 'saldoAcumulado');
                  const fullMonth = monthFullNames[label as string] || label;
                  const displayYear = periodMode === '2026' ? '2026' : (['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].includes(label as string) ? `20${periodMode.split('/')[0]}` : `20${periodMode.split('/')[1]}`);

                  return (
                    <div className="bg-card/95 backdrop-blur-sm border border-border p-4 rounded-xl shadow-elevated min-w-[200px]">
                      <p className="font-bold text-foreground mb-3 text-base border-b border-border/50 pb-2">
                        {fullMonth} {displayYear}
                      </p>

                      <div className="space-y-2">
                        {entries.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(entry.value as number, currencyMode)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {saldo && (
                        <>
                          <div className="my-3 border-t border-border" />
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: saldo.color }} />
                              {saldo.name}
                            </span>
                            <span className="text-sm font-extrabold text-foreground">
                              {formatCurrency(saldo.value as number, currencyMode)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference Area for Negative Balance */}
            <ReferenceArea {...({ yAxisId: 'right', y1: -10000000, y2: 0, fill: '#fee2e2', fillOpacity: 0.5 } as any)} />
            <ReferenceLine yAxisId="right" y={0} stroke="#ef4444" strokeDasharray="3 3" />

            <Bar
              yAxisId="left"
              dataKey="entradas"
              name="Entradas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              animationDuration={2500}
              isAnimationActive={false}
              activeBar={false}
              onClick={(data) => onMonthClick(data.month)}
              cursor="pointer"
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-entradas-${index}`}
                  fill="#10b981"
                  fillOpacity={activeIndex === null || activeIndex == index ? 1 : 0.3}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Bar
              yAxisId="left"
              dataKey="saidas"
              name="Saídas"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              animationDuration={2500}
              isAnimationActive={false}
              activeBar={false}
              onClick={(data) => onMonthClick(data.month)}
              cursor="pointer"
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-saidas-${index}`}
                  fill="#ef4444"
                  fillOpacity={activeIndex === null || activeIndex == index ? 1 : 0.3}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="saldoAcumulado"
              name="Saldo Acumulado"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff', cursor: 'pointer', onClick: (_: any, payload: any) => onMonthClick(payload.payload.month) }}
              activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0, cursor: 'pointer', onClick: (_: any, payload: any) => onMonthClick(payload.payload.month) }}
              animationDuration={2500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
