import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label,
  ComposedChart, Line,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingDown } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import type { SafraImportData } from '@/contexts/ImportDataContext';

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    : `R$ ${(v / 1_000).toFixed(0)}k`;

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

// ── Paleta ────────────────────────────────────────────────────────────────────

const CUSTO_COLORS = ['#f87171', '#fb923c', '#94a3b8', '#c084fc', '#38bdf8'];

// ── KpiCard ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, badge, invertTrend, delay = 0 }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string };
  badge?: { text: string; color: string };
  invertTrend?: boolean; // custo subir é ruim
  delay?: number;
}) {
  const raw = trend?.value ?? 0;
  const isPositive = invertTrend ? raw < 0 : raw > 0;
  const isNegative = invertTrend ? raw > 0 : raw < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-float transition-all duration-300 h-full">
        <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[24px] font-black text-slate-800 leading-tight">{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold mt-auto',
            isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400')}>
            {raw > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : raw < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {raw > 0 ? '+' : ''}{raw.toFixed(1)}% {trend.label}
          </div>
        )}
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold mt-auto self-start"
            style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
            {badge.text}
          </span>
        )}
      </GlassCard>
    </motion.div>
  );
}

// ── DonutLegend ───────────────────────────────────────────────────────────────

function DonutLegend({ items }: { items: { name: string; value: number; color: string; total: number }[] }) {
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {items.map(item => (
        <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600 font-medium truncate">{item.name}</span>
          </div>
          <span className="text-slate-500 font-semibold shrink-0">
            {((item.value / item.total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── BulletBar (custo — menos é melhor) ────────────────────────────────────────

function BulletBar({ label, realizado, orcado, delay = 0 }: {
  label: string; realizado: number; orcado: number; delay?: number;
}) {
  const rawPct = orcado > 0 ? (realizado / orcado) * 100 : 0;
  const pct = Math.min(rawPct, 130);
  const barColor = rawPct <= 80 ? '#10b981' : rawPct <= 100 ? '#f59e0b' : '#ef4444';
  const statusText = rawPct <= 80 ? 'Abaixo do orçado' : rawPct <= 95 ? 'Próximo ao orçado' : rawPct <= 100 ? 'No limite' : 'Orçamento estourado';

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }} className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{fmtCompact(realizado)} / {fmtCompact(orcado)}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: `${barColor}20`, color: barColor }}>
            {rawPct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-4 rounded-full bg-slate-100 overflow-hidden">
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 z-10"
          style={{ left: `${Math.min(100 / (pct > 100 ? pct / 100 : 1), 100)}%` }} />
        <motion.div className="absolute top-0 left-0 h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }} />
      </div>
      <span className="text-[10px] text-slate-400">{statusText}</span>
    </motion.div>
  );
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

function MetricRow({ icon, label, value, highlight, delay = 0 }: {
  icon: string; label: string; value: string; highlight?: boolean; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn('flex items-center justify-between p-3 rounded-xl',
        highlight ? 'bg-red-50 border border-red-200' : 'bg-slate-50/60')}>
      <div className={cn('flex items-center gap-2 text-xs font-medium',
        highlight ? 'text-red-700 font-bold' : 'text-slate-600')}>
        <span>{icon}</span>{label}
      </div>
      <span className={cn('text-xs font-bold', highlight ? 'text-sm text-red-800 font-black' : 'text-slate-800')}>{value}</span>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function DRECustoTab({ safraAtual, dreDataRecord, safras, selectedCultura = 'Todas' }: {
  safraAtual: string;
  dreDataRecord: Record<string, SafraImportData>;
  safras: string[];
  selectedCultura?: string;
}) {
  const rawData = dreDataRecord[safraAtual];
  const data = selectedCultura === 'Todas' ? rawData : {
    ...rawData,
    culturas: rawData.culturas.filter(c => c.nome === selectedCultura),
  };

  const prev = useMemo(() => {
    const idx = safras.indexOf(safraAtual);
    return idx > 0 ? dreDataRecord[safras[idx - 1]] : null;
  }, [safraAtual, safras, dreDataRecord]);

  // ── Métricas derivadas ──────────────────────────────────────────────────
  const custoHa   = data.areaTotal > 0 ? data.custoTotal / data.areaTotal : 0;
  const prevCustoHa = prev && prev.areaTotal > 0 ? prev.custoTotal / prev.areaTotal : null;

  // ── Trends ──────────────────────────────────────────────────────────────
  const trendCusto    = prev ? ((data.custoTotal - prev.custoTotal) / prev.custoTotal) * 100 : null;
  const trendCustoHa  = prevCustoHa ? ((custoHa - prevCustoHa) / prevCustoHa) * 100 : null;
  const trendMargem   = prev ? (data.margemBruta - prev.margemBruta) : null;

  // ── Orçado vs Realizado ─────────────────────────────────────────────────
  const orcadoPct = data.orcadoCusto > 0 ? (data.custoTotal / data.orcadoCusto) * 100 : 0;
  const orcadoDiff = data.custoTotal - data.orcadoCusto;
  // Custo abaixo do orçado = bom (verde), acima = ruim (vermelho)
  const orcadoBadgeColor = orcadoDiff <= 0 ? '#10b981' : '#ef4444';

  // ── Barras — Custo por cultura ordenado decrescente ─────────────────────
  const culturaSorted = useMemo(() =>
    [...data.culturas]
      .sort((a, b) => b.custoTotal - a.custoTotal)
      .map((c, i) => ({
        nome: c.nome,
        custo: c.custoTotal,
        area: c.area,
        custoHa: c.area > 0 ? c.custoTotal / c.area : 0,
        margemLiquida: c.margemLiquida,
        variacaoMargem: c.variacaoMargem,
        fill: CUSTO_COLORS[i % CUSTO_COLORS.length],
      })),
    [data]);

  // ── Donut — composição do custo por cultura ─────────────────────────────
  const donutData = useMemo(() =>
    data.culturas.map((c, i) => ({
      name: c.nome,
      value: c.custoTotal,
      color: CUSTO_COLORS[i % CUSTO_COLORS.length],
    })),
    [data]);

  // ── Evolução histórica — Custo total + custo/ha ─────────────────────────
  const historicoData = useMemo(() =>
    safras.map(s => {
      const d = dreDataRecord[s];
      return {
        safra: s,
        custo: d?.custoTotal ?? 0,
        custoHa: d && d.areaTotal > 0 ? Math.round(d.custoTotal / d.areaTotal) : 0,
      };
    }),
    [safras, dreDataRecord]);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: 4 KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Custo Total" value={fmtBRL(data.custoTotal)}
          sub={fmtCompact(data.custoTotal)}
          trend={trendCusto != null ? { value: trendCusto, label: 'vs safra ant.' } : undefined}
          invertTrend delay={0} />
        <KpiCard label="Custo por Hectare" value={`R$ ${fmtNum(Math.round(custoHa))}/ha`}
          trend={trendCustoHa != null ? { value: trendCustoHa, label: 'vs safra ant.' } : undefined}
          invertTrend delay={0.05} />
        <KpiCard label="Orçado vs Real" value={`${orcadoPct.toFixed(1)}%`}
          sub={`Orçado: ${fmtCompact(data.orcadoCusto)}`}
          badge={{
            text: orcadoDiff <= 0 ? `${fmtCompact(Math.abs(orcadoDiff))} economizado` : `+${fmtCompact(orcadoDiff)} estourado`,
            color: orcadoBadgeColor,
          }}
          delay={0.1} />
        <KpiCard label="Margem Bruta" value={`${data.margemBruta.toFixed(1)}%`}
          sub={`Lucro bruto: ${fmtCompact(data.lucroBruto)}`}
          trend={trendMargem != null ? { value: trendMargem, label: 'pp vs ant.' } : undefined}
          delay={0.15} />
      </div>

      {/* ── Linha 2: Custo por Cultura (60%) + Donut (40%) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Barras horizontais */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Custo por Cultura</h3>
            <p className="text-xs text-slate-400 mb-4">Custo total desembolsado por atividade</p>
            <div style={{ height: Math.max(culturaSorted.length * 56, 180) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={culturaSorted} layout="vertical"
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#CBD5E1" opacity={0.3} />
                  <XAxis type="number" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false}
                    width={90} tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip
                    formatter={(v: number) => [fmtBRL(v), 'Custo']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar dataKey="custo" radius={[0, 6, 6, 0]} maxBarSize={32}>
                    {culturaSorted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Donut */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Composição do Custo</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius="55%" outerRadius="82%"
                      startAngle={90} endAngle={-270} paddingAngle={2} strokeWidth={0}>
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      <Label content={({ viewBox }: any) => {
                        const { cx, cy } = viewBox;
                        return (
                          <text textAnchor="middle" dominantBaseline="middle">
                            <tspan x={cx} y={cy - 8} fontSize="14" fontWeight="800" fill="#1e293b">
                              {fmtCompact(data.custoTotal)}
                            </tspan>
                            <tspan x={cx} y={cy + 10} fontSize="10" fill="#64748b">custo total</tspan>
                          </text>
                        );
                      }} />
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [fmtBRL(v), name]}
                      contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DonutLegend items={donutData.map(d => ({ ...d, total: data.custoTotal }))} />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Linha 3: Evolução (60%) + Orçado & Métricas (40%) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Evolução */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Evolução do Custo</h3>
            <p className="text-xs text-slate-400 mb-4">Custo total por safra + custo por hectare</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis yAxisId="custo" axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis yAxisId="ha" orientation="right" axisLine={false} tickLine={false} width={62}
                    tick={{ fill: '#f87171', fontSize: 10 }}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === 'Custo Total' ? [fmtBRL(v), name] : [`R$ ${fmtNum(v)}/ha`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Bar yAxisId="custo" dataKey="custo" name="Custo Total" fill="#f87171"
                    radius={[6, 6, 0, 0]} maxBarSize={64} />
                  <Line yAxisId="ha" dataKey="custoHa" name="Custo/ha"
                    type="monotone" stroke="#ef4444" strokeWidth={2.5}
                    dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-slate-500 font-medium">Custo Total</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-6 h-0.5 rounded bg-red-500" />
                <span className="text-slate-500 font-medium">Custo/ha (R$)</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Orçado + Breakdown */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Custo — Orçado vs. Realizado</h3>
            <p className="text-xs text-slate-400 mb-4">Meta de custo planejada</p>
            <BulletBar label="Custo Total" realizado={data.custoTotal} orcado={data.orcadoCusto} delay={0.25} />

            <div className="border-t border-slate-100 my-5" />

            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Estrutura de resultado</h4>
            <div className="flex flex-col gap-2">
              <MetricRow icon="💰" label="VBP (Receita Bruta)" value={fmtCompact(data.receitaBruta)} delay={0.3} />
              <MetricRow icon="−" label="Custo Total Desembolsado" value={fmtCompact(data.custoTotal)} delay={0.33} highlight />
              <MetricRow icon="=" label={`Lucro Bruto (${data.margemBruta.toFixed(1)}%)`} value={fmtCompact(data.lucroBruto)} delay={0.36} />
              <MetricRow icon="−" label="Despesas Operacionais" value={fmtCompact(data.despesasOperacionais)} delay={0.39} />
              <MetricRow icon="=" label="EBITDA" value={fmtCompact(data.ebitda)} delay={0.42} />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Linha 4: Tabela detalhada por cultura ───────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Detalhamento por Cultura</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Cultura', 'Área (ha)', 'Custo Total', 'Custo/ha', 'Margem Líq. (%)', 'Var. Margem', '% do Custo'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {culturaSorted.map((c, i) => {
                  const pctTotal = (c.custo / data.custoTotal) * 100;
                  return (
                    <tr key={c.nome} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                          {c.nome}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{fmtNum(c.area)}</td>
                      <td className="px-3 py-3 font-semibold text-red-600">{fmtCompact(c.custo)}</td>
                      <td className="px-3 py-3 text-slate-600">R$ {fmtNum(Math.round(c.custoHa))}</td>
                      <td className="px-3 py-3">
                        <span className={cn('font-bold px-2 py-0.5 rounded-full text-xs',
                          c.margemLiquida >= 20 ? 'bg-emerald-100 text-emerald-700' :
                          c.margemLiquida >= 10 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {c.margemLiquida.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('text-xs font-semibold',
                          c.variacaoMargem > 0 ? 'text-emerald-600' : c.variacaoMargem < 0 ? 'text-red-500' : 'text-slate-400')}>
                          {c.variacaoMargem > 0 ? '+' : ''}{c.variacaoMargem.toFixed(1)} pp
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('font-bold px-2 py-0.5 rounded-full text-xs',
                          pctTotal >= 40 ? 'bg-red-100 text-red-700' :
                          pctTotal >= 20 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600',
                        )}>
                          {pctTotal.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/60">
                  <td className="px-3 py-3 font-black text-slate-800">Total</td>
                  <td className="px-3 py-3 font-bold text-slate-700">{fmtNum(data.areaTotal)}</td>
                  <td className="px-3 py-3 font-black text-red-700">{fmtBRL(data.custoTotal)}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">R$ {fmtNum(Math.round(custoHa))}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">{data.margemLiquida.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-slate-400">—</td>
                  <td className="px-3 py-3 font-black text-slate-700">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}
