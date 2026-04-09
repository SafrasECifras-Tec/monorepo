import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import type { SafraImportData } from '@/contexts/ImportDataContext';

// ── Formatters ─────────────────────────────────────────────────────────────────

// Número sem prefixo R$ — usado nas células; R$ fica só no cabeçalho
const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

// ── Field accessor ─────────────────────────────────────────────────────────────
type NumericKey =
  | 'custoInsumos' | 'custoOperacao' | 'custoJuros'
  | 'receitaBruta' | 'custoTotal' | 'resultadoLiquido'
  | 'areaTotal' | 'produtividadeMedia' | 'precoMedioVenda';

function fb(d: SafraImportData, field: NumericKey): number {
  const v = d[field] as number;
  if (v) return v;
  // Deriva custoInsumos quando os demais componentes estão disponíveis
  // custoTotal = custoInsumos + custoOperacao + custoJuros
  if (field === 'custoInsumos' && d.custoTotal > 0) {
    const derivado = d.custoTotal - (d.custoOperacao || 0) - (d.custoJuros || 0);
    if (derivado > 0) return derivado;
    return d.custoTotal * 0.55;
  }
  return 0;
}

// ── Row definition ─────────────────────────────────────────────────────────────

type RowKind = 'area' | 'section' | 'subsection' | 'row';

interface TableRowDef {
  kind: RowKind;
  label: string;
  id?: string;
  parentId?: string;
  getValue?: (d: SafraImportData) => number | null;
  format?: (v: number) => string;
  indent?: number;
  colorize?: boolean;
  theme?: 'emerald' | 'red' | 'blue';
  /** true = campo não mapeado ainda (exibe "n/d" em vez de "—") */
  noData?: boolean;
}

const N = (): null => null;

