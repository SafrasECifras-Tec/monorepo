import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Minus,
  TrendingDown, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
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

// ── KpiCard ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, delay = 0 }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string }; delay?: number;
}) {
  const up   = trend && trend.value > 0;
  const down = trend && trend.value < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-card transition-all duration-300 h-full">
        <span className="text-[14px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[24px] font-black text-foreground leading-tight">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold mt-auto',
            up ? 'text-primary' : down ? 'text-destructive' : 'text-muted-foreground')}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : down ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
          </div>
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
            <span className="text-muted-foreground font-medium truncate">{item.name}</span>
          </div>
          <span className="text-muted-foreground font-semibold shrink-0">
            {((item.value / item.total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── BulletBar ─────────────────────────────────────────────────────────────────

type BulletKind = 'receita' | 'custo' | 'resultado';

function BulletBar({ label, realizado, orcado, kind = 'custo', delay = 0 }: {
  label: string; realizado: number; orcado: number; kind?: BulletKind; delay?: number;
}) {
  const rawPct = orcado > 0 ? (realizado / orcado) * 100 : 0;
  const pct    = Math.min(rawPct, 130);

  let barColor: string;
  let statusText: string;
  if (kind === 'receita') {
    barColor   = rawPct >= 100 ? '#10b981' : rawPct >= 90 ? '#f59e0b' : '#ef4444';
    statusText = rawPct >= 100 ? 'Meta batida ✓' : rawPct >= 90 ? 'Próximo da meta' : 'Abaixo da meta';
  } else if (kind === 'resultado') {
    barColor   = rawPct >= 100 ? '#3b82f6' : rawPct >= 80 ? '#f59e0b' : '#ef4444';
    statusText = rawPct >= 100 ? 'Resultado no alvo' : rawPct >= 80 ? 'Abaixo do esperado' : 'Resultado crítico';
  } else {
    barColor   = rawPct <= 80 ? '#10b981' : rawPct <= 100 ? '#f59e0b' : '#ef4444';
    statusText = rawPct <= 80 ? 'Abaixo do orçado' : rawPct <= 95 ? 'Próximo ao orçado' : rawPct <= 100 ? 'No limite' : 'Orçamento estourado';
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{fmtCompact(realizado)} / {fmtCompact(orcado)}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: `${barColor}20`, color: barColor }}>
            {rawPct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/60 z-10"
          style={{ left: `${Math.min(100 / (pct > 100 ? pct / 100 : 1), 100)}%` }} />
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ backgroundColor: barColor, width: `${Math.min(pct, 100)}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{statusText}</span>
    </motion.div>
  );
}

// ── InsightCard ───────────────────────────────────────────────────────────────

type InsightType = 'success' | 'warning' | 'danger' | 'info';

const INSIGHT_STYLES: Record<InsightType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-primary/5', border: 'border-primary/20', icon: <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> },
  warning: { bg: 'bg-warning/5',   border: 'border-warning/20',   icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" /> },
  danger:  { bg: 'bg-destructive/5',     border: 'border-destructive/20',     icon: <TrendingDown className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> },
  info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> },
};

function InsightCard({ type, text, delay = 0 }: { type: InsightType; text: string; delay?: number }) {
  const s = INSIGHT_STYLES[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn('flex items-start gap-2 p-3 rounded-xl border text-xs font-medium text-foreground', s.bg, s.border)}
    >
      {s.icon}
      <span>{text}</span>
    </motion.div>
  );
}

// ── Paletas ───────────────────────────────────────────────────────────────────

const CULTURA_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e'];
const CUSTO_COLORS   = ['#f87171', '#fb923c', '#94a3b8', '#c084fc', '#38bdf8'];

// ── Main ──────────────────────────────────────────────────────────────────────

export function DREInicioTab({ data, prev, onNavigate }: {
  data: SafraImportData;
  prev: SafraImportData | null;
  onNavigate: (tab: string) => void;
}) {
  const trendProd = prev
    ? ((data.produtividadeMedia - prev.produtividadeMedia) / prev.produtividadeMedia) * 100
    : null;
  const trendArea = prev
    ? ((data.areaTotal - prev.areaTotal) / prev.areaTotal) * 100
    : null;

  // Saúde Financeira — 3 barras clicáveis
  const finData = useMemo(() => [
    { name: 'VBP',       label: 'Valor Bruto de Produção',  value: data.receitaBruta,    fill: '#10b981', tab: 'culturas' },
    { name: 'Custo',     label: 'Custo Total Desembolsado', value: data.custoTotal,      fill: '#f87171', tab: 'historico' },
    { name: 'Resultado', label: 'Resultado Operacional',    value: data.resultadoLiquido, fill: data.resultadoLiquido >= 0 ? '#3b82f6' : '#ef4444', tab: 'historico' },
  ], [data]);

  // Donut A — Receita por Cultura
  const receitaData = useMemo(() =>
    data.culturas.map((c, i) => ({ name: c.nome, value: c.receitaBruta, color: CULTURA_COLORS[i % CULTURA_COLORS.length] })),
    [data]);

  // Donut B — Custo por Cultura
  const custoData = useMemo(() =>
    data.culturas.map((c, i) => ({ name: c.nome, value: c.custoTotal, color: CUSTO_COLORS[i % CUSTO_COLORS.length] })),
    [data]);

  // Bullet bars
  const bulletReceita  = { label: 'Valor Bruto de Produção', realizado: data.receitaBruta,    orcado: data.orcadoVbp };
  const bulletCusto    = { label: 'Custo Total',             realizado: data.custoTotal,      orcado: data.orcadoCusto };
  const bulletResultado = { label: 'Resultado Operacional',  realizado: data.resultadoLiquido, orcado: data.orcadoResultado };

  // Insights dinâmicos
  const insights = useMemo(() => {
    const items: { type: InsightType; text: string }[] = [];

    // Produtividade vs safra anterior
    if (prev) {
      const delta = ((data.produtividadeMedia - prev.produtividadeMedia) / prev.produtividadeMedia) * 100;
      if (delta >= 3)
        items.push({ type: 'success', text: `Produtividade superou a safra anterior em +${delta.toFixed(1)}% (${data.produtividadeMedia.toFixed(1)} sc/ha).` });
      else if (delta <= -3)
        items.push({ type: 'danger',  text: `Produtividade caiu ${Math.abs(delta).toFixed(1)}% vs safra anterior (${data.produtividadeMedia.toFixed(1)} sc/ha).` });
      else
        items.push({ type: 'info',    text: `Produtividade estável em ${data.produtividadeMedia.toFixed(1)} sc/ha (${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs anterior).` });
    }

    // Custo vs orçado
    const custoPct = (data.custoTotal / data.orcadoCusto) * 100;
    if (custoPct > 100)
      items.push({ type: 'danger',  text: `Custo total excedeu o orçado em ${(custoPct - 100).toFixed(1)}% (${fmtCompact(data.custoTotal)} vs ${fmtCompact(data.orcadoCusto)}).` });
    else if (custoPct <= 93)
      items.push({ type: 'success', text: `Custo total ${(100 - custoPct).toFixed(1)}% abaixo do orçado — gestão eficiente de despesas.` });
    else
      items.push({ type: 'warning', text: `Custo total próximo ao orçado: ${custoPct.toFixed(1)}% realizado.` });

    // Margem líquida
    if (data.margemLiquida >= 20)
      items.push({ type: 'success', text: `Margem líquida saudável em ${data.margemLiquida.toFixed(1)}% — operação rentável.` });
    else if (data.margemLiquida >= 12)
      items.push({ type: 'warning', text: `Margem líquida em zona de atenção: ${data.margemLiquida.toFixed(1)}%.` });
    else
      items.push({ type: 'danger',  text: `Margem líquida abaixo do mínimo operacional: ${data.margemLiquida.toFixed(1)}%.` });

    // ROI
    if (data.roi >= 25)
      items.push({ type: 'success', text: `ROI de ${data.roi.toFixed(1)}% indica excelente retorno sobre o capital investido.` });
    else if (data.roi >= 15)
      items.push({ type: 'info',    text: `ROI de ${data.roi.toFixed(1)}% — retorno adequado para a atividade.` });
    else
      items.push({ type: 'warning', text: `ROI de ${data.roi.toFixed(1)}% — considere revisar a estrutura de custos.` });

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

      {/* ── Linha 2: Saúde Financeira (60%) + Donuts (40%) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Saúde Financeira */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5 h-full hover:shadow-card transition-all duration-300">
            <h3 className="text-sm font-bold text-foreground mb-0.5">Saúde Financeira</h3>
            <p className="text-xs text-muted-foreground mb-4">Clique em uma barra para ver detalhes</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: number, _: string, props: any) => [fmtBRL(v), props.payload.label]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={120}>
                    {finData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              {finData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Donuts */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Donut A — Receita por Cultura */}
          <motion.div className="flex-1"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <GlassCard className="p-4 h-full hover:shadow-card transition-all duration-300">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Receita por Cultura</h3>
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={receitaData} dataKey="value" innerRadius="58%" outerRadius="82%"
                        startAngle={90} endAngle={-270} paddingAngle={2} strokeWidth={0}>
                        {receitaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        <Label content={({ viewBox }: any) => {
                          const { cx, cy } = viewBox;
                          return (
                            <text textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} y={cy - 6} fontSize="11" fontWeight="800" fill="#1e293b">{fmtCompact(data.receitaBruta)}</tspan>
                              <tspan x={cx} y={cy + 8} fontSize="9" fill="#64748b">total</tspan>
                            </text>
                          );
                        }} />
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [fmtBRL(v), name]}
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <DonutLegend items={receitaData.map(d => ({ ...d, total: data.receitaBruta }))} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Donut B — Custo por Cultura */}
          <motion.div className="flex-1"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <GlassCard className="p-4 h-full hover:shadow-card transition-all duration-300">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Custo por Cultura</h3>
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={custoData} dataKey="value" innerRadius="58%" outerRadius="82%"
                        startAngle={90} endAngle={-270} paddingAngle={2} strokeWidth={0}>
                        {custoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        <Label content={({ viewBox }: any) => {
                          const { cx, cy } = viewBox;
                          return (
                            <text textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} y={cy - 6} fontSize="11" fontWeight="800" fill="#1e293b">{fmtCompact(data.custoTotal)}</tspan>
                              <tspan x={cx} y={cy + 8} fontSize="9" fill="#64748b">total</tspan>
                            </text>
                          );
                        }} />
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [fmtBRL(v), name]}
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <DonutLegend items={custoData.map(d => ({ ...d, total: data.custoTotal }))} />
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </div>

      {/* ── Linha 3: Termômetros (60%) + Insights (40%) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Orçado vs Realizado */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-card transition-all duration-300">
            <h3 className="text-sm font-bold text-foreground mb-0.5">Orçado vs. Realizado</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentual executado em relação ao orçamento planejado</p>

            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Receita</p>
            <BulletBar {...bulletReceita} kind="receita" delay={0.2} />

            <div className="border-t border-border/50 my-4" />

            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Despesas</p>
            <BulletBar {...bulletCusto} kind="custo" delay={0.26} />

            <div className="border-t border-border/50 my-4" />

            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Resultado</p>
            <BulletBar {...bulletResultado} kind="resultado" delay={0.32} />

            {/* Legenda dupla */}
            <div className="flex flex-col gap-1 mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-muted-foreground w-14 shrink-0">Receita:</span>
                {[{ color: '#10b981', label: '≥ 100% Meta batida' }, { color: '#f59e0b', label: '90–99% Atenção' }, { color: '#ef4444', label: '< 90% Abaixo' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />{l.label}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-muted-foreground w-14 shrink-0">Custo:</span>
                {[{ color: '#10b981', label: '≤ 80% Economizado' }, { color: '#f59e0b', label: '81–100% Atenção' }, { color: '#ef4444', label: '> 100% Estourou' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />{l.label}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Insights */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="p-5 h-full hover:shadow-card transition-all duration-300">
            <h3 className="text-sm font-bold text-foreground mb-0.5">Insights da Safra</h3>
            <p className="text-xs text-muted-foreground mb-4">Análise automática dos indicadores</p>
            <div className="flex flex-col gap-2.5">
              {insights.map((item, i) => (
                <InsightCard key={i} type={item.type} text={item.text} delay={0.25 + i * 0.07} />
              ))}
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </div>
  );
}
