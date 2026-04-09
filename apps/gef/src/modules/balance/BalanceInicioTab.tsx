import React, { useMemo } from 'react';
import { GlassCard } from '@socios/ui';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Calendar,
  Home,
  Scale,
  DollarSign,
  Wallet,
  Hourglass
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { BalanceTableRow } from '@/contexts/ImportDataContext';

interface BalanceInicioTabProps {
  ativo: BalanceTableRow[];
  passivo: BalanceTableRow[];
  columns: string[];
  selectedColumn: string;
}

const PIE_COLORS = ['#2563eb', '#f4af2d', '#475569', '#0ea5e9', '#b45309', '#0f766e', '#dc2626', '#059669'];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function findRootGroup(roots: BalanceTableRow[], include: string[], exclude: string[] = []): BalanceTableRow | undefined {
  return roots.find(r => {
    const n = norm(r.name);
    return include.every(k => n.includes(k)) && exclude.every(k => !n.includes(k));
  });
}

function groupTotal(group: BalanceTableRow | undefined, colIndex: number): number {
  if (!group) return 0;
  return group.values[colIndex] ?? 0;
}

const formatCurrency = (value: number, currencyMode: 'BRL' | 'SOJA' = 'BRL', isMi = false) => {
  if (value === 0) return <span className="text-[#B0B0B0]">-</span>;
  if (currencyMode === 'BRL') {
    if (isMi) return `R$ ${(value / 1000000).toFixed(1)} Mi`;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  } else {
    const bags = value / 120;
    if (isMi) return `${(bags / 1000000).toFixed(1)} Mi sc`;
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(bags) + ' sc';
  }
};

