import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label,
  ComposedChart, Line, Legend,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
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

const CUSTO_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#475569', '#ef4444'];

// Cores fixas dos componentes de custo — paleta padrão do sistema
const COR_INSUMOS   = '#10b981'; // verde  — maior categoria
const COR_OPERACAO  = '#475569'; // cinza  — neutro operacional
const COR_JUROS     = '#f59e0b'; // laranja — custo financeiro
const COR_PROD_LINE = '#3b82f6'; // azul   — linha de produtividade

// ── Médias S&C — substituir por dados reais quando disponíveis ────────────────
const SC_MEDIAS_CUSTO = {
  custoHaComArrendamento: 4_800,  // R$/ha
  custoHaSemArrendamento: 3_900,  // R$/ha
};

const ARRENDAMENTO_POR_HA = 900; // R$/ha — custo estimado de arrendamento

// ── KpiCard ───────────────────────────────────────────────────────────────────

// ── DesembolsoHaCard — toggle c/ / s/ Arrendamento vs S&C ───────────────────

function DesembolsoHaCard({ custoHa, custoHaSemArrend, delay = 0 }: {
  custoHa: number;
  custoHaSemArrend: number;
  delay?: number;
}) {
  const [comArrend, setComArrend] = useState(true);

  const realizado = comArrend ? custoHa : custoHaSemArrend;
  const scMedia   = comArrend ? SC_MEDIAS_CUSTO.custoHaComArrendamento : SC_MEDIAS_CUSTO.custoHaSemArrendamento;
  const delta     = realizado - scMedia;
  const pct       = scMedia > 0 ? (delta / scMedia) * 100 : 0;
  const color     = delta <= 0 ? '#10b981' : '#ef4444';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-md transition-all duration-300 h-full">
        <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Desembolso por ha</span>

        <span className="text-[24px] font-black text-slate-800 leading-tight">
          R$ {fmtNum(Math.round(realizado))}/ha
        </span>

        <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
          {/* Comparação S&C — esquerda */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] text-slate-500 truncate">S&C: <span className="font-semibold text-slate-700">R$ {scMedia.toLocaleString('pt-BR')}</span></span>
            <span className="font-bold px-1.5 py-0.5 rounded-full text-[10px] shrink-0"
              style={{ backgroundColor: `${color}18`, color }}>
              {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
            </span>
          </div>

          {/* Toggle — direita */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold shrink-0">
            <button
              onClick={() => setComArrend(true)}
              className={cn('px-2 py-1 rounded-md transition-all duration-200',
                comArrend ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}>
              c/ Arrend.
            </button>
            <button
              onClick={() => setComArrend(false)}
              className={cn('px-2 py-1 rounded-md transition-all duration-200',
                !comArrend ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}>
              s/ Arrend.
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

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

// ── CustoTable ────────────────────────────────────────────────────────────────

// Médias S&C por rubrica (R$/ha) — substituir por dados reais
const SC_RUBRICAS: Record<string, number> = {
  'Sementes':                          280,
  'Fertilizantes':                     900,
  'Defensivos':                        820,
  'Mão de obra':                       180,
  'Combustíveis e lubrificantes':      160,
  'Manut. Máquinas e Equipamentos':    140,
  'Manut. Benfeitorias e Aramados':     60,
  'Secagem e Armazenagem':             200,
  'Aplicação aérea':                   110,
  'Serviços de Terceiros':             130,
  'Máquinas Terceirizadas':            160,
  'Despesas com veículos':              60,
  'Impostos e taxas':                  100,
  'Administração':                      80,
  'Outros':                             40,
  'Juros e Variações Monetárias':      200,
};

// Proporções fixas dos subitens dentro de cada categoria
const PROP_INSUMOS = [
  { nome: 'Sementes',      pct: 0.15 },
  { nome: 'Fertilizantes', pct: 0.45 },
  { nome: 'Defensivos',    pct: 0.40 },
];
const PROP_OPERACAO = [
  { nome: 'Mão de obra',                      pct: 0.08 },
  { nome: 'Combustíveis e lubrificantes',      pct: 0.12 },
  { nome: 'Manut. Máquinas e Equipamentos',    pct: 0.10 },
  { nome: 'Manut. Benfeitorias e Aramados',    pct: 0.05 },
  { nome: 'Secagem e Armazenagem',             pct: 0.15 },
  { nome: 'Aplicação aérea',                   pct: 0.08 },
  { nome: 'Serviços de Terceiros',             pct: 0.10 },
  { nome: 'Máquinas Terceirizadas',            pct: 0.12 },
  { nome: 'Despesas com veículos',             pct: 0.05 },
  { nome: 'Impostos e taxas',                  pct: 0.08 },
  { nome: 'Administração',                     pct: 0.05 },
  { nome: 'Outros',                            pct: 0.02 },
];

function CustoTable({ data }: { data: SafraImportData }) {
  const [expanded, setExpanded] = useState(new Set<string>(['insumos', 'operacao']));
  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const area = data.areaTotal || 1;
  const prod = data.producaoTotal || 1;
  const preco = data.precoMedioVenda || 1;

  // Ponto de equilíbrio de uma rubrica = custo_rubrica / producaoTotal (R$/sc)
  const pe = (total: number) => total / prod;
  const ha = (total: number) => total / area;
  const vsMedia = (total: number, nome: string) => {
    const sc = SC_RUBRICAS[nome];
    if (!sc) return null;
    return ((ha(total) - sc) / sc) * 100;
  };

  type Subitem = { nome: string; total: number };
  type Secao = { id: string; label: string; total: number; bg: string; text: string; accent: string; itens: Subitem[] };

  const custoInsumos  = data.custoInsumos  > 0 ? data.custoInsumos  : data.custoTotal * 0.55;
  const custoOperacao = data.custoOperacao > 0 ? data.custoOperacao : data.custoTotal * 0.35;
  const custoJuros    = data.custoJuros    > 0 ? data.custoJuros    : data.custoTotal * 0.10;

  const secoes: Secao[] = [
    {
      id: 'insumos', label: 'Insumos', total: custoInsumos,
      bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-400',
      itens: PROP_INSUMOS.map(p => ({ nome: p.nome, total: custoInsumos * p.pct })),
    },
    {
      id: 'operacao', label: 'Operação', total: custoOperacao,
      bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-400',
      itens: PROP_OPERACAO.map(p => ({ nome: p.nome, total: custoOperacao * p.pct })),
    },
    {
      id: 'juros', label: 'Juros', total: custoJuros,
      bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-400',
      itens: [{ nome: 'Juros e Variações Monetárias', total: custoJuros }],
    },
  ];

  const fmtHa    = (v: number) => `R$ ${fmtNum(Math.round(v))}`;
  const fmtPe    = (v: number) => `${v.toFixed(2).replace('.', ',')}`;
  const fmtTotal = (v: number) => fmtCompact(v);

  const thClass = 'py-3 px-4 text-right font-bold border-r border-b border-slate-200 whitespace-nowrap';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <GlassCard className="flex flex-col overflow-hidden p-0 hover:shadow-md transition-all duration-300 h-[480px]">

        {/* Title */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-700">Desembolso por Rubrica</h3>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-40">
              <tr className="bg-white text-slate-600">
                <th className="sticky left-0 z-50 bg-white py-3 px-4 text-left font-bold border-r border-b border-slate-200 min-w-[220px] whitespace-nowrap">Rubrica</th>
                <th className={thClass + ' w-[120px]'}>Média S&C (R$/ha)</th>
                <th className={thClass + ' w-[120px]'}>P. Equilíbrio (R$/sc)</th>
                <th className={thClass + ' w-[110px]'}>R$/ha</th>
                <th className={thClass + ' w-[110px]'}>Total</th>
                <th className="py-3 px-4 text-right font-bold border-b border-slate-200 whitespace-nowrap w-[110px]">Vs Média S&C</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {secoes.map(sec => (
                <>
                  {/* Categoria */}
                  <tr key={sec.id} className={cn(sec.bg, 'cursor-pointer')} onClick={() => toggle(sec.id)}>
                    <td className={cn('sticky left-0 z-20 py-3 px-4 font-bold border-l-[3px] border-r border-b border-slate-200 whitespace-nowrap', sec.bg, sec.text, sec.accent)}>
                      <div className="flex items-center gap-1.5">
                        {expanded.has(sec.id)
                          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                        {sec.label}
                      </div>
                    </td>
                    <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', sec.text)}>—</td>
                    <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', sec.text)}>{fmtPe(pe(sec.total))}</td>
                    <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', sec.text)}>{fmtHa(ha(sec.total))}</td>
                    <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', sec.text)}>{fmtTotal(sec.total)}</td>
                    <td className={cn('py-3 px-4 text-right font-bold border-b border-slate-100 whitespace-nowrap', sec.text)}>—</td>
                  </tr>

                  {/* Subitens */}
                  {expanded.has(sec.id) && sec.itens.map((item, i) => {
                    const vs = vsMedia(item.total, item.nome);
                    const vsColor = vs == null ? '#94a3b8' : vs <= 0 ? '#10b981' : '#ef4444';
                    return (
                      <tr key={item.nome} className={cn('transition-colors hover:bg-blue-50/20', i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                        <td className={cn('sticky left-0 z-20 py-2.5 pl-8 pr-4 text-slate-600 font-medium border-r border-b border-slate-100 whitespace-nowrap', i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                          {item.nome}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500 border-r border-b border-slate-100 font-mono whitespace-nowrap">
                          {SC_RUBRICAS[item.nome] ? fmtHa(SC_RUBRICAS[item.nome]) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-r border-b border-slate-100 font-mono whitespace-nowrap">
                          {fmtPe(pe(item.total))}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-r border-b border-slate-100 font-mono whitespace-nowrap">
                          {fmtHa(ha(item.total))}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-r border-b border-slate-100 font-mono whitespace-nowrap">
                          {fmtTotal(item.total)}
                        </td>
                        <td className="py-2.5 px-4 text-right border-b border-slate-100 whitespace-nowrap">
                          {vs != null ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${vsColor}18`, color: vsColor }}>
                              {vs >= 0 ? '+' : ''}{vs.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>

            {/* Footer */}
            <tfoot className="sticky bottom-0 z-40">
              <tr className="font-bold text-slate-700 text-sm">
                <td className="sticky left-0 z-50 bg-slate-300 py-3 px-4 whitespace-nowrap border-t-2 border-slate-400 min-w-[220px] text-left">Total</td>
                <td className="bg-slate-300 py-3 px-4 text-right font-mono font-bold whitespace-nowrap w-[120px] border-t-2 border-l border-slate-400">—</td>
                <td className="bg-slate-300 py-3 px-4 text-right font-mono font-bold whitespace-nowrap w-[120px] border-t-2 border-l border-slate-400">{fmtPe(pe(data.custoTotal))}</td>
                <td className="bg-slate-300 py-3 px-4 text-right font-mono font-bold whitespace-nowrap w-[110px] border-t-2 border-l border-slate-400">{fmtHa(ha(data.custoTotal))}</td>
                <td className="bg-slate-300 py-3 px-4 text-right font-mono font-bold whitespace-nowrap w-[110px] border-t-2 border-l border-slate-400">{fmtCompact(data.custoTotal)}</td>
                <td className="bg-slate-300 py-3 px-4 text-right font-mono font-bold whitespace-nowrap border-t-2 border-l border-slate-400">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
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
  const custoHa            = data.areaTotal > 0 ? data.custoTotal / data.areaTotal : 0;
  const custoHaSemArrend   = custoHa - ARRENDAMENTO_POR_HA;
  const prevCustoHa        = prev && prev.areaTotal > 0 ? prev.custoTotal / prev.areaTotal : null;

  // ── Trends ──────────────────────────────────────────────────────────────
  const trendCusto   = prev ? ((data.custoTotal - prev.custoTotal) / prev.custoTotal) * 100 : null;
  const trendCustoHa = prevCustoHa ? ((custoHa - prevCustoHa) / prevCustoHa) * 100 : null;
  const trendMargem  = prev ? (data.margemBruta - prev.margemBruta) : null;

  // ── Orçado vs Realizado ─────────────────────────────────────────────────
  const orcadoPct       = data.orcadoCusto > 0 ? (data.custoTotal / data.orcadoCusto) * 100 : 0;
  const orcadoDiff      = data.custoTotal - data.orcadoCusto;
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

  // ── Histórico com breakdown (Insumos / Operação / Juros) por safra ───────
  const breakdownData = useMemo(() =>
    safras.map(s => {
      const d = dreDataRecord[s];
      if (!d) return { safra: s, insumosHa: 0, operacaoHa: 0, jurosHa: 0, insumosPe: 0, operacaoPe: 0, jurosPe: 0, produtividade: 0 };
      const area = d.areaTotal || 1;
      const prod = d.producaoTotal || 1;
      const ins  = d.custoInsumos  > 0 ? d.custoInsumos  : d.custoTotal * 0.55;
      const ope  = d.custoOperacao > 0 ? d.custoOperacao : d.custoTotal * 0.35;
      const jur  = d.custoJuros    > 0 ? d.custoJuros    : d.custoTotal * 0.10;
      return {
        safra: s,
        insumosHa:   Math.round(ins / area),
        operacaoHa:  Math.round(ope / area),
        jurosHa:     Math.round(jur / area),
        insumosPe:   parseFloat((ins / prod).toFixed(2)),
        operacaoPe:  parseFloat((ope / prod).toFixed(2)),
        jurosPe:     parseFloat((jur / prod).toFixed(2)),
        produtividade: parseFloat((prod / area).toFixed(1)),
      };
    }),
    [safras, dreDataRecord]);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: 4 KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1 — Desembolso Operacional */}
        <KpiCard
          label="Desembolso Operacional"
          value={fmtCompact(data.custoTotal)}
          sub={fmtBRL(data.custoTotal)}
          trend={trendCusto != null ? { value: trendCusto, label: 'vs safra ant.' } : undefined}
          invertTrend delay={0}
        />

        {/* 2 — Desembolso /ha */}
        <KpiCard
          label="Desembolso /ha"
          value={`R$ ${fmtNum(Math.round(custoHa))}/ha`}
          sub={`Área: ${fmtNum(data.areaTotal)} ha`}
          trend={trendCustoHa != null ? { value: trendCustoHa, label: 'vs safra ant.' } : undefined}
          invertTrend delay={0.05}
        />

        {/* 3 — Desembolso por Saca */}
        <KpiCard
          label="Desembolso por Saca"
          value={`R$ ${(data.producaoTotal > 0 ? data.custoTotal / data.producaoTotal : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sc`}
          sub={`Produção: ${fmtNum(data.producaoTotal)} sc`}
          delay={0.1}
        />

        {/* 4 — Desembolso /ha com toggle c/ e s/ Arrendamento */}
        <DesembolsoHaCard custoHa={custoHa} custoHaSemArrend={custoHaSemArrend} delay={0.15} />

      </div>

      {/* ── Linha 2: Tabela Desembolso por Rubrica ──────────────────── */}
      <CustoTable data={data} />

      {/* ── Linha 3: Desembolso /ha + Ponto de Equilíbrio ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Esquerda — Desembolso Operacional p/ hectare */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Desembolso Operacional p/ hectare</h3>
            <p className="text-xs text-slate-400 mb-4">Composição do custo por ha ao longo das safras</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`R$ ${fmtNum(v)}/ha`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="insumosHa"  name="Insumos"  stackId="a" fill={COR_INSUMOS} />
                  <Bar dataKey="operacaoHa" name="Operação" stackId="a" fill={COR_OPERACAO} />
                  <Bar dataKey="jurosHa"    name="Juros"    stackId="a" fill={COR_JUROS} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Direita — Ponto de Equilíbrio vs Produtividade */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <GlassCard className="p-5 hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Ponto de Equilíbrio vs Produtividade</h3>
            <p className="text-xs text-slate-400 mb-4">PE por componente (R$/sc) e produtividade real (sc/ha)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={breakdownData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis yAxisId="pe" axisLine={false} tickLine={false} width={52}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$${v}`} />
                  <YAxis yAxisId="prod" orientation="right" axisLine={false} tickLine={false} width={48}
                    tick={{ fill: COR_PROD_LINE, fontSize: 10 }}
                    tickFormatter={v => `${v}sc`} />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === 'Produtividade' ? [`${v} sc/ha`, name] : [`R$ ${v}/sc`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar yAxisId="pe" dataKey="insumosPe"  name="Insumos"  stackId="b" fill={COR_INSUMOS} />
                  <Bar yAxisId="pe" dataKey="operacaoPe" name="Operação" stackId="b" fill={COR_OPERACAO} />
                  <Bar yAxisId="pe" dataKey="jurosPe"    name="Juros"    stackId="b" fill={COR_JUROS} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="prod" dataKey="produtividade" name="Produtividade"
                    type="monotone" stroke={COR_PROD_LINE} strokeWidth={2.5}
                    dot={{ fill: COR_PROD_LINE, r: 4, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

      </div>

      {/* ── Linha 4: Evolução (60%) + Orçado & Métricas (40%) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Esquerda — Evolução */}
        <motion.div className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-full hover:shadow-float transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Evolução do Custo</h3>
            <p className="text-xs text-slate-400 mb-4">Custo total por safra + custo por hectare</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis dataKey="safra" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis yAxisId="custo" axisLine={false} tickLine={false} width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis yAxisId="ha" orientation="right" axisLine={false} tickLine={false} width={62}
                    tick={{ fill: '#475569', fontSize: 10 }}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === 'Custo Total' ? [fmtBRL(v), name] : [`R$ ${fmtNum(v)}/ha`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Bar yAxisId="custo" dataKey="custo" name="Custo Total" fill={COR_INSUMOS}
                    radius={[6, 6, 0, 0]} maxBarSize={64} />
                  <Line yAxisId="ha" dataKey="custoHa" name="Custo/ha"
                    type="monotone" stroke={COR_PROD_LINE} strokeWidth={2.5}
                    dot={{ fill: COR_PROD_LINE, r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COR_INSUMOS }} />
                <span className="text-slate-500 font-medium">Custo Total</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-6 h-0.5 rounded" style={{ backgroundColor: COR_PROD_LINE }} />
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

      {/* ── Linha 6: Tabela detalhada por cultura ───────────────────── */}
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
