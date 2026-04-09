import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  ComposedChart, Line,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Minus,
  TrendingDown, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import type { SafraImportData } from '@/contexts/ImportDataContext';
import { dreData } from '@/data/dre/dreData';
import type { Safra } from '@/data/dre/dreData';

// Fallback: usa valor importado se > 0, senão cai no dreData estático
function fbInicio(d: SafraImportData, field: 'custoInsumos' | 'custoOperacao' | 'custoJuros' | 'custoTotal' | 'roi'): number {
  const v = d[field] as number;
  if (v) return v;
  return (dreData[d.safra as Safra]?.[field] as number) ?? 0;
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    : `R$ ${(v / 1_000).toFixed(0)}k`;

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

// ── KpiCard ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, delay = 0 }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string }; delay?: number;
}) {
  const up   = trend && trend.value > 0;
  const down = trend && trend.value < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-float transition-all duration-300 h-full">
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
      </GlassCard>
    </motion.div>
  );
}

// ── InsightCard ───────────────────────────────────────────────────────────────

type InsightType = 'success' | 'warning' | 'danger' | 'info';

const INSIGHT_STYLES: Record<InsightType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> },
  warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> },
  danger:  { bg: 'bg-red-50',     border: 'border-red-200',     icon: <TrendingDown className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> },
  info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> },
};

function InsightCard({ type, text, delay = 0 }: { type: InsightType; text: string; delay?: number }) {
  const s = INSIGHT_STYLES[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn('flex items-start gap-2 p-3 rounded-xl border text-xs font-medium text-slate-700', s.bg, s.border)}
    >
      {s.icon}
      <span>{text}</span>
    </motion.div>
  );
}

// ── Paletas ───────────────────────────────────────────────────────────────────

// Cores categóricas por cultura — consistentes em todos os gráficos
const CULTURA_COLORS = ['#6366f1', '#f59e0b', '#0ea5e9', '#f4af2d', '#f43f5e'];

// ── Main ──────────────────────────────────────────────────────────────────────

