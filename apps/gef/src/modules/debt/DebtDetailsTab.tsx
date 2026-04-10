import React, { useMemo } from 'react';
import { GlassCard } from '@socios/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { ParcelaRow } from '@/contexts/ImportDataContext';
import { gefTooltipClass, gefTooltipTitleClass } from '@/lib/chartTheme';

interface Props {
  currencyMode: 'BRL' | 'SOJA';
  filteredParcelas: ParcelaRow[];
}

// Paleta fixa por tipo de financiamento
const TIPO_COLOR_MAP: Record<string, string> = {
  'Custeio':          '#10b981',
  'Investimento':     '#3b82f6',
  'Compra de Terras': '#f59e0b',
};
const FALLBACK_COLORS = ['#475569', '#ef4444', '#8b5cf6', '#06b6d4'];

// Paleta para bancos (sequencial)
const BANCO_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#475569',
];

const fmtCompact = (v: number, mode: 'BRL' | 'SOJA') => {
  if (mode === 'SOJA') return `${(v / 120 / 1000).toFixed(1)}k sc`;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
};

const fmtFull = (v: number, mode: 'BRL' | 'SOJA') =>
  mode === 'BRL'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
    : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v / 120)} sc`;

export function DebtDetailsTab({ currencyMode, filteredParcelas }: Props) {
  const tipoData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredParcelas.forEach(p => { grouped[p.tipo] = (grouped[p.tipo] || 0) + p.total; });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    let fallbackIdx = 0;
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).map(([name, value]) => ({
      name, value,
      percent: (value / total) * 100,
      color: TIPO_COLOR_MAP[name] ?? FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length],
    }));
  }, [filteredParcelas]);

  const bancoData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredParcelas.forEach(p => { grouped[p.banco] = (grouped[p.banco] || 0) + p.total; });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).map(([name, value], i) => ({
      name, value,
      percent: (value / total) * 100,
      color: BANCO_COLORS[i % BANCO_COLORS.length],
    }));
  }, [filteredParcelas]);

  const descricaoData = useMemo(() => {
    // Agrega por descrição, trazendo também banco e tipo da primeira ocorrência
    const grouped: Record<string, { value: number; banco: string; tipo: string }> = {};
    filteredParcelas.forEach(p => {
      if (!grouped[p.descricao]) grouped[p.descricao] = { value: 0, banco: p.banco, tipo: p.tipo };
      grouped[p.descricao].value += p.total;
    });
    const total = Object.values(grouped).reduce((s, v) => s + v.value, 0) || 1;
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 15)
      .map(([name, { value, banco, tipo }]) => ({
        name, value, banco, tipo,
        percent: (value / total) * 100,
        color: TIPO_COLOR_MAP[tipo] ?? '#475569',
      }));
  }, [filteredParcelas]);

  const totais = useMemo(() => {
    const principal = filteredParcelas.reduce((s, p) => s + p.principal, 0);
    const juros     = filteredParcelas.reduce((s, p) => s + p.juros, 0);
    const total     = filteredParcelas.reduce((s, p) => s + p.total, 0);
    const pesoTotal = total || 1;
    const taxa      = filteredParcelas.reduce((s, p) => s + p.taxa * p.total, 0) / pesoTotal;
    return { principal, juros, total, taxa };
  }, [filteredParcelas]);

  const maxBanco = bancoData[0]?.value || 1;
  const maxDesc  = descricaoData[0]?.value || 1;

  const TipoTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className={gefTooltipClass}>
        <p className={gefTooltipTitleClass}>{d.name}</p>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Endividamento</span>
          <span className="font-semibold">{fmtFull(d.value, currencyMode)}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs mt-1">
          <span className="text-muted-foreground">% do Total</span>
          <span className="font-semibold">{d.percent.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: Donut Tipo + Card-list Banco ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Donut — por Tipo */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col hover:shadow-float transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">por Tipo de Financiamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Composição do endividamento total</p>
          </div>

          {tipoData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sem dados para o filtro selecionado.</p>
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tipoData}
                      cx="50%" cy="50%"
                      innerRadius={56} outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {tipoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<TipoTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {tipoData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-foreground truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {fmtCompact(d.value, currencyMode)}
                      </span>
                      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                        {d.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        {/* Card-list — por Banco */}
        <GlassCard className="lg:col-span-3 p-6 flex flex-col hover:shadow-float transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">por Banco</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Concentração de dívida por credor</p>
          </div>

          {bancoData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sem dados para o filtro selecionado.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] custom-scrollbar pr-1">
              {bancoData.map((b, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="text-sm font-medium text-foreground truncate" title={b.name}>{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {fmtCompact(b.value, currencyMode)}
                      </span>
                      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                        {b.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(b.value / maxBanco) * 100}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

      </div>

      {/* ── Linha 2: Tabela por Descrição ─────────────────────────────────── */}
      <GlassCard className="p-6 flex flex-col hover:shadow-float transition-all duration-300">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">por Descrição</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Top 15 maiores contratos · ordenado por valor total</p>
        </div>

        {descricaoData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem dados para o filtro selecionado.</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
            {descricaoData.map((d, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
                {/* Rank */}
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-right">{i + 1}</span>

                {/* Barra de progresso + nome */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-foreground truncate" title={d.name}>{d.name}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(d.value / maxDesc) * 100}%`, backgroundColor: d.color, opacity: 0.7 }}
                    />
                  </div>
                </div>

                {/* Banco + Tipo */}
                <div className="hidden md:flex items-center gap-2 shrink-0 w-56">
                  <span className="text-xs text-muted-foreground truncate flex-1" title={d.banco}>{d.banco}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: `${d.color}22`, color: d.color }}
                  >
                    {d.tipo}
                  </span>
                </div>

                {/* Valor + % */}
                <div className="flex flex-col items-end shrink-0 w-28">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {fmtCompact(d.value, currencyMode)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{d.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Linha 3: Tabela de Parcelas ───────────────────────────────────── */}
      <GlassCard className="p-6 flex flex-col hover:shadow-float transition-all duration-300">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">por Parcelas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredParcelas.length} parcelas encontradas</p>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar rounded-xl border border-border/50">
          <table className="w-full text-sm text-left relative min-w-[800px]">
            <thead className="text-xs text-muted-foreground uppercase bg-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap font-semibold tracking-wide">Mês-Ano</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold tracking-wide">Banco</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold tracking-wide">Contrato</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold tracking-wide">Tipo</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold tracking-wide">Descrição</th>
                <th className="px-4 py-3 text-right whitespace-nowrap font-semibold tracking-wide">Principal</th>
                <th className="px-4 py-3 text-right whitespace-nowrap font-semibold tracking-wide">Juros</th>
                <th className="px-4 py-3 text-right whitespace-nowrap font-semibold tracking-wide">Total</th>
                <th className="px-4 py-3 text-right whitespace-nowrap font-semibold tracking-wide">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredParcelas.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.mesAno}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{row.banco}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{row.contrato}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${TIPO_COLOR_MAP[row.tipo] ?? '#475569'}22`,
                        color: TIPO_COLOR_MAP[row.tipo] ?? '#475569',
                      }}
                    >
                      {row.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground min-w-[220px] text-xs">{row.descricao}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap tabular-nums">{formatCurrency(row.principal, currencyMode)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap tabular-nums">{formatCurrency(row.juros, currencyMode)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap tabular-nums">{formatCurrency(row.total, currencyMode)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap tabular-nums">{row.taxa.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-white font-bold text-foreground sticky bottom-0 z-10 shadow-[0_-2px_0_0_#cbd5e1]">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm">Total · {filteredParcelas.length} parcelas</td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCurrency(totais.principal, currencyMode)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCurrency(totais.juros, currencyMode)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCurrency(totais.total, currencyMode)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{totais.taxa.toFixed(2)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