const PercentChange = ({ prev, curr }: { prev: number; curr: number }) => {
  if (prev === 0 || curr === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const isUp = pct > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;
  const color = isUp ? 'text-emerald-500' : 'text-red-500';
  return (
    <div className={`flex items-center gap-0.5 ${color} text-xs font-semibold`}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(pct).toFixed(1)}%</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 min-w-[200px] z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
        <span className="font-semibold text-slate-700">{data.name}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center gap-4">
          <span className="text-sm text-slate-500">Valor:</span>
          <span className="text-sm font-medium text-slate-900">{formatCurrency(data.value, 'BRL', false)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-sm text-slate-500">Participação:</span>
          <span className="text-sm font-medium text-slate-900">{percentage}%</span>
        </div>
      </div>
    </motion.div>
  );
};

const PieSection = ({
  title,
  icon: Icon,
  total,
  prevTotal,
  data,
  hovered,
  setHovered,
  currencyMode,
}: {
  title: string;
  icon: React.ElementType;
  total: number;
  prevTotal: number;
  data: { name: string; value: number; color: string }[];
  hovered: string | null;
  setHovered: (v: string | null) => void;
  currencyMode: 'BRL' | 'SOJA';
}) => (
  <GlassCard className="p-4 md:p-6 flex flex-col hover:shadow-md transition-all duration-300 border-slate-200/60 min-h-[280px]">
    <div className="flex items-center gap-2 mb-6">
      <Icon className="h-6 w-6 text-slate-800" />
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>

    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-6 mt-auto">
      <div className="flex flex-col items-start xl:w-1/3 shrink-0">
        <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
          {formatCurrency(total, currencyMode)}
        </span>
        {prevTotal > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
            <PercentChange prev={prevTotal} curr={total} />
            <span>em relação à coluna anterior</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 w-full xl:flex-1 justify-start xl:justify-center pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-200">
        <div className="w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                onMouseEnter={(d) => setHovered(d.name)}
                onMouseLeave={() => setHovered(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      opacity: hovered === null || hovered === entry.name ? 1 : 0.3,
                      filter: hovered === entry.name ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))' : 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip total={total} />}
                cursor={{ fill: 'transparent' }}
                position={{ x: -180, y: 10 }}
                wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          {data.map(entry => (
            <div
              key={entry.name}
              className={`flex flex-col cursor-pointer transition-opacity duration-200 ${hovered === null || hovered === entry.name ? 'opacity-100' : 'opacity-40'}`}
              onMouseEnter={() => setHovered(entry.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                <span className={`text-xs transition-colors duration-200 ${hovered === entry.name ? 'font-bold text-slate-800' : 'font-medium text-slate-500'} leading-none`}>
                  {entry.name.length > 20 ? entry.name.slice(0, 18) + '…' : entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(entry.value, currencyMode, true)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </GlassCard>
);

export function BalanceInicioTab({ ativo, passivo, columns, selectedColumn }: BalanceInicioTabProps) {
  const currencyMode = 'BRL';

  const [hoveredAC,  setHoveredAC]  = React.useState<string | null>(null);
  const [hoveredPC,  setHoveredPC]  = React.useState<string | null>(null);
  const [hoveredANC, setHoveredANC] = React.useState<string | null>(null);
  const [hoveredPNC, setHoveredPNC] = React.useState<string | null>(null);

  const colIndex = useMemo(() => {
    const i = columns.indexOf(selectedColumn);
    return i >= 0 ? i : Math.max(0, columns.length - 1);
  }, [columns, selectedColumn]);

  const prevColIndex = colIndex > 0 ? colIndex - 1 : -1;

  // ─── Find main groups ─────────────────────────────────────────────────────────
  const acGroup  = useMemo(() => findRootGroup(ativo,   ['circulante'], ['nao']),        [ativo]);
  const ancGroup = useMemo(() => findRootGroup(ativo,   ['circulante', 'nao']),           [ativo]);
  const pcGroup  = useMemo(() => findRootGroup(passivo, ['circulante'], ['nao', 'patrimoni']), [passivo]);
  const pncGroup = useMemo(() => findRootGroup(passivo, ['circulante', 'nao']),           [passivo]);
  const plGroup  = useMemo(() => findRootGroup(passivo, ['patrimoni']),                   [passivo]);

  // ─── Totals ───────────────────────────────────────────────────────────────────
  const totalAtivo   = useMemo(() => ativo.reduce((s, r)   => s + (r.values[colIndex]  ?? 0), 0), [ativo, colIndex]);
  const totalPassivo = useMemo(() => passivo.reduce((s, r) => s + (r.values[colIndex]  ?? 0), 0), [passivo, colIndex]);
  const totalPL      = useMemo(() => groupTotal(plGroup, colIndex) || (totalAtivo - totalPassivo), [plGroup, colIndex, totalAtivo, totalPassivo]);

  const prevAtivo    = useMemo(() => prevColIndex >= 0 ? ativo.reduce((s, r)   => s + (r.values[prevColIndex] ?? 0), 0) : 0, [ativo, prevColIndex]);
  const prevPassivo  = useMemo(() => prevColIndex >= 0 ? passivo.reduce((s, r) => s + (r.values[prevColIndex] ?? 0), 0) : 0, [passivo, prevColIndex]);
  const prevPL       = useMemo(() => prevColIndex >= 0 ? (groupTotal(plGroup, prevColIndex) || (prevAtivo - prevPassivo)) : 0, [plGroup, prevColIndex, prevAtivo, prevPassivo]);

  const acTotal  = useMemo(() => groupTotal(acGroup,  colIndex), [acGroup,  colIndex]);
  const ancTotal = useMemo(() => groupTotal(ancGroup, colIndex), [ancGroup, colIndex]);
  const pcTotal  = useMemo(() => groupTotal(pcGroup,  colIndex), [pcGroup,  colIndex]);
  const pncTotal = useMemo(() => groupTotal(pncGroup, colIndex), [pncGroup, colIndex]);

  const prevAC  = useMemo(() => prevColIndex >= 0 ? groupTotal(acGroup,  prevColIndex) : 0, [acGroup,  prevColIndex]);
  const prevANC = useMemo(() => prevColIndex >= 0 ? groupTotal(ancGroup, prevColIndex) : 0, [ancGroup, prevColIndex]);
  const prevPC  = useMemo(() => prevColIndex >= 0 ? groupTotal(pcGroup,  prevColIndex) : 0, [pcGroup,  prevColIndex]);
  const prevPNC = useMemo(() => prevColIndex >= 0 ? groupTotal(pncGroup, prevColIndex) : 0, [pncGroup, prevColIndex]);

  // ─── Pie data from children ───────────────────────────────────────────────────
  const toPieData = (group: BalanceTableRow | undefined, ci: number) => {
    if (!group) return [];
    const children = group.children?.filter(c => (c.values[ci] ?? 0) !== 0) ?? [];
    if (children.length === 0 && (group.values[ci] ?? 0) > 0) {
      return [{ name: group.name, value: group.values[ci] ?? 0, color: PIE_COLORS[0] }];
    }
    return children.map((c, i) => ({
      name:  c.name,
      value: c.values[ci] ?? 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  };

  const dataAC  = useMemo(() => toPieData(acGroup,  colIndex), [acGroup,  colIndex]);
  const dataPC  = useMemo(() => toPieData(pcGroup,  colIndex), [pcGroup,  colIndex]);
  const dataANC = useMemo(() => toPieData(ancGroup, colIndex), [ancGroup, colIndex]);
  const dataPNC = useMemo(() => toPieData(pncGroup, colIndex), [pncGroup, colIndex]);

  return (
    <motion.div
      className="flex flex-col flex-1 min-h-0 gap-4 pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Ativo */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all overflow-hidden"></div>
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-6 w-6 text-slate-800" />
            <span className="text-slate-800 font-semibold text-lg">Ativo</span>
          </div>
          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(totalAtivo, currencyMode)}
            </span>
            {prevAtivo > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                <PercentChange prev={prevAtivo} curr={totalAtivo} />
                <span>em relação à coluna anterior</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Passivo */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all overflow-hidden"></div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-6 w-6 text-slate-800" />
            <span className="text-slate-800 font-semibold text-lg">Passivo</span>
          </div>
          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(totalPassivo, currencyMode)}
            </span>
            {prevPassivo > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                <PercentChange prev={prevPassivo} curr={totalPassivo} />
                <span>em relação à coluna anterior</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Patrimônio Líquido */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all overflow-hidden"></div>
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-6 w-6 text-slate-800" />
            <span className="text-slate-800 font-semibold text-lg">Patrimônio Líquido</span>
          </div>
          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(totalPL, currencyMode)}
            </span>
            {prevPL > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                <PercentChange prev={prevPL} curr={totalPL} />
                <span>em relação à coluna anterior</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Pie Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <PieSection
          title="Ativo Circulante"
          icon={DollarSign}
          total={acTotal}
          prevTotal={prevAC}
          data={dataAC}
          hovered={hoveredAC}
          setHovered={setHoveredAC}
          currencyMode={currencyMode}
        />
        <PieSection
          title="Passivo Circulante"
          icon={Calendar}
          total={pcTotal}
          prevTotal={prevPC}
          data={dataPC}
          hovered={hoveredPC}
          setHovered={setHoveredPC}
          currencyMode={currencyMode}
        />
        <PieSection
          title="Ativo Não Circulante"
          icon={Home}
          total={ancTotal}
          prevTotal={prevANC}
          data={dataANC}
          hovered={hoveredANC}
          setHovered={setHoveredANC}
          currencyMode={currencyMode}
        />
        <PieSection
          title="Passivo Não Circulante"
          icon={Hourglass}
          total={pncTotal}
          prevTotal={prevPNC}
          data={dataPNC}
          hovered={hoveredPNC}
          setHovered={setHoveredPNC}
          currencyMode={currencyMode}
        />
      </div>
    </motion.div>
  );
}
