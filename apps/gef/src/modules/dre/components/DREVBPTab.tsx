import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label,
  LineChart, Line, ComposedChart,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, Target } from 'lucide-react';
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

const CULTURA_COLORS = ['#6366f1', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f43f5e'];

// ── KpiCard ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, badge, delay = 0 }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string };
  badge?: { text: string; color: string };
  delay?: number;
}) {
  const up = trend && trend.value > 0;
  const down = trend && trend.value < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-md transition-all duration-300 h-full">
        <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[24px] font-black text-slate-800 leading-tight">{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold mt-auto',
            up ? 'text-emerald-600' : down ? 'text-red-500' : 'text-slate-400')}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : down ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
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

// ── BulletBar ─────────────────────────────────────────────────────────────────

function BulletBar({ label, realizado, orcado, delay = 0 }: {
  label: string; realizado: number; orcado: number; delay?: number;
}) {
  const rawPct = orcado > 0 ? (realizado / orcado) * 100 : 0;
  const pct = Math.min(rawPct, 130);
  const barColor = rawPct >= 100 ? '#10b981' : rawPct >= 90 ? '#f59e0b' : '#ef4444';
  const statusText = rawPct >= 100 ? 'Meta batida ✓' : rawPct >= 90 ? 'Próximo da meta' : 'Abaixo da meta';

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

function MetricRow({ icon, label, value, delay = 0 }: {
  icon: string; label: string; value: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60">
      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <span>{icon}</span>{label}
      </div>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function DREVBPTab({ safraAtual, dreDataRecord, safras, selectedCultura = 'Todas' }: {
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

  // ── Trends ──────────────────────────────────────────────────────────────
  const trendVBP   = prev ? ((data.receitaBruta - prev.receitaBruta) / prev.receitaBruta) * 100 : null;
  const trendProd  = prev ? ((data.producaoTotal - prev.producaoTotal) / prev.producaoTotal) * 100 : null;
  const trendPreco = prev ? ((data.precoMedioVenda - prev.precoMedioVenda) / prev.precoMedioVenda) * 100 : null;

  // ── Orçado vs Realizado ─────────────────────────────────────────────────
  const orcadoPct = data.orcadoVbp > 0 ? (data.receitaBruta / data.orcadoVbp) * 100 : 0;
  const orcadoDiff = data.receitaBruta - data.orcadoVbp;
  const orcadoBadgeColor = orcadoPct >= 100 ? '#10b981' : orcadoPct >= 90 ? '#f59e0b' : '#ef4444';

  // ── Barras horizontais — VBP por cultura (ordenadas decrescente) ────────
  const culturaSorted = useMemo(() =>
    [...data.culturas]
      .sort((a, b) => b.receitaBruta - a.receitaBruta)
      .map((c, i) => ({
        nome: c.nome,
        vbp: c.receitaBruta,
        area: c.area,
        producao: c.producao,
        precoMedio: c.precoMedio,
        fill: CULTURA_COLORS[i % CULTURA_COLORS.length],
      })),
    [data]);

  // ── Donut — composição do VBP por cultura ───────────────────────────────
  const donutData = useMemo(() =>
    data.culturas.map((c, i) => ({
      name: c.nome,
      value: c.receitaBruta,
      color: CULTURA_COLORS[i % CULTURA_COLORS.length],
    })),
    [data]);

  // ── Evolução histórica — VBP total + preço médio ────────────────────────
  const historicoData = useMemo(() =>
    safras.map(s => ({
      safra: s,
      vbp: dreDataRecord[s]?.receitaBruta ?? 0,
      precoMedio: dreDataRecord[s]?.precoMedioVenda ?? 0,
    })),
    [safras, dreDataRecord]);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: 4 KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="VBP Total" value={fmtBRL(data.receitaBruta)}
          sub={fmtCompact(data.receitaBruta)}
          trend={trendVBP != null ? { value: trendVBP, label: 'vs safra ant.' } : undefined}
          delay={0} />
        <KpiCard label="Produção Total" value={`${fmtNum(data.producaoTotal)} sc`}
          sub={`${fmtNum(data.producaoTotal * 60)} kg`}
          trend={trendProd != null ? { value: trendProd, label: 'vs safra ant.' } : undefined}
          delay={0.05} />
        <KpiCard label="Preço Médio" value={`R$ ${data.precoMedioVenda}/sc`}
          trend={trendPreco != null ? { value: trendPreco, label: 'vs safra ant.' } : undefined}
          delay={0.1} />
        <KpiCard label="Orçado vs Real" value={`${orcadoPct.toFixed(1)}%`}
          sub={`Orçado: ${fmtCompact(data.orcadoVbp)}`}
          badge={{ text: orcadoDiff >= 0 ? `+${fmtCompact(orcadoDiff)}` : fmtCompact(orcadoDiff), color: orcadoBadgeColor }}
          delay={0.15} />
      </div>

      {/* ── Linha 2: VBP por Cultura (60%) + Donut (40%) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Barras horizontais */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5 h-full hover:shadow-md transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">VBP por Cultura</h3>
            <p className="text-xs text-slate-400 mb-4">Valor Bruto de Produção por atividade</p>
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
                    formatter={(v: number) => [fmtBRL(v), 'VBP']}
                    labelFormatter={(label: string) => label}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar dataKey="vbp" radius={[0, 6, 6, 0]} maxBarSize={32}>
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
          <GlassCard className="p-5 h-full hover:shadow-md transition-all duration-300">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Composição do VBP</h3>
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
                              {fmtCompact(data.receitaBruta)}
                            </tspan>
                            <tspan x={cx} y={cy + 10} fontSize="10" fill="#64748b">VBP total</tspan>
                          </text>
                        );
                      }} />
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [fmtBRL(v), name]}
                      contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DonutLegend items={donutData.map(d => ({ ...d, total: data.receitaBruta }))} />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Linha 3: Evolução Histórica (60%) + Orçado & Métricas (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Evolução */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-md transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Evolução do VBP</h3>
            <p className="text-xs text-slate-400 mb-4">VBP total por safra + preço médio de venda</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis yAxisId="vbp" axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis yAxisId="preco" orientation="right" axisLine={false} tickLine={false} width={52}
                    tick={{ fill: '#f59e0b', fontSize: 10 }}
                    tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === 'VBP' ? [fmtBRL(v), name] : [`R$ ${v}/sc`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Bar yAxisId="vbp" dataKey="vbp" name="VBP" fill="#10b981"
                    radius={[4, 4, 0, 0]} maxBarSize={64} />
                  <Line yAxisId="preco" dataKey="precoMedio" name="Preço Médio"
                    type="monotone" stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 font-medium">VBP Total</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-6 h-0.5 rounded bg-amber-400" />
                <span className="text-slate-500 font-medium">Preço Médio (R$/sc)</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Orçado + Métricas derivadas */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="p-5 h-full hover:shadow-md transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">VBP — Orçado vs. Realizado</h3>
            <p className="text-xs text-slate-400 mb-4">Meta de receita bruta planejada</p>
            <BulletBar label="VBP Total" realizado={data.receitaBruta} orcado={data.orcadoVbp} delay={0.25} />

            <div className="border-t border-slate-100 my-5" />

            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Como o VBP se forma</h4>
            <div className="flex flex-col gap-2">
              <MetricRow icon="📐" label="Área Plantada" value={`${fmtNum(data.areaTotal)} ha`} delay={0.3} />
              <MetricRow icon="×" label="Produtividade Média" value={`${data.produtividadeMedia.toFixed(1)} sc/ha`} delay={0.33} />
              <MetricRow icon="=" label="Produção Total" value={`${fmtNum(data.producaoTotal)} sc`} delay={0.36} />
              <MetricRow icon="×" label="Preço Médio de Venda" value={`R$ ${data.precoMedioVenda}/sc`} delay={0.39} />
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.42 }}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                  <Target className="h-3.5 w-3.5" />VBP Total
                </div>
                <span className="text-sm font-black text-emerald-800">{fmtCompact(data.receitaBruta)}</span>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Linha 4: Tabela detalhada por cultura ───────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <GlassCard className="p-5 hover:shadow-md transition-all duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Detalhamento por Cultura</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Cultura', 'Área (ha)', 'Produção (sc)', 'Produtiv. (sc/ha)', 'Preço Médio', 'VBP (R$)', '% do Total'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.culturas.map((c, i) => {
                  const pctTotal = (c.receitaBruta / data.receitaBruta) * 100;
                  return (
                    <tr key={c.nome} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CULTURA_COLORS[i % CULTURA_COLORS.length] }} />
                          {c.nome}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{fmtNum(c.area)}</td>
                      <td className="px-3 py-3 text-slate-600">{fmtNum(c.producao)}</td>
                      <td className="px-3 py-3 text-slate-600">{c.produtividade.toFixed(1)}</td>
                      <td className="px-3 py-3 text-slate-600">R$ {c.precoMedio}/sc</td>
                      <td className="px-3 py-3 font-semibold text-emerald-700">{fmtCompact(c.receitaBruta)}</td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'font-bold px-2 py-0.5 rounded-full text-xs',
                          pctTotal >= 40 ? 'bg-emerald-100 text-emerald-700' :
                          pctTotal >= 20 ? 'bg-blue-100 text-blue-700' :
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
                  <td className="px-3 py-3 font-bold text-slate-700">{fmtNum(data.producaoTotal)}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">{data.produtividadeMedia.toFixed(1)}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">R$ {data.precoMedioVenda}/sc</td>
                  <td className="px-3 py-3 font-black text-emerald-800">{fmtBRL(data.receitaBruta)}</td>
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