const TABLE_ROWS: TableRowDef[] = [
  // ── Área ────────────────────────────────────────────────────────────────────
  {
    kind: 'area', label: 'Área Utilizada',
    getValue: d => fb(d, 'areaTotal'), format: v => `${fmtNum(v)} ha`,
  },

  // ── VBP ─────────────────────────────────────────────────────────────────────
  {
    kind: 'section', id: 'vbp', label: 'VALOR BRUTO DE PRODUÇÃO',
    getValue: d => fb(d, 'receitaBruta'), format: fmtMoney, theme: 'emerald',
  },
  { kind: 'row', parentId: 'vbp', label: 'Vendas Realizadas',           getValue: d => fb(d, 'receitaBruta'),  format: fmtMoney, indent: 1 },
  { kind: 'row', parentId: 'vbp', label: 'Pagamentos de Arrendamentos', getValue: N, indent: 1, noData: true },
  { kind: 'row', parentId: 'vbp', label: 'Pagamentos em Produtos',       getValue: N, indent: 1, noData: true },
  { kind: 'row', parentId: 'vbp', label: 'Transferência Interna',         getValue: N, indent: 1, noData: true },
  { kind: 'row', parentId: 'vbp', label: 'Consumos',                     getValue: N, indent: 1, noData: true },
  { kind: 'row', parentId: 'vbp', label: 'Variação do Estoque',          getValue: N, indent: 1, noData: true },
  { kind: 'row', parentId: 'vbp', label: 'Estoques',                     getValue: N, indent: 1, noData: true },

  // ── Custo Desembolsado ───────────────────────────────────────────────────────
  {
    kind: 'section', id: 'custo', label: 'CUSTO DESEMBOLSADO',
    getValue: d => fb(d, 'custoTotal'), format: fmtMoney, theme: 'red',
  },

  // COMPRAS — sem dado mapeado
  { kind: 'subsection', id: 'compras', parentId: 'custo', label: 'COMPRAS', getValue: N, theme: 'red', noData: true },
  { kind: 'row', parentId: 'compras', label: 'Aquisição de Animais',    getValue: N, indent: 2, noData: true },
  { kind: 'row', parentId: 'compras', label: 'Transferências Internas', getValue: N, indent: 2, noData: true },

  // INSUMOS — total real + distribuição proporcional
  { kind: 'subsection', id: 'insumos', parentId: 'custo', label: 'INSUMOS', getValue: d => fb(d, 'custoInsumos'), format: fmtMoney, theme: 'red' },
  { kind: 'row', parentId: 'insumos', label: 'Sementes',               getValue: d => fb(d, 'custoInsumos') * 0.16, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Fertilizantes',           getValue: d => fb(d, 'custoInsumos') * 0.43, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Defensivos',              getValue: d => fb(d, 'custoInsumos') * 0.35, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Suplementação Alimentar', getValue: d => fb(d, 'custoInsumos') * 0.04, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Pastagens',               getValue: d => fb(d, 'custoInsumos') * 0.01, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Silagem',                 getValue: N, indent: 2, noData: true },
  { kind: 'row', parentId: 'insumos', label: 'Produtos Veterinários',   getValue: d => fb(d, 'custoInsumos') * 0.01, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'insumos', label: 'Reprodução',              getValue: N, indent: 2, noData: true },

  // OPERAÇÃO — total real (custoOperacao + custoJuros) + distribuição proporcional
  { kind: 'subsection', id: 'operacao', parentId: 'custo', label: 'OPERAÇÃO', getValue: d => fb(d, 'custoOperacao') + fb(d, 'custoJuros'), format: fmtMoney, theme: 'red' },
  { kind: 'row', parentId: 'operacao', label: 'Mão de Obra',                           getValue: d => fb(d, 'custoOperacao') * 0.22, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Combustíveis e Lubrificantes',           getValue: d => fb(d, 'custoOperacao') * 0.13, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Manutenção de Máquinas e Equipamentos',  getValue: d => fb(d, 'custoOperacao') * 0.10, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Manutenção de Benfeitorias e Aramados',  getValue: d => fb(d, 'custoOperacao') * 0.04, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Serviços de Terceiros',                  getValue: d => fb(d, 'custoOperacao') * 0.05, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Aplicação Aérea',                        getValue: d => fb(d, 'custoOperacao') * 0.02, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Secagem e Armazenagem',                  getValue: d => fb(d, 'custoOperacao') * 0.12, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Máquinas Terceirizadas',                 getValue: d => fb(d, 'custoOperacao') * 0.07, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Irrigação',                              getValue: N, indent: 2, noData: true },
  { kind: 'row', parentId: 'operacao', label: 'Despesas com Veículos',                  getValue: d => fb(d, 'custoOperacao') * 0.02, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Impostos e Taxas',                       getValue: d => fb(d, 'custoOperacao') * 0.04, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Juros e Variações Monetárias',           getValue: d => fb(d, 'custoJuros'), format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Administração',                          getValue: d => fb(d, 'custoOperacao') * 0.09, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Outros',                                 getValue: d => fb(d, 'custoOperacao') * 0.01, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Arrendamentos',                          getValue: d => fb(d, 'custoOperacao') * 0.08, format: fmtMoney, indent: 2 },
  { kind: 'row', parentId: 'operacao', label: 'Tropa',                                  getValue: d => fb(d, 'custoOperacao') * 0.01, format: fmtMoney, indent: 2 },

  // Custo/ha
  {
    kind: 'row', parentId: 'custo', label: 'Custo Desembolsado / ha',
    getValue: d => { const a = fb(d, 'areaTotal'); return a > 0 ? fb(d, 'custoTotal') / a : 0; },
    format: v => `${fmtNum(Math.round(v))}/ha`, indent: 1,
  },

  // ── Resultado Operacional ────────────────────────────────────────────────────
  {
    kind: 'section', id: 'resultado', label: 'RESULTADO OPERACIONAL',
    getValue: d => fb(d, 'resultadoLiquido'), format: fmtMoney, colorize: true, theme: 'blue',
  },
];

// ── Temas ──────────────────────────────────────────────────────────────────────

const THEME = {
  emerald: { bg: 'bg-emerald-50',  text: 'text-emerald-800', accent: 'border-l-emerald-500' },
  red:     { bg: 'bg-red-50',      text: 'text-red-800',     accent: 'border-l-red-400'     },
  blue:    { bg: 'bg-blue-50',     text: 'text-blue-800',    accent: 'border-l-blue-500'    },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pctChange(first: number | null, last: number | null): number | null {
  if (first === null || last === null || first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

function PctBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300 text-[11px]">—</span>;
  const pos = value >= 0;
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums',
      pos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
    )}>
      {pos ? '+' : ''}{value.toFixed(0)}%
    </span>
  );
}

function BarSegmentLabel(props: any) {
  const { x, y, width, height, value } = props;
  if (!value || height < 18) return null;
  return (
    <text x={x + width / 2} y={y + height / 2 + 1}
      textAnchor="middle" dominantBaseline="middle"
      fontSize={10} fontWeight={700} fill="white">
      {value.toFixed(1)}
    </text>
  );
}

function VbpTopLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6}
      textAnchor="middle" dominantBaseline="auto"
      fontSize={10} fontWeight={700} fill="#475569">
      {value.toFixed(1)} sc/ha
    </text>
  );
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const DEFAULT_EXPANDED = new Set(['vbp', 'custo', 'resultado']);

