import React, { useState } from 'react';
import { GlassCard } from '@socios/ui';
import type { BalanceTableRow } from '@/contexts/ImportDataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Hourglass, Maximize2, Minimize2, Briefcase, ArrowDown, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMi = (value: number) => {
  return `${(value / 1000000).toFixed(1).replace('.', ',')} Mi`;
};

const DEFAULT_COLUMNS: string[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normName = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function findGroup(roots: TableRow[], include: string[], exclude: string[] = []): TableRow | undefined {
  return roots.find(r => {
    const n = normName(r.name);
    return include.every(k => n.includes(k)) && exclude.every(k => !n.includes(k));
  });
}

type BarItem = { name: string; value: number; percent: number; group: string };

function deriveBarData(group: TableRow | undefined, colIndex: number): BarItem[] {
  if (!group) return [];
  const rootTotal = group.values[colIndex] ?? 0;
  if (rootTotal === 0) return [];
  const items: BarItem[] = [];
  (group.children ?? []).forEach(child => {
    if (child.children?.length) {
      child.children.forEach(leaf => {
        const v = leaf.values[colIndex] ?? 0;
        if (v !== 0) items.push({ name: leaf.name, value: v, percent: (v / rootTotal) * 100, group: child.name });
      });
    } else {
      const v = child.values[colIndex] ?? 0;
      if (v !== 0) items.push({ name: child.name, value: v, percent: (v / rootTotal) * 100, group: group.name });
    }
  });
  return items;
}

// ─── PercentChange badge ──────────────────────────────────────────────────────
const PercentChange = ({ prev, curr, label }: { prev: number; curr: number; label?: string }) => {
  if (prev === 0 || curr === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const isDown = pct < 0; // for passivo, queda é positivo (bom)
  const Icon = isDown ? ArrowDown : ArrowUp;
  const color = isDown ? 'text-emerald-500' : 'text-red-500';
  return (
    <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={`${color} font-medium`}>{Math.abs(pct).toFixed(1)}%</span>
      {label && <span>— {label}</span>}
    </div>
  );
};

type TableRow = {
  id: string;
  name: string;
  level: number;
  values: number[];
  children?: TableRow[];
};

// --- Components ---

const HorizontalBarChart = ({ detailedData, title, subtitle, icon: Icon, className }: { detailedData: any[], title: string, subtitle: string, icon: any, className?: string }) => {
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'liquidity'>('liquidity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (newSortBy: 'value' | 'name' | 'liquidity') => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedData = [...detailedData].sort((a, b) => {
    let result = 0;
    if (sortBy === 'value') {
      result = b.value - a.value;
    } else if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else {
      // 'liquidity' (exigibility) is the default order
      const getPriority = (item: any) => {
        const exigibilityRank: Record<string, number> = {
          'Custeio': 1,
          'Cooperativa': 2,
          'Financiamentos': 3,
          'Investimentos': 4,
          'Produtos': 5,
        };
        return exigibilityRank[item.name] || 99;
      };
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (priorityA !== priorityB) {
        result = priorityA - priorityB;
      } else {
        result = b.value - a.value; // secondary sort by value
      }
    }
    
    if (sortBy === 'name') {
      return sortDirection === 'asc' ? result : -result;
    } else {
      return sortDirection === 'desc' ? result : -result;
    }
  });

  const maxPercent = Math.max(...sortedData.map(d => d.percent));
  
  const getBarColor = (item: any) => {
    const groupName = item.group || item.name;
    if (groupName === 'Financeiro') return 'bg-blue-600';
    if (groupName === 'Produtos') return 'bg-[#f4af2d]';
    return 'bg-emerald-600';
  };

  return (
    <GlassCard className={cn("p-6 flex flex-col border-slate-200/60 hover:shadow-float transition-all duration-300", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-slate-800 shrink-0" />
          <div className="flex flex-col text-left">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 italic">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg self-start sm:self-auto">
          {[
            { id: 'liquidity', label: 'Liq.' },
            { id: 'value', label: 'Val.' },
            { id: 'name', label: 'A-Z' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSort(opt.id as any)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1",
                sortBy === opt.id 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {opt.id === 'name' && sortBy === 'name' ? (sortDirection === 'asc' ? 'A-Z' : 'Z-A') : opt.label}
              {sortBy === opt.id && opt.id !== 'name' && (
                sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-3 justify-between py-2">
        {sortedData.map((item, index) => (
          <div key={`${sortBy}-${index}`} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="w-20 sm:w-32 flex items-center gap-1 sm:gap-2 text-slate-600">
              <div className="flex-1"></div>
              <span className="truncate text-right" title={item.name}>{item.name}</span>
            </div>
            <div 
              className="flex-1 bg-slate-100 rounded-sm overflow-hidden flex items-center h-5 sm:h-6"
              title={`${item.name}\n${formatCurrency(item.value)}`}
            >
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(item.percent / maxPercent) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.05, ease: "easeOut" }}
                className={cn("h-full rounded-sm", getBarColor(item))}
              />
            </div>
            <div className="w-24 sm:w-28 shrink-0 text-left text-slate-700 font-medium text-[10px] sm:text-xs">
              {formatMi(item.value)} | {item.percent.toFixed(1).replace('.', ',')}%
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export function BalancePassivoTab({ viewMode = 'Detalhamento', importedTableData, columns: columnsProp, selectedColumn }: { viewMode?: string; importedTableData?: BalanceTableRow[] | null; columns?: string[]; selectedColumn?: string }) {
  const activeTableData: TableRow[] = importedTableData ?? [];
  const TABLE_COLUMNS = columnsProp && columnsProp.length > 0 ? columnsProp : DEFAULT_COLUMNS;

  // ─── Índice da coluna selecionada ────────────────────────────────────────────
  const selIdx = selectedColumn ? TABLE_COLUMNS.indexOf(selectedColumn) : TABLE_COLUMNS.length - 1;
  const colIdx = selIdx >= 0 ? selIdx : Math.max(0, TABLE_COLUMNS.length - 1);
  const prevIdx = colIdx > 0 ? colIdx - 1 : -1;

  // ─── KPI derivados ───────────────────────────────────────────────────────────
  const passivoCirc    = findGroup(activeTableData, ['circulante'], ['nao', 'não']);
  const passivoNaoCirc = findGroup(activeTableData, ['nao', 'circulante']) ?? findGroup(activeTableData, ['não', 'circulante']);
  const totalPassivo       = activeTableData.reduce((s, r) => s + (r.values[colIdx] ?? 0), 0);
  const passivoCircTotal   = passivoCirc?.values[colIdx] ?? 0;
  const passivoNaoCircTotal = passivoNaoCirc?.values[colIdx] ?? 0;
  const totalPassivoPrev   = prevIdx >= 0 ? activeTableData.reduce((s, r) => s + (r.values[prevIdx] ?? 0), 0) : 0;
  const passivoCircPrev    = prevIdx >= 0 ? (passivoCirc?.values[prevIdx] ?? 0) : 0;
  const passivoNaoCircPrev = prevIdx >= 0 ? (passivoNaoCirc?.values[prevIdx] ?? 0) : 0;

  // ─── Dados dos gráficos de barra derivados ───────────────────────────────────
  const passivoCircBarData    = deriveBarData(passivoCirc,    colIdx);
  const passivoNaoCircBarData = deriveBarData(passivoNaoCirc, colIdx);
  const colCount = TABLE_COLUMNS.length;
  const gridStyle = { gridTemplateColumns: `2fr repeat(${colCount}, 1fr)` };
  const totals = TABLE_COLUMNS.map((_, i) => activeTableData.reduce((acc, row) => acc + (row.values[i] ?? 0), 0));
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    'pc': true,
    'pc-fin': true,
    'pc-prod': true,
    'pnc': true,
    'pnc-fin': true,
    'pnc-prod': true,
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTableRows = (rows: TableRow[]) => {
    return rows.map((row) => {
      const hasChildren = row.children && row.children.length > 0;
      const isExpanded = expandedRows[row.id];
      const isLevel0 = row.level === 0;
      const isLevel1 = row.level === 1;

      return (
        <React.Fragment key={row.id}>
          <div
            className={cn(
              "grid items-center py-2.5 px-4 border-b border-slate-100 transition-colors hover:bg-slate-100",
              isLevel0 ? "bg-slate-50/80 font-semibold text-slate-800" : "",
              isLevel1 ? "font-medium text-slate-700" : "text-slate-600 text-sm",
              hasChildren ? "cursor-pointer" : ""
            )}
            style={gridStyle}
            onClick={() => hasChildren && toggleRow(row.id)}
          >
            <div className="flex items-center gap-2">
              <div style={{ width: `${row.level * 24}px` }} className="shrink-0" />
              {hasChildren ? (
                <button
                  className="p-0.5 text-slate-500 hover:text-slate-800 transition-colors shrink-0 pointer-events-none"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{row.name}</span>
            </div>
            {row.values.map((v, i) => (
              <div key={i} className="text-right text-sm">
                {formatCurrency(v)}
              </div>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {renderTableRows(row.children!)}
              </motion.div>
            )}
          </AnimatePresence>
        </React.Fragment>
      );
    });
  };

  const renderTreeNode = (node: TableRow, isLast: boolean) => {
    return (
      <div key={node.id} className="relative pl-8 py-2">
        {/* Connection line from parent */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" style={{ bottom: isLast ? '50%' : '0' }} />
        {/* Horizontal line to this node */}
        <div className="absolute left-0 top-1/2 w-8 h-px bg-slate-200" />
        
        <GlassCard className="p-3 inline-flex flex-col gap-1 border-slate-200/60 shadow-sm hover:shadow-float transition-all relative z-10 bg-white/80">
          <span className="font-semibold text-slate-700 text-sm">{node.name}</span>
          <div className="flex gap-4 text-xs">
            {TABLE_COLUMNS.map((col, i) => (
              <div key={col} className="flex flex-col">
                <span className="text-slate-400">{col}</span>
                <span className={cn("font-medium", i === node.values.length - 1 ? "text-emerald-600" : "text-slate-600")}>
                  {formatCurrency(node.values[i])}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child, idx) => renderTreeNode(child, idx === node.children!.length - 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTree = () => (
    <div className="p-4 md:p-6 overflow-auto custom-scrollbar bg-slate-50/50 rounded-xl border border-slate-200/60">
      {activeTableData.map((rootNode, idx) => (
        <div key={rootNode.id} className="mb-8 last:mb-0">
          <GlassCard className="p-4 inline-flex flex-col gap-1 border-emerald-200/60 shadow-sm bg-emerald-50/50 relative z-10 mb-2">
            <span className="font-bold text-emerald-800 text-base">{rootNode.name}</span>
            <div className="flex gap-6 text-sm">
              {TABLE_COLUMNS.map((col, i) => (
                <div key={col} className="flex flex-col">
                  <span className="text-emerald-600/70">{col}</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(rootNode.values[i])}</span>
                </div>
              ))}
            </div>
          </GlassCard>
          {rootNode.children && (
            <div className="ml-6">
              {rootNode.children.map((child, childIdx) => renderTreeNode(child, childIdx === rootNode.children!.length - 1))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTable = (isDetalhamento: boolean = false) => (
    <GlassCard className={cn("p-4 md:p-6 flex flex-col border-slate-200/60", isDetalhamento ? "h-full" : "h-fit")}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-slate-700">por Grupo Contábil</h3>
        <div className="text-sm text-slate-500">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-200 mr-2"></span>
          Valores em R$
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="overflow-x-auto flex-1 flex flex-col custom-scrollbar">
          <div className="min-w-[500px] flex flex-col h-full">
            {/* Table Header */}
            <div className="grid py-3 px-4 bg-slate-100 text-slate-700 rounded-t-lg font-medium text-sm shrink-0" style={gridStyle}>
              <div>Grupo Contábil</div>
              {TABLE_COLUMNS.map(col => (
                <div key={col} className="text-right">{col}</div>
              ))}
            </div>

            {/* Table Body */}
            <div className={cn("border border-t-0 border-slate-200 bg-white/50 flex-1", isDetalhamento ? "overflow-y-auto custom-scrollbar" : "")}>
              {renderTableRows(activeTableData)}
            </div>

            {/* Table Footer */}
            <div className="grid py-3 px-4 bg-slate-50/80 border border-t-0 border-slate-200 rounded-b-lg font-bold text-slate-800 shrink-0" style={gridStyle}>
              <div>Total</div>
              {totals.map((t, i) => (
                <div key={i} className="text-right">{formatCurrency(t)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <motion.div 
      className="flex flex-col flex-1 min-h-0 gap-4 pb-32"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Passivo */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-6 w-6 text-slate-800" />
            <div className="flex flex-col">
              <span className="text-slate-800 font-semibold text-lg">Passivo</span>
            </div>
          </div>
          
          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(totalPassivo)}
            </span>
            {prevIdx >= 0 && totalPassivoPrev > 0 && (
              <PercentChange prev={totalPassivoPrev} curr={totalPassivo} label="em relação ao balanço anterior" />
            )}
          </div>
        </GlassCard>

        {/* Passivo Circulante */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-6 w-6 text-slate-800" />
            <div className="flex flex-col">
              <span className="text-slate-800 font-semibold text-lg">Passivo Circulante</span>
            </div>
          </div>

          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(passivoCircTotal)}
            </span>
            {prevIdx >= 0 && passivoCircPrev > 0 && (
              <PercentChange prev={passivoCircPrev} curr={passivoCircTotal} label="em relação ao balanço anterior" />
            )}
          </div>
        </GlassCard>

        {/* Passivo Não Circulante */}
        <GlassCard className="p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

          <div className="flex items-center gap-3 mb-2">
            <Hourglass className="h-6 w-6 text-slate-800" />
            <div className="flex flex-col">
              <span className="text-slate-800 font-semibold text-lg">Passivo Não Circulante</span>
            </div>
          </div>

          <div className="flex flex-col items-start mt-4">
            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(passivoNaoCircTotal)}
            </span>
            {prevIdx >= 0 && passivoNaoCircPrev > 0 && (
              <PercentChange prev={passivoNaoCircPrev} curr={passivoNaoCircTotal} label="em relação ao balanço anterior" />
            )}
          </div>
        </GlassCard>
      </div>

      {viewMode === 'Detalhamento' && (
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Top Row: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <HorizontalBarChart
              detailedData={passivoCircBarData}
              title="Passivo Circulante"
              subtitle="(Passivo Circulante | % do Total Passivo Circulante)"
              icon={Calendar}
              className="h-full"
            />
            <HorizontalBarChart
              detailedData={passivoNaoCircBarData}
              title="Passivo Não Circulante"
              subtitle="(Passivo Não Circulante | % do Total Passivo Não Circulante)"
              icon={Hourglass}
              className="h-full"
            />
          </div>

          {/* Bottom Row: Table */}
          <div className="w-full">
            {renderTable(true)}
          </div>
        </div>
      )}

      {viewMode === 'Tabela' && (
        <div className="w-full">
          {renderTable()}
        </div>
      )}

      {viewMode === 'Árvore Hierárquica' && (
        <div className="w-full">
          {renderTree()}
        </div>
      )}
    </motion.div>
  );
}
