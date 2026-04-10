import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Target } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Legend,
} from 'recharts';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import type { SafraImportData } from '@/contexts/ImportDataContext';

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);

const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    : `R$ ${(v / 1_000).toFixed(0)}k`;

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

const fmtPrecoSc = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /sc`;

const fmtQtd = (v: number) => `${fmtNum(Math.round(v))} Sacas`;

// Sem unidade — para uso nas células da tabela (unidade fica no cabeçalho)
const fmtQtdNum  = (v: number) => fmtNum(Math.round(v));
const fmtPrecoNum = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBRLNum  = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

// ── Paleta ────────────────────────────────────────────────────────────────────

const CULTURA_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#475569', '#f43f5e'];

// ── BulletBar ─────────────────────────────────────────────────────────────────

function BulletBar({ label, realizado, orcado, delay = 0 }: {
  label: string; realizado: number; orcado: number; delay?: number;
}) {
  const rawPct   = orcado > 0 ? (realizado / orcado) * 100 : 0;
  const barColor = rawPct >= 100 ? '#10b981' : rawPct >= 90 ? '#f59e0b' : '#ef4444';
  const statusTx = rawPct >= 100 ? 'Meta batida ✓' : rawPct >= 90 ? 'Próximo da meta' : 'Abaixo da meta';

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
        <motion.div className="absolute top-0 left-0 h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(rawPct, 100)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }} />
      </div>
      <span className="text-[10px] text-slate-400">{statusTx}</span>
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
      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60">
      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <span className="w-5 text-center shrink-0">{icon}</span>{label}
      </div>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </motion.div>
  );
}

// ── Médias fictícias S&C ──────────────────────────────────────────────────────
// Substituir por dados reais quando disponíveis
const SC_MEDIAS = {
  vbpTotal:          18_200_000,
  vbpPorHa:           3_150,
  precoMedio:          104.80,
  produtividadeMedia:   63.5,   // sc/ha — média S&C
};

// ── VbpKpiCard ────────────────────────────────────────────────────────────────

function VbpKpiCard({ label, value, sub, trendPct, trendLabel, scMedia, scMediaLabel, delay = 0 }: {
  label: string;
  value: string;
  sub?: string;
  trendPct?: number | null;
  trendLabel?: string;
  scMedia?: string;
  scMediaLabel?: string;
  delay?: number;
}) {
  const up   = trendPct != null && trendPct > 0;
  const down = trendPct != null && trendPct < 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="group p-5 flex flex-col justify-center gap-2 hover:shadow-md transition-all duration-300 h-full">
        <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[26px] font-black text-slate-800 leading-tight">{value}</span>
          {sub && (
            <span className="text-[11px] font-medium bg-slate-800 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {sub}
            </span>
          )}
        </div>

        {scMedia && (
          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] text-slate-500">{scMediaLabel ?? 'Média S&C'}: <span className="font-semibold text-slate-700">{scMedia}</span></span>
            {trendPct != null && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                up   ? 'bg-[#10b981]/10 text-[#10b981]'
                     : down ? 'bg-red-100 text-red-600'
                             : 'bg-slate-100 text-slate-500',
              )}>
                {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

// ── ComercializacaoTable ──────────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SubItem { nome: string; quantidade: number; preco: number; total: number }
interface Secao {
  id: string;
  label: string;
  quantidade: number;
  preco: number;
  total: number;
  bg: string;
  text: string;
  accent: string;
  itens: SubItem[];
}

// ── SectionRow ────────────────────────────────────────────────────────────────

function SectionRow({ secao, isExpanded, onToggle }: {
  secao: Secao; isExpanded: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr className={cn(secao.bg, 'cursor-pointer')} onClick={onToggle}>
        <td className={cn(
          'sticky left-0 z-20 py-3 px-4 font-bold border-l-[3px] border-r border-b border-slate-200 whitespace-nowrap',
          secao.bg, secao.text, secao.accent,
        )}>
          <div className="flex items-center gap-1.5">
            {isExpanded
              ? <ChevronDown  className="h-3.5 w-3.5 shrink-0 opacity-50" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
            <span>{secao.label}</span>
          </div>
        </td>
        <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', secao.text)}>
          {fmtQtdNum(secao.quantidade)}
        </td>
        <td className={cn('py-3 px-4 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap', secao.text)}>
          {fmtPrecoNum(secao.preco)}
        </td>
        <td className={cn('py-3 px-4 text-right font-bold border-b border-slate-100 font-mono whitespace-nowrap', secao.text)}>
          {fmtBRLNum(secao.total)}
        </td>
      </tr>

      {isExpanded && secao.itens.map((item, i) => (
        <tr key={item.nome} className={cn(
          'transition-colors hover:bg-blue-50/20',
          i % 2 === 0 ? 'bg-white' : 'bg-slate-50',
        )}>
          <td className={cn(
            'sticky left-0 z-20 py-2.5 pl-8 pr-4 text-slate-600 font-medium border-r border-b border-slate-100 whitespace-nowrap',
            i % 2 === 0 ? 'bg-white' : 'bg-slate-50',
          )}>
            {item.nome}
          </td>
          <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-r border-b border-slate-100 font-mono whitespace-nowrap">
            {fmtQtdNum(item.quantidade)}
          </td>
          <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-r border-b border-slate-100 font-mono whitespace-nowrap">
            {fmtPrecoNum(item.preco)}
          </td>
          <td className="py-2.5 px-4 text-right text-slate-600 font-medium border-b border-slate-100 font-mono whitespace-nowrap">
            {fmtBRLNum(item.total)}
          </td>
        </tr>
      ))}
    </>
  );
}

// ── ComercializacaoTable ──────────────────────────────────────────────────────

function ComercializacaoTable({ data }: { data: SafraImportData }) {
  const [expanded, setExpanded] = useState(new Set<string>(['vendas', 'pagamentos']));

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const culturaSorted = useMemo(() =>
    [...data.culturas].sort((a, b) => b.receitaBruta - a.receitaBruta),
    [data]);

  // ── Dados fictícios — substituir por dados reais quando disponíveis ──────
  const secoes: Secao[] = useMemo(() => {
    const p = data.precoMedioVenda;
    return [
      {
        id: 'vendas',
        label: 'Vendas Realizadas',
        quantidade: data.producaoTotal,
        preco: data.precoMedioVenda,
        total: data.receitaBruta,
        bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-300',
        itens: culturaSorted.map(c => ({ nome: c.nome, quantidade: c.producao, preco: c.precoMedio, total: c.receitaBruta })),
      },
      {
        id: 'pagamentos',
        label: 'Pagamentos Fazenda',
        quantidade: 67_822,
        preco: 109.43,
        total: 7_421_968,
        bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-300',
        itens: [
          { nome: 'Cooperativa Centro-Oeste', quantidade: 10_000, preco: 109.74, total: 1_097_424 },
          { nome: 'Cerealista Planalto',     quantidade: 57_822, preco: 109.38, total: 6_324_544 },
        ],
      },
      {
        id: 'arrendamentos',
        label: 'Arrendamentos',
        quantidade: 12_500,
        preco: 8.50,
        total: 106_250,
        bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-300',
        itens: [
          { nome: 'Fazenda Santa Fé',  quantidade: 5_000, preco: 8.50, total: 42_500 },
          { nome: 'Fazenda São João',  quantidade: 4_500, preco: 8.50, total: 38_250 },
          { nome: 'Fazenda Boa Vista', quantidade: 3_000, preco: 8.50, total: 25_500 },
        ],
      },
      {
        id: 'estoque',
        label: 'Estoque',
        quantidade: 6_800,
        preco: p,
        total: 6_800 * p,
        bg: 'bg-slate-100', text: 'text-slate-700', accent: 'border-l-slate-300',
        itens: culturaSorted.map(c => {
          const qtd = Math.round(6_800 * (c.receitaBruta / data.receitaBruta));
          return { nome: c.nome, quantidade: qtd, preco: c.precoMedio, total: qtd * c.precoMedio };
        }),
      },
    ];
  }, [data, culturaSorted]);

  const totalQtd   = secoes.reduce((s, sec) => s + sec.quantidade, 0);
  const totalValor = secoes.reduce((s, sec) => s + sec.total, 0);
  const totalPreco = totalQtd > 0 ? totalValor / totalQtd : 0;

  const thCell = 'py-3 px-4 text-right font-bold text-white border-r border-slate-600 whitespace-nowrap w-[160px]';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="h-full">
      <GlassCard className="flex flex-col overflow-hidden p-0 hover:shadow-md transition-all duration-300 h-[480px]">

        {/* ── Title bar ── */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-700">Comercialização</h3>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-0 text-xs">

            {/* ── Header ── */}
            <thead className="sticky top-0 z-40">
              <tr className="bg-white text-slate-600">
                <th className="sticky left-0 z-50 bg-white py-3 px-4 text-left font-bold border-r border-b border-slate-200 min-w-[220px] whitespace-nowrap">
                  Tipo de Contrato
                </th>
                <th className="py-3 px-4 text-right font-bold border-r border-b border-slate-200 whitespace-nowrap w-[140px]">Qtd. (sc)</th>
                <th className="py-3 px-4 text-right font-bold border-r border-b border-slate-200 whitespace-nowrap w-[140px]">Preço Médio (R$/sc)</th>
                <th className="py-3 px-4 text-right font-bold border-b border-slate-200 whitespace-nowrap w-[160px]">Total (R$)</th>
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody className="bg-white">
              {secoes.map(sec => (
                <SectionRow
                  key={sec.id}
                  secao={sec}
                  isExpanded={expanded.has(sec.id)}
                  onToggle={() => toggle(sec.id)}
                />
              ))}
            </tbody>

            {/* ── Footer sticky dentro da tabela ── */}
            <tfoot className="sticky bottom-0 z-40 shadow-[0_-2px_0_0_#cbd5e1]">
              <tr className="font-bold text-slate-700 text-sm">
                <td className="sticky left-0 z-50 bg-white py-3.5 px-4 text-left whitespace-nowrap border-r border-slate-200 min-w-[220px] font-bold">Total</td>
                <td className="bg-white py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap w-[140px] border-l border-slate-100">
                  {fmtQtdNum(totalQtd)}
                </td>
                <td className="bg-white py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap w-[140px] border-l border-slate-100">
                  {fmtPrecoNum(totalPreco)}
                </td>
                <td className="bg-white py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap border-l border-slate-100">
                  {fmtBRLNum(totalValor)}
                </td>
              </tr>
            </tfoot>

          </table>
        </div>

      </GlassCard>
    </motion.div>
  );
}

// ── HistoricoVBPChart ─────────────────────────────────────────────────────────

function HistoricoVBPChart({ dreDataRecord, safras, safraAtual }: {
  dreDataRecord: Record<string, SafraImportData>;
  safras: string[];
  safraAtual: string;
}) {
  const chartData = useMemo(() =>
    safras.map(s => ({
      safra: s,
      vbp: dreDataRecord[s]?.receitaBruta ?? 0,
      atual: s === safraAtual,
    })),
    [safras, dreDataRecord, safraAtual]);

  const media = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.vbp, 0);
    return chartData.length > 0 ? total / chartData.length : 0;
  }, [chartData]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.atual) return <circle key={payload.safra} cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={2} />;
    return <circle key={payload.safra} cx={cx} cy={cy} r={7} fill="#10b981" stroke="white" strokeWidth={2.5} />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <GlassCard className="p-5 h-[460px] hover:shadow-md transition-all duration-300 flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 mb-0.5">Histórico VBP</h3>
        <p className="text-xs text-slate-400 mb-4">Valor Bruto de Produção por safra com linha de média</p>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
              <XAxis
                dataKey="safra"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={72}
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(v: number) => [fmtBRL(v), 'VBP']}
                labelFormatter={(label: string) => `Safra ${label}`}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              />
              <ReferenceLine
                y={media}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Média ${fmtCompact(media)}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Line
                type="monotone"
                dataKey="vbp"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={<CustomDot />}
                activeDot={{ r: 7, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-4 h-0.5 rounded bg-[#10b981]" />
            VBP por safra
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#f59e0b]" />
            Média do período
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-auto">
            <span className="w-3 h-3 rounded-full bg-[#10b981] ring-2 ring-white ring-offset-1" />
            Safra atual
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Component ────────────────────────────────────────────────────────────
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

  const vbpPorHa   = data.areaTotal > 0 ? data.receitaBruta / data.areaTotal : 0;
  const orcadoPct  = data.orcadoVbp > 0 ? (data.receitaBruta / data.orcadoVbp) * 100 : 0;
  const orcadoDiff = data.receitaBruta - data.orcadoVbp;

  const vsScVbp    = SC_MEDIAS.vbpTotal  > 0 ? ((data.receitaBruta    - SC_MEDIAS.vbpTotal)  / SC_MEDIAS.vbpTotal)  * 100 : null;
  const vsScVbpHa  = SC_MEDIAS.vbpPorHa  > 0 ? ((vbpPorHa             - SC_MEDIAS.vbpPorHa)  / SC_MEDIAS.vbpPorHa)  * 100 : null;
  const vsScPreco  = SC_MEDIAS.precoMedio > 0 ? ((data.precoMedioVenda - SC_MEDIAS.precoMedio) / SC_MEDIAS.precoMedio) * 100 : null;

  // Barras — Receita vs Custo vs Lucro por cultura (deduplicado por nome)
  const barCulturaData = useMemo(() => {
    if (data.culturas.length > 0) {
      const seen = new Map<string, { nome: string; Receita: number; Custo: number; Lucro: number }>();
      data.culturas.forEach(c => {
        if (seen.has(c.nome)) {
          const prev = seen.get(c.nome)!;
          seen.set(c.nome, {
            ...prev,
            Receita: prev.Receita + c.receitaBruta,
            Custo:   prev.Custo   + c.custoTotal,
            Lucro:   prev.Lucro   + (c.receitaBruta - c.custoTotal),
          });
        } else {
          seen.set(c.nome, {
            nome:    c.nome,
            Receita: c.receitaBruta,
            Custo:   c.custoTotal,
            Lucro:   c.receitaBruta - c.custoTotal,
          });
        }
      });
      return Array.from(seen.values()).map(r => ({
        ...r,
        margem: r.Receita > 0 ? (r.Lucro / r.Receita) * 100 : 0,
      }));
    }
    // fallback: linha única com totais da safra
    return [{
      nome:    data.atividade ?? 'Total',
      Receita: data.receitaBruta,
      Custo:   data.custoTotal,
      Lucro:   data.lucroBruto,
      margem:  data.margemBruta,
    }];
  }, [data]);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Linha 1: 4 KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <VbpKpiCard
          label="VBP Total"
          value={fmtCompact(data.receitaBruta)}
          sub={fmtBRL(data.receitaBruta)}
          trendPct={vsScVbp}
          trendLabel="vs média S&C"
          scMedia={fmtCompact(SC_MEDIAS.vbpTotal)}
          delay={0}
        />
        <VbpKpiCard
          label="VBP por Ha"
          value={`R$ ${fmtNum(Math.round(vbpPorHa))}/ha`}
          trendPct={vsScVbpHa}
          trendLabel="vs média S&C"
          scMedia={`R$ ${fmtNum(SC_MEDIAS.vbpPorHa)}/ha`}
          delay={0.05}
        />
        <VbpKpiCard
          label="Preço Médio"
          value={fmtPrecoSc(data.precoMedioVenda)}
          trendPct={vsScPreco}
          trendLabel="vs média S&C"
          scMedia={fmtPrecoSc(SC_MEDIAS.precoMedio)}
          delay={0.1}
        />
        <VbpKpiCard
          label="Orçado vs Realizado"
          value={`${orcadoPct.toFixed(1)}%`}
          trendPct={null}
          scMedia={`Orçado: ${fmtCompact(data.orcadoVbp)} · ${orcadoDiff >= 0 ? '+' : ''}${fmtCompact(orcadoDiff)}`}
          scMediaLabel={orcadoDiff >= 0 ? '✓ Meta' : '✗ Meta'}
          delay={0.15}
        />
      </div>

      {/* ── Grid 2 colunas ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Linha 1, Col 1 — Comercialização 60% */}
        <div className="lg:col-span-3">
          <ComercializacaoTable data={data} />
        </div>

        {/* Linha 1, Col 2 — Receita vs Custo vs Lucro por Cultura */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5 h-[480px] hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="shrink-0 mb-1">
              <h3 className="text-sm font-bold text-slate-700">Receita vs Custo por Cultura</h3>
              <p className="text-xs text-slate-400">Comparativo financeiro entre atividades da safra</p>
            </div>

            {/* Gráfico barras agrupadas */}
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barCulturaData}
                  margin={{ top: 16, right: 8, left: 8, bottom: 8 }}
                  barCategoryGap="28%"
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                  <XAxis
                    dataKey="nome"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={68}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={v => `R$ ${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmtBRL(v), name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Bar dataKey="Receita"  fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Custo"    fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lucro"    fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela resumo */}
            {barCulturaData.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 pt-3 mt-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="text-left pb-2">Cultura</th>
                      <th className="text-right pb-2">Receita</th>
                      <th className="text-right pb-2">Custo</th>
                      <th className="text-right pb-2 text-[#10b981]">Lucro</th>
                      <th className="text-right pb-2">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {barCulturaData.map((row, i) => (
                      <tr key={row.nome} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CULTURA_COLORS[i % CULTURA_COLORS.length] }} />
                            <span className="font-semibold text-slate-700">{row.nome}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right text-slate-600 font-mono">{fmtCompact(row.Receita)}</td>
                        <td className="py-2 text-right text-slate-600 font-mono">{fmtCompact(row.Custo)}</td>
                        <td className="py-2 text-right font-bold text-[#10b981] font-mono">{fmtCompact(row.Lucro)}</td>
                        <td className="py-2 text-right">
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            row.margem >= 20 ? 'bg-[#10b981]/10 text-[#10b981]'
                            : row.margem >= 10 ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                            : 'bg-red-100 text-red-600',
                          )}>
                            {row.margem.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Linha 2, Col 1 — Histórico VBP 60% */}
        <div className="lg:col-span-3">
          <HistoricoVBPChart dreDataRecord={dreDataRecord} safras={safras} safraAtual={safraAtual} />
        </div>

        {/* Linha 2, Col 2 — VBP Orçado vs. Realizado 40% */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <GlassCard className="p-5 h-[460px] hover:shadow-md transition-all duration-300 flex flex-col gap-3">
            <div className="shrink-0">
              <h3 className="text-sm font-bold text-slate-700 mb-0.5">VBP — Orçado vs. Realizado</h3>
              <p className="text-xs text-slate-400">Meta de receita bruta planejada</p>
            </div>
            <BulletBar label="VBP Total" realizado={data.receitaBruta} orcado={data.orcadoVbp} delay={0.2} />
            <div className="border-t border-slate-100" />
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Indicadores de Produção</h4>
            <div className="flex flex-col gap-1.5">
              <MetricRow icon="📐" label="Área Plantada"    value={`${fmtNum(data.areaTotal)} ha`} delay={0.25} />

              {/* Produtividade vs média S&C */}
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.28 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="w-5 text-center shrink-0">↗</span>Produtividade
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{data.produtividadeMedia.toFixed(1)} sc/ha</span>
                  {(() => {
                    const delta = data.produtividadeMedia - SC_MEDIAS.produtividadeMedia;
                    const pct   = (delta / SC_MEDIAS.produtividadeMedia) * 100;
                    const color = delta >= 0 ? '#10b981' : '#ef4444';
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}18`, color }}>
                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}% S&C
                      </span>
                    );
                  })()}
                </div>
              </motion.div>

              <MetricRow icon="="  label="Produção Total"    value={`${fmtNum(data.producaoTotal)} sc`} delay={0.31} />
              <MetricRow icon="🛒" label="Qtd. Vendida"      value={`${fmtNum(data.producaoTotal)} sc`} delay={0.34} />
              <MetricRow icon="📦" label="Estoque"           value={`${fmtNum(6_800)} sc`} delay={0.37} />

              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.40 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
                <div className="flex items-center gap-2 text-xs text-[#10b981] font-bold">
                  <Target className="h-3.5 w-3.5" />VBP Total
                </div>
                <span className="text-sm font-black text-[#10b981]">{fmtCompact(data.receitaBruta)}</span>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>

      </div>

    </div>
  );
}
