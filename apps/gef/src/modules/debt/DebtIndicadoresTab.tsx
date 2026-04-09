import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell, LabelList } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/contexts/SettingsContext';
import { GaugeChart } from './components/GaugeChart';
import type { EbitdaRow, CustoFinanceiroRow } from '@/data/debt/debtIndicadoresData';

interface Props {
  currencyMode: 'BRL' | 'SOJA';
  analisarPor: 'Valores Médios' | 'Valores Projetados';
  ebitdaData?: EbitdaRow[];
  custoFinanceiroData?: CustoFinanceiroRow[];
  custoFinanceiroEbitdaData?: CustoFinanceiroRow[];
  endividamentoReceita?: number;
  endividamentoEbitda?: number;
  custeioRatio?: number;
}

function IndicadorPlaceholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <GlassCard className="p-6 flex flex-col items-center justify-center hover:shadow-md transition-all duration-300 min-h-[300px]">
      <BarChart3 className="h-10 w-10 text-slate-300 mb-3" />
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs">
        {subtitle ?? 'Dados de DRE/EBITDA necessários. Importe a aba correspondente para calcular este indicador.'}
      </p>
    </GlassCard>
  );
}

export function DebtIndicadoresTab({
  currencyMode,
  analisarPor,
  ebitdaData = [],
  custoFinanceiroData: cfData = [],
  custoFinanceiroEbitdaData: cfEbitdaData = [],
  endividamentoReceita,
  endividamentoEbitda,
  custeioRatio,
}: Props) {
  const [custoFinanceiroVs, setCustoFinanceiroVs] = React.useState<'Desembolso Operacional' | 'EBITDA'>('Desembolso Operacional');
  const [activeBarIndex, setActiveBarIndex] = React.useState<number | null>(null);
  const { debtIndicadores: vis } = useSettings();

  const currentCustoFinanceiroData = useMemo(
    () => custoFinanceiroVs === 'Desembolso Operacional' ? cfData : cfEbitdaData,
    [custoFinanceiroVs, cfData, cfEbitdaData],
  );

  const hasEbitdaData = ebitdaData.length > 0;
  const hasCustoFinanceiroData = currentCustoFinanceiroData.length > 0;
  const hasAquisicoes = useMemo(() => ebitdaData.some(d => d.aquisicoes > 0), [ebitdaData]);
  const hasConsorcios = useMemo(() => ebitdaData.some(d => d.consorcios > 0), [ebitdaData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {vis.comprometimento_ebitda && (
            hasEbitdaData ? (
              <GlassCard className="p-6 h-[450px] flex flex-col hover:shadow-md transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">Comprometimento do EBITDA</h3>
                  <p className="text-xs text-slate-500 italic mt-1">Investimentos + Aquisições de Terras + Consórcios + Juros / EBITDA</p>
                </div>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ebitdaData}
                      margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
                      onMouseMove={state => {
                        if (state?.isTooltipActive && state.activeTooltipIndex !== undefined) {
                          setActiveBarIndex(state.activeTooltipIndex);
                        } else {
                          setActiveBarIndex(null);
                        }
                      }}
                      onMouseLeave={() => setActiveBarIndex(null)}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.4 }} formatter={(value: number) => `${value}%`} />
                      <Legend verticalAlign="top" align="left" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />

                      <Bar dataKey="investimentos" name="Investimentos" stackId="a" fill="#3b82f6" isAnimationActive={false} activeBar={false}>
                        {ebitdaData.map((_, i) => (
                          <Cell key={i} fill="#3b82f6" opacity={activeBarIndex === null || activeBarIndex === i ? 1 : 0.3} />
                        ))}
                        <LabelList dataKey="investimentos" position="center" fill="white" formatter={(v: number) => `${v}%`} fontSize={12} fontWeight={500} />
                      </Bar>

                      {hasAquisicoes && (
                        <Bar dataKey="aquisicoes" name="Aquisições de Terras" stackId="a" fill="#8b5cf6" isAnimationActive={false} activeBar={false}>
                          {ebitdaData.map((_, i) => (
                            <Cell key={i} fill="#8b5cf6" opacity={activeBarIndex === null || activeBarIndex === i ? 1 : 0.3} />
                          ))}
                        </Bar>
                      )}

                      {hasConsorcios && (
                        <Bar dataKey="consorcios" name="Consórcios" stackId="a" fill="#cbd5e1" isAnimationActive={false} activeBar={false}>
                          {ebitdaData.map((_, i) => (
                            <Cell key={i} fill="#cbd5e1" opacity={activeBarIndex === null || activeBarIndex === i ? 1 : 0.3} />
                          ))}
                        </Bar>
                      )}

                      <Bar dataKey="juros" name="Juros" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} isAnimationActive={false} activeBar={false}>
                        {ebitdaData.map((_, i) => (
                          <Cell key={i} fill="#64748b" opacity={activeBarIndex === null || activeBarIndex === i ? 1 : 0.3} />
                        ))}
                        <LabelList dataKey="juros"  position="center" fill="white" formatter={(v: number) => v > 0 ? `${v}%` : ''} fontSize={12} fontWeight={500} />
                        <LabelList dataKey="total" position="top"    fill="#1e293b" formatter={(v: number) => `${v.toFixed(2)}%`} fontSize={12} fontWeight={600} dy={-10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            ) : (
              <IndicadorPlaceholder title="Comprometimento do EBITDA" />
            )
          )}

          {(vis.endividamento_receita || vis.endividamento_ebitda) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              {vis.endividamento_receita && (
                endividamentoReceita != null ? (
                  <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300 min-h-[350px]">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Endividamento / Receita</h3>
                      <p className="text-xs text-slate-500 italic mt-1">*Para o calculo não se considera o Vlr Principal de Custeio</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center mt-4 overflow-hidden">
                      <GaugeChart
                        value={endividamentoReceita} max={5} label=""
                        colorRanges={[
                          { min: 0, max: 1.5, color: '#22c55e' },
                          { min: 1.5, max: 3, color: '#eab308' },
                          { min: 3, max: 5, color: '#ef4444' },
                        ]}
                      />
                    </div>
                  </GlassCard>
                ) : (
                  <IndicadorPlaceholder title="Endividamento / Receita" subtitle="Requer dados de receita (DRE) para calcular este indicador." />
                )
              )}

              {vis.endividamento_ebitda && (
                endividamentoEbitda != null ? (
                  <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300 min-h-[350px]">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Endividamento / EBITDA</h3>
                      <p className="text-xs text-slate-500 italic mt-1">*Para o calculo não se considera o Vlr Principal de Custeio</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center mt-4 overflow-hidden">
                      <GaugeChart
                        value={endividamentoEbitda} max={10} label=""
                        colorRanges={[
                          { min: 0, max: 5,  color: '#22c55e' },
                          { min: 5, max: 7,  color: '#eab308' },
                          { min: 7, max: 10, color: '#ef4444' },
                        ]}
                      />
                    </div>
                  </GlassCard>
                ) : (
                  <IndicadorPlaceholder title="Endividamento / EBITDA" subtitle="Requer dados de EBITDA (DRE) para calcular este indicador." />
                )
              )}
            </div>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {vis.renegociacao && (
            <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Renegociação</h3>
                <p className="text-xs text-slate-500 italic mt-1">Total</p>
              </div>
              <div className="flex flex-col justify-center py-2">
                <div className="text-4xl font-bold text-slate-800 mb-2">{formatCurrency(0, currencyMode)}</div>
                <p className="text-sm text-slate-500">
                  Representa <span className="font-semibold text-slate-700">0,00%</span> do endividamento total
                </p>
              </div>
            </GlassCard>
          )}

          {vis.custeio_custo && (
            custeioRatio != null ? (
              <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-800">Custeio / Custo Desembolsado</h3>
                </div>
                <div className="relative pt-6 pb-2 flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-[40%] -top-6 bottom-0 border-l-2 border-dashed border-slate-400 z-10 flex flex-col items-center">
                      <span className="absolute -top-5 whitespace-nowrap text-xs font-medium text-slate-500 bg-white px-1">Máx: 40%</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative flex w-full">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', custeioRatio > 40 ? 'bg-red-500' : 'bg-emerald-500')}
                        style={{ width: `${Math.min(custeioRatio, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className={cn('text-xl font-bold', custeioRatio > 40 ? 'text-red-500' : 'text-emerald-500')}>
                    {custeioRatio.toFixed(0)}%
                  </div>
                </div>
              </GlassCard>
            ) : (
              <IndicadorPlaceholder title="Custeio / Custo Desembolsado" subtitle="Requer dados de custo desembolsado para calcular este indicador." />
            )
          )}

          {vis.custo_financeiro && (
            hasCustoFinanceiroData ? (
              <GlassCard className="p-6 flex-1 flex flex-col hover:shadow-md transition-all duration-300 min-h-[300px]">
                <div className="mb-6 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-slate-800">Custo Financeiro vs:</h3>
                  <Select value={custoFinanceiroVs} onValueChange={v => setCustoFinanceiroVs(v as 'Desembolso Operacional' | 'EBITDA')}>
                    <SelectTrigger className="h-10 w-full sm:w-60 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Desembolso Operacional">Desembolso Operacional</SelectItem>
                      <SelectItem value="EBITDA">EBITDA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentCustoFinanceiroData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, angle: -45, textAnchor: 'end' }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.4 }} formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                        <LabelList dataKey="value" position="top" fill="#475569" formatter={(v: number) => `${v}%`} fontSize={10} fontWeight={500} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            ) : (
              <IndicadorPlaceholder title="Custo Financeiro" />
            )
          )}

        </div>
      </div>
    </div>
  );
}
