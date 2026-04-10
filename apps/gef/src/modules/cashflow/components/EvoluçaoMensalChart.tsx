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
import { CHART_GRID_PROPS, CHART_AXIS_TICK, CHART_CURSOR, gefTooltipClass, gefTooltipTitleClass } from '@/lib/chartTheme';

const MONTH_KEYS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
// Índice 0-based do mês atual — meses anteriores = realizados, atual em diante = projetados
const CURRENT_MONTH_IDX = new Date().getMonth();

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

  const displayData = data;

  return (
    <GlassCard className={cn(
      'p-6 flex flex-col min-h-[350px] transition-colors duration-500',
      hasValeDaMorte ? 'bg-red-50/50 border-red-200 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''
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
            <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse mb-2">
              Alerta de Caixa Negativo
            </div>
          )}
          {/* Custom Legend */}
          <div className="flex flex-col items-end gap-2">
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
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-2.5 rounded-sm bg-[#10b981]"></div>
                <span>Realizado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-2.5 rounded-sm bg-[#10b981] opacity-35 border border-[#10b981]"></div>
                <span>Projetado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayData}
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
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK}
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
              tick={{ fill: '#3b82f6', fontSize: 11, fontWeight: 600 }}
              tickFormatter={(value) => formatCompactCurrency(value, currencyMode)}
              width={80}
              domain={[rightMin, rightMax]}
              ticks={rightTicks}
            />
            <Tooltip
              cursor={CHART_CURSOR}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const entries = payload.filter(p => p.dataKey !== 'saldoAcumulado');
                  const saldo = payload.find(p => p.dataKey === 'saldoAcumulado');
                  const fullMonth = monthFullNames[label as string] || label;
                  const displayYear = periodMode === '2026' ? '2026' : (['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].includes(label as string) ? `20${periodMode.split('/')[0]}` : `20${periodMode.split('/')[1]}`);
                  const monthIdx = MONTH_KEYS.indexOf(label as string);
                  const isProj = monthIdx >= CURRENT_MONTH_IDX;

                  return (
                    <div className={gefTooltipClass}>
                      <p className={gefTooltipTitleClass}>
                        {fullMonth} {displayYear}
                        {isProj && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">Projetado</span>
                        )}
                      </p>

                      <div className="space-y-1.5">
                        {entries.map((entry, index) => (
                          <div key={index} className="flex justify-between items-center text-xs gap-4">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              {entry.name}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(entry.value as number, currencyMode)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {saldo && (
                        <>
                          <div className="my-2 border-t border-border/50" />
                          <div className="flex justify-between items-center text-xs gap-4">
                            <span className="text-foreground font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: saldo.color }} />
                              {saldo.name}
                            </span>
                            <span className="font-bold tabular-nums">
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

            {/* Área sombreada para meses projetados */}
            {CURRENT_MONTH_IDX < 12 && (
              <ReferenceArea
                {...({ yAxisId: 'left', x1: MONTH_KEYS[CURRENT_MONTH_IDX], x2: MONTH_KEYS[11], fill: '#f1f5f9', fillOpacity: 0.55 } as any)}
              />
            )}

            {/* Reference Area for Negative Balance */}
            <ReferenceArea {...({ yAxisId: 'right', y1: -10000000, y2: 0, fill: '#fee2e2', fillOpacity: 0.5 } as any)} />
            <ReferenceLine yAxisId="right" y={0} stroke="#ef4444" strokeDasharray="3 3" />

            {/* Linha separadora: realizado → projetado */}
            {CURRENT_MONTH_IDX > 0 && CURRENT_MONTH_IDX < 12 && (
              <ReferenceLine
                {...({ yAxisId: 'left', x: MONTH_KEYS[CURRENT_MONTH_IDX] } as any)}
                stroke="#94a3b8"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{ value: 'Projetado ›', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              />
            )}

            <Bar
              yAxisId="left"
              dataKey="entradas"
              name="Entradas"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
              animationDuration={2500}
              isAnimationActive={false}
              activeBar={false}
              onClick={(data) => onMonthClick(data.month)}
              cursor="pointer"
            >
              {displayData.map((_entry, index) => {
                const isProj = index >= CURRENT_MONTH_IDX;
                const isActive = activeIndex === null || activeIndex === index;
                return (
                  <Cell
                    key={`cell-entradas-${index}`}
                    fill="#10b981"
                    fillOpacity={isProj ? (isActive ? 0.38 : 0.18) : (isActive ? 1 : 0.3)}
                    stroke={isProj ? '#10b981' : 'none'}
                    strokeWidth={isProj ? 1.5 : 0}
                    strokeDasharray={isProj ? '4 2' : undefined}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>
            <Bar
              yAxisId="left"
              dataKey="saidas"
              name="Saídas"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
              animationDuration={2500}
              isAnimationActive={false}
              activeBar={false}
              onClick={(data) => onMonthClick(data.month)}
              cursor="pointer"
            >
              {displayData.map((_entry, index) => {
                const isProj = index >= CURRENT_MONTH_IDX;
                const isActive = activeIndex === null || activeIndex === index;
                return (
                  <Cell
                    key={`cell-saidas-${index}`}
                    fill="#ef4444"
                    fillOpacity={isProj ? (isActive ? 0.38 : 0.18) : (isActive ? 1 : 0.3)}
                    stroke={isProj ? '#ef4444' : 'none'}
                    strokeWidth={isProj ? 1.5 : 0}
                    strokeDasharray={isProj ? '4 2' : undefined}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="saldoAcumulado"
              name="Saldo Acumulado"
              stroke="#3b82f6"
              strokeWidth={3}
              connectNulls={false}
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