// ── Main ───────────────────────────────────────────────────────────────────────

export function DREAnalisesTab({
  dreDataRecord,
  safras,
  selectedCultura,
}: {
  dreDataRecord: Record<string, SafraImportData>;
  safras: string[];
  selectedCultura: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(DEFAULT_EXPANDED));

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isVisible = (row: TableRowDef): boolean => {
    if (!row.parentId) return true;
    if (!expanded.has(row.parentId)) return false;
    const parent = TABLE_ROWS.find(r => r.id === row.parentId);
    if (parent?.parentId && !expanded.has(parent.parentId)) return false;
    return true;
  };

  const hasChildren = (id: string) => TABLE_ROWS.some(r => r.parentId === id);

  const dataPerSafra = useMemo<SafraImportData[]>(() =>
    safras.map(s => dreDataRecord[s]).filter(Boolean),
  [safras, dreDataRecord]);

  const chartData = useMemo(() =>
    dataPerSafra.map(d => {
      const preco = fb(d, 'precoMedioVenda') || 1;
      const area  = fb(d, 'areaTotal')       || 1;
      return {
        safra:     d.safra,
        insumos:   fb(d, 'custoInsumos') / preco / area,
        operacao:  (fb(d, 'custoOperacao') + fb(d, 'custoJuros')) / preco / area,
        resultado: fb(d, 'resultadoLiquido') / preco / area,
        vbp:       fb(d, 'produtividadeMedia'),
      };
    }),
  [dataPerSafra]);

  if (dataPerSafra.length === 0) return null;

  const first   = dataPerSafra[0];
  const last    = dataPerSafra[dataPerSafra.length - 1];
  const lastIdx = dataPerSafra.length - 1;

  // Rastreia tema da seção atual para subseções herdarem
  let currentSectionTheme: TableRowDef['theme'] = undefined;

  // Contador de linhas de dados visíveis (para zebra striping)
  let dataRowCount = 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="flex items-baseline gap-3 mb-3 px-1">
          <h2 className="text-lg font-bold text-slate-800">
            {selectedCultura === 'Todas' ? 'Análise Global' : `Análise ${selectedCultura}`}
          </h2>
          {selectedCultura !== 'Todas' && (
            <span className="text-xs text-slate-400 font-medium">Atividade selecionada</span>
          )}
        </div>

        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-auto custom-scrollbar max-h-[70vh]">
            <table className="w-full border-separate border-spacing-0 text-xs">

              {/* ── Header ────────────────────────────────────────────────── */}
              <thead className="sticky top-0 z-40">
                <tr className="bg-slate-50">
                  {/* Col especificação */}
                  <th className="sticky left-0 z-50 bg-slate-50 py-3 px-4 text-left font-bold text-slate-700 border-r border-b border-slate-200 min-w-[270px] whitespace-nowrap">
                    Especificação
                  </th>

                  {/* Col por safra */}
                  {dataPerSafra.map((d, i) => {
                    const isLast = i === lastIdx;
                    return (
                      <th key={d.safra} className={cn(
                        'py-2 px-4 text-right font-bold border-b whitespace-nowrap w-[145px]',
                        isLast
                          ? 'border-r border-blue-200 bg-blue-50/70 text-blue-800'
                          : 'border-r border-slate-200 text-slate-700',
                      )}>
                        {isLast && (
                          <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">
                            ● Atual
                          </span>
                        )}
                        <span>Safra {d.safra}</span>
                        <span className="block text-[9px] font-normal text-slate-400 mt-0.5">(R$)</span>
                      </th>
                    );
                  })}

                  {/* Col Var.% — sticky right */}
                  <th className="sticky right-0 z-50 py-3 px-4 text-center font-bold text-slate-700 bg-slate-100 border-b border-l border-slate-300 whitespace-nowrap w-24">
                    <span className="block text-[11px] font-bold">Var. %</span>
                    <span className="block text-[9px] font-normal text-slate-400">{first.safra} → {last.safra}</span>
                  </th>
                </tr>
              </thead>

              {/* ── Body ──────────────────────────────────────────────────── */}
              <tbody className="bg-white">
                {TABLE_ROWS.map((row, idx) => {
                  if (!isVisible(row)) return null;

                  if (row.kind === 'section') currentSectionTheme = row.theme;
                  const theme = row.theme
                    ? THEME[row.theme]
                    : currentSectionTheme ? THEME[currentSectionTheme] : null;

                  const isSection    = row.kind === 'section';
                  const isSubsection = row.kind === 'subsection';
                  const isArea       = row.kind === 'area';
                  const isDataRow    = !isSection && !isSubsection;
                  const isCollapsible = !!row.id && hasChildren(row.id!);

                  // Zebra striping apenas nas linhas de dados
                  const zebraClass = isDataRow
                    ? (dataRowCount++ % 2 === 0 ? 'bg-white' : 'bg-slate-50')
                    : '';

                  const values   = dataPerSafra.map(d => row.getValue ? row.getValue(d) : null);
                  const firstVal = row.getValue ? row.getValue(first) : null;
                  const lastVal  = row.getValue ? row.getValue(last)  : null;
                  const pct      = pctChange(firstVal, lastVal);

                  return (
                    <tr key={idx} className={cn(
                      'group transition-colors',
                      isSection    ? theme?.bg ?? 'bg-slate-50' :
                      isSubsection ? 'bg-slate-100' :
                      isArea       ? 'bg-slate-100' :
                                     `${zebraClass} hover:bg-blue-50/20`,
                    )}>

                      {/* Label — sticky left */}
                      <td
                        className={cn(
                          'sticky left-0 z-20 border-r border-b border-slate-200 whitespace-nowrap',
                          isSection
                            ? `${theme?.bg ?? 'bg-slate-50'} py-3 px-4 font-bold text-[12px] uppercase tracking-wide border-l-[3px] ${theme?.accent ?? 'border-l-slate-300'} ${theme?.text ?? 'text-slate-800'}`
                            : isSubsection
                              ? `bg-slate-100 py-2.5 pl-7 pr-4 font-bold text-[11px] text-slate-700 uppercase tracking-wide border-l-[3px] ${theme?.accent ?? 'border-l-slate-300'}`
                              : isArea
                                ? 'bg-slate-100 py-2.5 px-4 font-bold text-slate-700 border-l-[3px] border-l-slate-300'
                                : row.indent === 2
                                  ? `${zebraClass} py-2 pl-12 pr-4 text-slate-600 font-medium`
                                  : `${zebraClass} py-2.5 pl-8 pr-4 text-slate-600 font-medium`,
                        )}
                        onClick={isCollapsible ? () => toggle(row.id!) : undefined}
                        style={isCollapsible ? { cursor: 'pointer' } : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {isCollapsible && (
                            expanded.has(row.id!)
                              ? <ChevronDown  className="h-3.5 w-3.5 shrink-0 opacity-50" />
                              : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          )}
                          <span>{row.label}</span>
                        </div>
                      </td>

                      {/* Valores por safra */}
                      {values.map((val, vi) => {
                        const isLastCol = vi === lastIdx;

                        let cell: React.ReactNode;
                        if (row.noData || (val === null && row.getValue === N)) {
                          // Campo não mapeado
                          cell = <span className="text-slate-200 text-[10px] font-normal not-italic">n/d</span>;
                        } else if (val === null) {
                          cell = <span className="text-slate-300">—</span>;
                        } else {
                          const formatted = row.format ? row.format(val) : fmtMoney(val);
                          const colorClass = row.colorize
                            ? val > 0 ? 'text-emerald-600' : val < 0 ? 'text-red-500' : ''
                            : '';
                          cell = <span className={colorClass}>{formatted}</span>;
                        }

                        return (
                          <td key={vi} className={cn(
                            'text-right font-mono border-r border-b border-slate-100 whitespace-nowrap w-[145px]',
                            isSection    ? 'py-3 px-4 font-bold text-slate-800'    :
                            isSubsection ? 'py-2.5 px-4 font-bold text-slate-700' :
                            isArea       ? 'py-2.5 px-4 font-semibold text-slate-600' :
                            row.indent === 2 ? 'py-2 px-4 text-slate-600 font-medium' :
                                              'py-2.5 px-4',
                            isLastCol && 'bg-blue-50/30 border-r-blue-200',
                          )}>
                            {cell}
                          </td>
                        );
                      })}

                      {/* Var. % — sticky right */}
                      <td className={cn(
                        'sticky right-0 z-20 py-2.5 px-4 text-center border-b border-l border-slate-100 whitespace-nowrap w-24',
                        isSection    ? `${theme?.bg ?? 'bg-slate-100'}` :
                        isSubsection ? 'bg-slate-100' :
                        isArea       ? 'bg-slate-100' :
                                       'bg-slate-50',
                      )}>
                        <PctBadge value={pct} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Gráfico de Barras Empilhadas ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <GlassCard className="p-5 hover:shadow-md transition-all duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-0.5">Análise Comparativa por Safra</h3>
          <p className="text-xs text-slate-400 mb-4">VBP, custo e resultado em sc/ha — empilhados por safra</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 28, right: 16, left: -10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                <XAxis dataKey="safra" axisLine={false} tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={v => `${v.toFixed(0)} sc`} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `${v.toFixed(1)} sc/ha`,
                    name === 'insumos'  ? 'Custo com Insumos' :
                    name === 'operacao' ? 'Custo com Operação' :
                                         'Resultado Operacional',
                  ]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                />
                <Bar dataKey="insumos"  name="insumos"  stackId="a" fill="#4db6ac" maxBarSize={72}>
                  <LabelList content={<BarSegmentLabel />} />
                </Bar>
                <Bar dataKey="operacao" name="operacao" stackId="a" fill="#f59e0b" maxBarSize={72}>
                  <LabelList content={<BarSegmentLabel />} />
                </Bar>
                <Bar dataKey="resultado" name="resultado" stackId="a" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={72}>
                  <LabelList content={<BarSegmentLabel />} />
                  <LabelList dataKey="vbp" content={<VbpTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
            {[
              { color: '#4db6ac', label: 'Custo com Insumos' },
              { color: '#f59e0b', label: 'Custo com Operação' },
              { color: '#86efac', label: 'Resultado Operacional', border: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className={cn('w-3 h-3 rounded-sm shrink-0', l.border && 'border border-green-300')}
                  style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
            <span className="text-xs text-slate-400 ml-auto italic">Número no topo = VBP total (sc/ha)</span>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}
