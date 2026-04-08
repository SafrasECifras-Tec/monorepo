import React, { useMemo } from 'react';
import { GlassCard } from '@socios/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { ParcelaRow } from '@/contexts/ImportDataContext';

interface Props {
  currencyMode: 'BRL' | 'SOJA';
  filteredParcelas: ParcelaRow[];
}

const TIPO_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

const formatValue = (value: number, currencyMode: 'BRL' | 'SOJA') => {
  if (currencyMode === 'SOJA') return `${(value / 1000).toFixed(1)} K sc`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mi`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} K`;
  return value.toString();
};

const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;

const CustomTooltip = ({ active, payload, label, currencyMode }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl">
      <p className="font-medium text-slate-100 mb-1">{label}</p>
      <p className="text-sm text-slate-300">
        Endividamento: <span className="font-semibold text-white">{formatValue(payload[0].value, currencyMode)}</span>
      </p>
      <p className="text-sm text-slate-300">
        % do Total: <span className="font-semibold text-white">{formatPercent(payload[0].payload.percent)}</span>
      </p>
    </div>
  );
};

const truncatedYAxis = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{payload.value}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#64748B" fontSize={12}>
        {payload.value.length > 20 ? `${payload.value.substring(0, 20)}...` : payload.value}
      </text>
    </g>
  );
};

export function DebtDetailsTab({ currencyMode, filteredParcelas }: Props) {
  const tipoFinanciamentoData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredParcelas.forEach(p => { grouped[p.tipo] = (grouped[p.tipo] || 0) + p.total; });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).map(([name, value], i) => ({
      name, value, percent: (value / total) * 100, color: TIPO_COLORS[i % TIPO_COLORS.length],
    }));
  }, [filteredParcelas]);

  const descricaoData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredParcelas.forEach(p => { grouped[p.descricao] = (grouped[p.descricao] || 0) + p.total; });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).slice(0, 15).map(([name, value]) => ({
      name, value, percent: (value / total) * 100,
    }));
  }, [filteredParcelas]);

  const bancoData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredParcelas.forEach(p => { grouped[p.banco] = (grouped[p.banco] || 0) + p.total; });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).map(([name, value]) => ({
      name, value, percent: (value / total) * 100,
    }));
  }, [filteredParcelas]);

  const totaisParcelas = useMemo(() => {
    const principal = filteredParcelas.reduce((s, p) => s + p.principal, 0);
    const juros     = filteredParcelas.reduce((s, p) => s + p.juros, 0);
    const total     = filteredParcelas.reduce((s, p) => s + p.total, 0);
    const pesoTotal = total || 1;
    const taxa      = filteredParcelas.reduce((s, p) => s + p.taxa * p.total, 0) / pesoTotal;
    return { principal, juros, total, taxa };
  }, [filteredParcelas]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Por Tipo de Financiamento */}
        <GlassCard className="p-6 flex flex-col h-[450px] hover:shadow-md transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">por Tipo de Financiamento</h3>
            <p className="text-xs text-slate-500 italic">(Endividamento | % do Total)</p>
          </div>
          <div className="flex-1 w-full relative min-h-[300px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoFinanciamentoData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip currencyMode={currencyMode} />} cursor={{ fill: '#F1F5F9', opacity: 0.4 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {tipoFinanciamentoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        return (
                          <text x={x + width / 2} y={y - 10} fill="#475569" fontSize={12} textAnchor="middle" fontWeight={500}>
                            {`${formatValue(value, currencyMode)} | ${formatPercent(tipoFinanciamentoData[index].percent)}`}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Por Descrição */}
        <GlassCard className="p-6 flex flex-col h-[450px] hover:shadow-md transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">por Descrição</h3>
            <p className="text-xs text-slate-500 italic">(Endividamento | % do Total)</p>
          </div>
          <div className="flex-1 w-full relative min-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={descricaoData} layout="vertical" margin={{ top: 0, right: 100, left: 0, bottom: 0 }} barSize={20}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={truncatedYAxis} width={160} />
                  <Tooltip content={<CustomTooltip currencyMode={currencyMode} />} cursor={{ fill: '#F1F5F9', opacity: 0.4 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      content={(props: any) => {
                        const { x, y, width, height, value, index } = props;
                        return (
                          <text x={x + width + 8} y={y + height / 2 + 4} fill="#475569" fontSize={12} fontWeight={500}>
                            {`${formatValue(value, currencyMode)} | ${formatPercent(descricaoData[index].percent)}`}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Por Banco */}
        <GlassCard className="p-6 flex flex-col h-[450px] hover:shadow-md transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">por Banco</h3>
            <p className="text-xs text-slate-500 italic">(Endividamento | % do Total)</p>
          </div>
          <div className="flex-1 w-full relative min-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bancoData} layout="vertical" margin={{ top: 0, right: 100, left: 0, bottom: 0 }} barSize={24}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={truncatedYAxis} width={160} />
                  <Tooltip content={<CustomTooltip currencyMode={currencyMode} />} cursor={{ fill: '#F1F5F9', opacity: 0.4 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      content={(props: any) => {
                        const { x, y, width, height, value, index } = props;
                        return (
                          <text x={x + width + 8} y={y + height / 2 + 4} fill="#475569" fontSize={12} fontWeight={500}>
                            {`${formatValue(value, currencyMode)} | ${formatPercent(bancoData[index].percent)}`}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Parcelas Table */}
      <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800">por Parcelas</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar rounded-lg border border-slate-200/60">
          <table className="w-full text-sm text-left relative min-w-[800px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Mês-Ano</th>
                <th className="px-4 py-3 whitespace-nowrap">Banco</th>
                <th className="px-4 py-3 whitespace-nowrap">Contrato</th>
                <th className="px-4 py-3 whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3 whitespace-nowrap">Descrição</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Valor Principal</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Juros</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Taxa Efetiva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcelas.map((row, i) => (
                <tr key={i} className="hover:bg-white/60 transition-colors bg-white/20">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.mesAno}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.banco}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.contrato}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.tipo}</td>
                  <td className="px-4 py-3 text-slate-600 min-w-[200px]">{row.descricao}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{formatCurrency(row.principal, currencyMode)}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{formatCurrency(row.juros, currencyMode)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">{formatCurrency(row.total, currencyMode)}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{row.taxa.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-200 font-bold text-slate-800 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <tr>
                <td colSpan={5} className="px-4 py-4">Total</td>
                <td className="px-4 py-4 text-right whitespace-nowrap">{formatCurrency(totaisParcelas.principal, currencyMode)}</td>
                <td className="px-4 py-4 text-right whitespace-nowrap">{formatCurrency(totaisParcelas.juros, currencyMode)}</td>
                <td className="px-4 py-4 text-right whitespace-nowrap">{formatCurrency(totaisParcelas.total, currencyMode)}</td>
                <td className="px-4 py-4 text-right whitespace-nowrap">{totaisParcelas.taxa.toFixed(2)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