export function DREInicioTab({ data, prev, dreDataRecord, safras, onNavigate }: {
  data: SafraImportData;
  prev: SafraImportData | null;
  dreDataRecord: Record<string, SafraImportData>;
  safras: string[];
  onNavigate: (tab: string) => void;
}) {
  const trendProd = prev
    ? ((data.produtividadeMedia - prev.produtividadeMedia) / prev.produtividadeMedia) * 100
    : null;
  const trendArea = prev
    ? ((data.areaTotal - prev.areaTotal) / prev.areaTotal) * 100
    : null;

  // ── mapa de cores por cultura (nome → cor) — consistente em todos os gráficos ──
  const culturaColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.culturas.forEach((c, i) => { map[c.nome] = CULTURA_COLORS[i % CULTURA_COLORS.length]; });
    return map;
  }, [data]);

  // Saúde Financeira — VBP, Custo e Resultado (realizado vs orçado)
  const finData = useMemo(() => [
    {
      name: 'VBP', label: 'Valor Bruto de Produção', tab: 'vbp',
      realizado: data.receitaBruta, orcado: data.orcadoVbp,
      fillReal: '#10b981', fillOrc: '#bbf7d0',
    },
    {
      name: 'Custo', label: 'Custo Total Desembolsado', tab: 'custo',
      realizado: data.custoTotal, orcado: data.orcadoCusto,
      fillReal: '#f87171', fillOrc: '#fecaca',
    },
    {
      name: 'Resultado', label: 'Resultado Operacional', tab: 'historico',
      realizado: data.resultadoLiquido, orcado: data.orcadoResultado,
      fillReal: '#3b82f6', fillOrc: '#bfdbfe',
    },
  ], [data]);

  // Donut — Percentual de área por atividade (cores categóricas)
  const areaData = useMemo(() =>
    data.culturas.map(c => ({
      nome: c.nome,
      area: c.area,
      pct: data.areaTotal > 0 ? (c.area / data.areaTotal) * 100 : 0,
      fill: culturaColorMap[c.nome] ?? '#94a3b8',
    })),
    [data, culturaColorMap]);

  // ComposedChart — ROI (barras) + Peso Fertilizantes + Peso Defensivos (linhas), por safra
  const retornoData = useMemo(() =>
    safras.map(s => {
      const d = dreDataRecord[s];
      const custo     = fbInicio(d, 'custoTotal');
      const insumos   = fbInicio(d, 'custoInsumos');
      const roi       = fbInicio(d, 'roi');
      const pesoFert  = custo > 0 ? (insumos * 0.43 / custo) * 100 : 0;
      const pesoDef   = custo > 0 ? (insumos * 0.35 / custo) * 100 : 0;
      return { safra: s, roi, pesoFertilizantes: +pesoFert.toFixed(1), pesoDefensivos: +pesoDef.toFixed(1) };
    }),
    [safras, dreDataRecord]);

  // Receita vs Custo por cultura — 2 barras simples
  const receitaCustoData = useMemo(() =>
    data.culturas.map(c => ({
      nome:    c.nome,
      receita: c.receitaBruta,
      custo:   c.custoTotal,
    })),
  [data]);

  // Insights dinâmicos — sem repetir KPIs (Área, Produção, Produtividade, Preço Médio)
  const insights = useMemo(() => {
    const items: { type: InsightType; text: string }[] = [];

    // 1. Custo/ha — indicador não exibido nos KPIs
    const custoHa = data.areaTotal > 0 ? data.custoTotal / data.areaTotal : 0;
    if (prev && prev.areaTotal > 0) {
      const prevCustoHa = prev.custoTotal / prev.areaTotal;
      const delta = ((custoHa - prevCustoHa) / prevCustoHa) * 100;
      if (delta > 10)
        items.push({ type: 'danger',  text: `Custo/ha subiu ${delta.toFixed(1)}% vs safra anterior — agora R$ ${fmtNum(Math.round(custoHa))}/ha.` });
      else if (delta < -5)
        items.push({ type: 'success', text: `Custo/ha reduziu ${Math.abs(delta).toFixed(1)}% vs safra anterior — R$ ${fmtNum(Math.round(custoHa))}/ha.` });
      else
        items.push({ type: 'info',    text: `Custo/ha estável em R$ ${fmtNum(Math.round(custoHa))}/ha (${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs anterior).` });
    } else {
      items.push({ type: 'info', text: `Custo por hectare: R$ ${fmtNum(Math.round(custoHa))}/ha na safra atual.` });
    }

    // 2. Ponto de equilíbrio (break-even price por saca)
    const precoEquilibrio = data.producaoTotal > 0 ? data.custoTotal / data.producaoTotal : 0;
    const margemPorSaca   = data.precoMedioVenda - precoEquilibrio;
    if (margemPorSaca >= 10)
      items.push({ type: 'success', text: `Ponto de equilíbrio em R$ ${precoEquilibrio.toFixed(0)}/sc — preço atual ${fmtNum(data.precoMedioVenda)}/sc garante R$ ${margemPorSaca.toFixed(0)} de margem por saca.` });
    else if (margemPorSaca >= 0)
      items.push({ type: 'warning', text: `Ponto de equilíbrio em R$ ${precoEquilibrio.toFixed(0)}/sc — margem de apenas R$ ${margemPorSaca.toFixed(0)}/sc. Pouca folga de preço.` });
    else
      items.push({ type: 'danger',  text: `Preço médio (R$ ${fmtNum(data.precoMedioVenda)}/sc) abaixo do ponto de equilíbrio (R$ ${precoEquilibrio.toFixed(0)}/sc) — prejuízo por saca.` });

    // 3. Margem líquida
    if (data.margemLiquida >= 20)
      items.push({ type: 'success', text: `Margem líquida saudável em ${data.margemLiquida.toFixed(1)}% — operação rentável e com folga.` });
    else if (data.margemLiquida >= 12)
      items.push({ type: 'warning', text: `Margem líquida em zona de atenção: ${data.margemLiquida.toFixed(1)}% — monitor custos.` });
    else
      items.push({ type: 'danger',  text: `Margem líquida abaixo do mínimo operacional: ${data.margemLiquida.toFixed(1)}%.` });

    // 4. ROI
    if (data.roi >= 25)
      items.push({ type: 'success', text: `ROI de ${data.roi.toFixed(1)}% — excelente retorno sobre o capital investido na safra.` });
    else if (data.roi >= 15)
      items.push({ type: 'info',    text: `ROI de ${data.roi.toFixed(1)}% — retorno adequado para a atividade agrícola.` });
    else
      items.push({ type: 'warning', text: `ROI de ${data.roi.toFixed(1)}% — abaixo do esperado. Revise estrutura de custos.` });

    return items.slice(0, 4);
  }, [data, prev]);

  const handleBarClick = (entry: any) => {
    if (entry?.activePayload?.[0]?.payload?.tab) {
      onNavigate(entry.activePayload[0].payload.tab);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: 4 KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Área Plantada"       value={`${fmtNum(data.areaTotal)} ha`}
          trend={trendArea ? { value: trendArea, label: 'vs safra ant.' } : undefined} delay={0} />
        <KpiCard label="Produção Total"      value={`${fmtNum(data.producaoTotal)} sc`}
          sub={`${fmtNum(data.producaoTotal * 60)} kg`}
          trend={trendProd ? { value: trendProd, label: 'vs safra ant.' } : undefined} delay={0.05} />
        <KpiCard label="Produtividade Média" value={`${data.produtividadeMedia.toFixed(1)} sc/ha`}
          trend={trendProd ? { value: trendProd, label: 'vs safra ant.' } : undefined} delay={0.1} />
        <KpiCard label="Preço Médio de Venda" value={`R$ ${data.precoMedioVenda}/sc`}
          sub={`Total: ${fmtCompact(data.receitaBruta)}`} delay={0.15} />
      </div>

      {/* ── Linha 2: Saúde Financeira (60%) + Insights da Safra (40%) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Saúde Financeira */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Saúde Financeira</h3>
            <p className="text-xs text-slate-400 mb-4">Realizado vs. Orçado — clique em uma categoria para ver detalhes</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finData} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="28%" barGap={3}
                  onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: number, name: string, props: any) => [
                      fmtBRL(v),
                      name === 'realizado' ? `${props.payload.label} (Realizado)` : `${props.payload.label} (Orçado)`,
                    ]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar dataKey="realizado" name="realizado" radius={[6, 6, 0, 0]} maxBarSize={52}
                    label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#475569',
                      formatter: (v: number) => fmtCompact(v) }}>
                    {finData.map((entry, i) => <Cell key={i} fill={entry.fillReal} />)}
                  </Bar>
                  <Bar dataKey="orcado" name="orcado" radius={[6, 6, 0, 0]} maxBarSize={52}
                    label={{ position: 'top', fontSize: 10, fontWeight: 400, fill: '#94a3b8',
                      formatter: (v: number) => fmtCompact(v) }}>
                    {finData.map((entry, i) => (
                      <Cell key={i} fill={entry.fillOrc} stroke={entry.fillReal} strokeWidth={1.5} strokeDasharray="4 2" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-slate-100">
              {/* Realizado — quadrado sólido */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: `linear-gradient(135deg, #10b981 33%, #f87171 33% 66%, #3b82f6 66%)` }} />
                Realizado
              </div>
              {/* Separador */}
              <span className="text-slate-200 text-sm">|</span>
              {/* Orçado — quadrado com borda tracejada */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="w-3 h-3 rounded-sm shrink-0 border border-dashed border-slate-400 bg-slate-100" />
                Orçado (meta)
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Insights da Safra */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Insights da Safra</h3>
            <p className="text-xs text-slate-400 mb-4">Análise automática dos indicadores de performance</p>
            <div className="flex flex-col gap-2.5">
              {insights.map((item, i) => (
                <InsightCard key={i} type={item.type} text={item.text} delay={0.2 + i * 0.07} />
              ))}
            </div>
          </GlassCard>
        </motion.div>

      </div>

      {/* ── Linha 3: grade 2×2 — todos com 50% ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Card 1 — Donut: Percentual de Área */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Percentual de Área</h3>
            <p className="text-xs text-slate-400 mb-3">Distribuição das {fmtNum(data.areaTotal)} ha por atividade</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaData} dataKey="pct"
                    cx="50%" cy="50%"
                    outerRadius="80%" innerRadius="48%"
                    paddingAngle={2} strokeWidth={0} labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const r = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + r * Math.cos(-midAngle * RADIAN);
                      const y = cy + r * Math.sin(-midAngle * RADIAN);
                      return percent > 0.06 ? (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                          fontSize={12} fontWeight={700}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {areaData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _: string, props: any) => [
                      `${v.toFixed(1)}%  (${fmtNum(props.payload.area)} ha)`,
                      props.payload.nome,
                    ]}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
              {areaData.map(d => (
                <div key={d.nome} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  {d.nome}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Card 2 — ComposedChart: ROI (barras) + Peso Fertilizantes + Peso Defensivos (linhas) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Retorno sobre a Margem Bruta</h3>
            <p className="text-xs text-slate-400 mb-3">ROI (%) e peso de insumos no custo total — por safra</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={retornoData} margin={{ top: 24, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                  {/* Eixo esquerdo — ROI */}
                  <YAxis yAxisId="roi" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `${v}%`} />
                  {/* Eixo direito — Pesos */}
                  <YAxis yAxisId="peso" orientation="right" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `${v.toFixed(1)}%`,
                      name === 'roi'               ? 'ROI'                  :
                      name === 'pesoFertilizantes' ? 'Peso Fertilizantes'   :
                                                     'Peso Defensivos',
                    ]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar yAxisId="roi" dataKey="roi" name="roi" fill="#1e3a5f"
                    radius={[6, 6, 0, 0]} maxBarSize={48}
                    label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#475569',
                      formatter: (v: number) => `${v.toFixed(0)}%` }}
                  />
                  <Line yAxisId="peso" dataKey="pesoFertilizantes" name="pesoFertilizantes"
                    type="monotone" stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="peso" dataKey="pesoDefensivos" name="pesoDefensivos"
                    type="monotone" stroke="#f43f5e" strokeWidth={2.5}
                    dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#1e3a5f' }} />
                ROI
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-5 h-0.5 rounded shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                Peso Fertilizantes
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-5 h-0.5 rounded shrink-0" style={{ backgroundColor: '#f43f5e' }} />
                Peso Defensivos
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Card 3 — Receita vs Custo empilhado por tipo (full width) */}
        <motion.div className="sm:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Receita vs. Custo por Atividade</h3>
            <p className="text-xs text-slate-400 mb-3">VBP realizado vs. custo total desembolsado por cultura</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitaCustoData} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}
                  barCategoryGap="30%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      fmtBRL(v),
                      name === 'receita' ? 'Receita (VBP)' : 'Custo Total',
                    ]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar dataKey="receita" name="receita" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56}
                    label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#059669',
                      formatter: (v: number) => fmtCompact(v) }} />
                  <Bar dataKey="custo" name="custo" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={56}
                    label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#dc2626',
                      formatter: (v: number) => fmtCompact(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#10b981' }} />
                Receita (VBP)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#f87171' }} />
                Custo Total
              </div>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </div>
  );
}
