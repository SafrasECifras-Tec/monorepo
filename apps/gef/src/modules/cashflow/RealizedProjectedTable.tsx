import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Info, Columns, Warehouse, Save, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MONTHS_PT } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';
import { recalculateData as recalc } from '@/data/cashflow/realizedProjectedData';
import type { CategoryData } from '@/data/cashflow/realizedProjectedData';
import type { CropStock } from '@/data/cashflow/estoqueData';
import { EditableCell, CropDrawer } from './components';
import { SaveProjectionModal } from './components/SaveProjectionModal';
import { ProjectionHistoryDrawer } from './components/ProjectionHistoryDrawer';
import { saveSnapshot, loadSnapshots } from '@/data/cashflow/projectionsHistoryData';
import type { ProjectionSnapshot } from '@/data/cashflow/projectionsHistoryData';

interface RealizedProjectedTableProps {
  currencyMode: CurrencyMode;
  stockData: CropStock[];
  onStockUpdate: (cropName: string, quantity: number, avgPrice: number, totalValue: number, monthIndex: number) => void;
  monthlyData: CategoryData[];
  setMonthlyData: React.Dispatch<React.SetStateAction<CategoryData[]>>;
  annualData: CategoryData[];
  setAnnualData: React.Dispatch<React.SetStateAction<CategoryData[]>>;
  saldoOverridesMonthly: Record<number, number>;
  setSaldoOverridesMonthly: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  saldoOverridesAnnual: Record<number, number>;
  setSaldoOverridesAnnual: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  saldoInicial: number;
  onSaldoInicialChange: (v: number) => void;
}

const months = MONTHS_PT;

const currentMonthIndex = new Date().getMonth();

const formatValue = (value: number, currencyMode: CurrencyMode) => {
  if (value === 0) return <span className="text-[#B0B0B0]">-</span>;

  let displayValue = value;
  if (currencyMode === 'SOJA') displayValue = value / 120;
  if (currencyMode === 'USD') displayValue = value / 5.5; // Mock rate

  return displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatFullValue = (value: number, currencyMode: CurrencyMode) => {
  if (value === 0) return '-';

  let displayValue = value;
  let prefix = 'R$ ';

  if (currencyMode === 'SOJA') {
    displayValue = value / 120;
    prefix = 'scs ';
  }
  if (currencyMode === 'USD') {
    displayValue = value / 5.5; // Mock rate
    prefix = 'US$ ';
  }

  return prefix + displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function RealizedProjectedTable({
  currencyMode, stockData, onStockUpdate,
  monthlyData, setMonthlyData,
  annualData, setAnnualData,
  saldoOverridesMonthly, setSaldoOverridesMonthly,
  saldoOverridesAnnual, setSaldoOverridesAnnual,
  saldoInicial, onSaldoInicialChange,
}: RealizedProjectedTableProps) {
  const fmtSaldo = (v: number) => v.toLocaleString('pt-BR');
  const [saldoInputValue, setSaldoInputValue] = React.useState(() => fmtSaldo(saldoInicial));
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(y + i));
  }, []);
  const columns = viewMode === 'monthly' ? months : years;

  const currentData = viewMode === 'monthly' ? monthlyData : annualData;
  const saldoOverrides = viewMode === 'monthly' ? saldoOverridesMonthly : saldoOverridesAnnual;
  const setSaldoOverrides = viewMode === 'monthly' ? setSaldoOverridesMonthly : setSaldoOverridesAnnual;

  const [expandedMaster, setExpandedMaster] = useState<Record<string, boolean>>({
    'ENTRADAS': true,
    'SAÍDAS': true,
  });
  const [expandedSubMaster, setExpandedSubMaster] = useState<Record<string, boolean>>({});
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<{ masterIdx: number, childIdx: number, colIdx: number } | null>(null);

  const toggleSubMaster = (name: string) => {
    setExpandedSubMaster(prev => ({ ...prev, [name]: prev[name] === undefined ? false : !prev[name] }));
  };

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [snapshots, setSnapshots] = useState<ProjectionSnapshot[]>(() => loadSnapshots());

  const handleSaveProjection = (label: string, notes: string) => {
    saveSnapshot({ label, notes, monthlyData, annualData, saldoOverridesMonthly, saldoOverridesAnnual });
    setSnapshots(loadSnapshots());
    toast.success('Projeção salva com sucesso', { description: label });
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<boolean[]>(new Array(12).fill(true));
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleColumns(new Array(viewMode === 'monthly' ? 12 : 5).fill(true));
  }, [viewMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowColumnFilter(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('cashflow-fullscreen');
    } else {
      document.body.classList.remove('cashflow-fullscreen');
    }
    return () => document.body.classList.remove('cashflow-fullscreen');
  }, [isFullscreen]);

  const toggleColumn = (index: number) => {
    setVisibleColumns(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleAddProjection = (monthIndex: number, value: number, quantity: number, avgPrice: number) => {
    if (!selectedCrop) return;

    const isMonthly = viewMode === 'monthly';
    if (!isMonthly) {
      toast.error('Apenas disponível na visão mensal');
      return;
    }

    const targetData = [...monthlyData];

    const masterIdx = targetData.findIndex(m => m.name === 'ENTRADAS');
    if (masterIdx === -1) return;

    const master = { ...targetData[masterIdx] };
    const children = [...(master.children || [])];
    const childIdx = children.findIndex(c =>
      c.name === selectedCrop || c.name.replace(/^Venda de\s+/i, '') === selectedCrop
    );
    if (childIdx === -1) return;

    const child = { ...children[childIdx] };
    const values = [...child.values];

    values[monthIndex] += value;

    child.values = values;
    children[childIdx] = child;
    master.children = children;
    targetData[masterIdx] = master;

    setMonthlyData(recalc(targetData));
    onStockUpdate(selectedCrop, quantity, avgPrice, value, monthIndex);

    toast.success('Projeção adicionada com sucesso', {
      description: `Venda de ${selectedCrop} projetada para ${months[monthIndex]}.`,
    });

    setHighlightedCell({ masterIdx, childIdx, colIdx: monthIndex });
    setTimeout(() => setHighlightedCell(null), 2000);
  };

  const handleCellChange = (masterIndex: number, childIndex: number, colIndex: number, newValue: number | null) => {
    const isMonthly = viewMode === 'monthly';
    const targetData = isMonthly ? [...monthlyData] : [...annualData];

    const master = { ...targetData[masterIndex] };
    const children = [...master.children!];
    const child = { ...children[childIndex] };
    const values = [...child.values];

    values[colIndex] = newValue ?? 0;
    child.values = values;
    children[childIndex] = child;
    master.children = children;
    targetData[masterIndex] = master;

    if (isMonthly) {
      setMonthlyData(recalc(targetData));
    } else {
      setAnnualData(recalc(targetData));
    }
  };

  const handleProjectAverage = (masterIndex: number, childIndex: number) => {
    if (viewMode === 'annual') return;
    const newData = [...monthlyData];
    const master = { ...newData[masterIndex] };
    const children = [...master.children!];
    const child = { ...children[childIndex] };
    const values = [...child.values];

    // Determine projection limit
    let limit = 12;
    let isOperatingExpense = false;

    if (master.name === 'SAÍDAS') {
      let subMasterName = '';
      for (let i = childIndex; i >= 0; i--) {
        if (children[i].isSubMaster) {
          subMasterName = children[i].name;
          break;
        }
      }
      if (subMasterName === 'Operação') isOperatingExpense = true;
    }

    // Apply 3-month limit to Entradas and non-operating Saídas
    if (master.name === 'ENTRADAS' || (master.name === 'SAÍDAS' && !isOperatingExpense)) {
      limit = Math.min(12, currentMonthIndex + 4); // Current + 3 months
    }

    const realizedValues = values.slice(0, currentMonthIndex + 1);
    const sum = realizedValues.reduce((a, b) => a + b, 0);
    const avg = sum / realizedValues.length;

    for (let i = currentMonthIndex + 1; i < limit; i++) {
      values[i] = avg;
    }

    // For restricted categories, ensure months beyond limit are zeroed if they were projected
    if (limit < 12) {
      for (let i = limit; i < 12; i++) {
        values[i] = 0;
      }
    }

    child.values = values;
    children[childIndex] = child;
    master.children = children;
    newData[masterIndex] = master;

    setMonthlyData(recalc(newData));
  };

  const toggleMaster = (name: string) => {
    setExpandedMaster(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Calculate Totals
  const calculateRowTotal = (values: number[]) => values.reduce((acc, curr) => acc + curr, 0);

  // Calculate KPIs
  const variacaoCaixa = columns.map((_, i) => {
    const entradas = currentData.find(d => d.name === 'ENTRADAS')?.values[i] || 0;
    // "Entrada de Crédito" agora é subMaster dentro de ENTRADAS; já contabilizado em entradas
    const credito = 0;
    const saidas = currentData.find(d => d.name === 'SAÍDAS')?.values[i] || 0;
    return entradas + credito - saidas;
  });

  const saldoInicialMensal: number[] = [];
  const saldoAcumulado: number[] = [];

  let currentSaldo = saldoOverrides[0] !== undefined ? saldoOverrides[0] : saldoInicial;

  for (let i = 0; i < columns.length; i++) {
    if (saldoOverrides[i] !== undefined) {
      currentSaldo = saldoOverrides[i];
    }

    saldoInicialMensal.push(currentSaldo);
    const newSaldo = currentSaldo + variacaoCaixa[i];
    saldoAcumulado.push(newSaldo);

    currentSaldo = newSaldo;
  }

  const handleSaldoOverride = (index: number, value: number | null) => {
    setSaldoOverrides(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[index];
      } else {
        next[index] = value;
      }
      return next;
    });
  };

  return (
    <>
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        />
      )}
    </AnimatePresence>

    <motion.div
      layout
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "overflow-hidden border-slate-200/60 bg-white/80 shadow-xl flex flex-col rounded-2xl",
        isFullscreen
          ? "fixed inset-2 z-50 rounded-xl shadow-2xl"
          : "h-full"
      )}
    >
      <SaveProjectionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProjection}
      />
      <ProjectionHistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        snapshots={snapshots}
        onSnapshotsChange={() => setSnapshots(loadSnapshots())}
      />
      <CropDrawer
        isOpen={selectedCrop !== null}
        onClose={() => setSelectedCrop(null)}
        cropName={selectedCrop}
        cropStock={stockData.find(s => s.name === selectedCrop) ?? null}
        currencyMode={currencyMode}
        onAddProjection={handleAddProjection}
      />
      <div className="px-5 py-4 border-b border-slate-100 bg-white/40 flex flex-col gap-3">
        {/* Row 1: Título + ações primárias */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Fluxo de Caixa Realizado vs Projetado</h2>
              <p className="text-xs text-slate-500">Visão detalhada mensal com separação de competência</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar Projeção
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Histórico
              {snapshots.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {snapshots.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Sair da tela cheia (Esc)' : 'Expandir tela cheia'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Minimizar' : 'Tela Cheia'}
            </button>
          </div>
        </div>

        {/* Row 2: Controles de visualização */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Saldo Inicial</span>
            <div className="h-3.5 w-px bg-slate-300" />
            <span className="text-xs text-slate-400 shrink-0">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={saldoInputValue}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                setSaldoInputValue(raw ? Number(raw).toLocaleString('pt-BR') : '');
              }}
              onFocus={e => e.target.select()}
              onBlur={() => {
                const raw = saldoInputValue.replace(/\./g, '').replace(',', '.');
                const val = parseFloat(raw);
                if (!isNaN(val) && val >= 0) {
                  onSaldoInicialChange(val);
                  setSaldoInputValue(fmtSaldo(val));
                } else {
                  setSaldoInputValue(fmtSaldo(saldoInicial));
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-24 text-sm font-medium text-slate-700 bg-transparent outline-none text-right"
            />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                viewMode === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                viewMode === 'annual' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Anual
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Columns className="h-4 w-4" />
              Ocultar {viewMode === 'monthly' ? 'Meses' : 'Anos'}
            </button>

            {showColumnFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {viewMode === 'monthly' ? 'Meses' : 'Anos'} Visíveis
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {columns.map((col, i) => (
                    <label key={col} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[i]}
                        onChange={() => toggleColumn(i)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cn("relative overflow-y-auto custom-scrollbar flex-1 min-h-0", isFullscreen ? "overflow-x-hidden" : "overflow-x-auto")}>
        <table className={cn("w-full border-separate border-spacing-0 text-xs", isFullscreen && "table-fixed")}>
          <thead className="sticky top-0 z-40 bg-slate-50">
            <tr className="bg-slate-50">
              <th className={cn("sticky left-0 z-50 bg-slate-50 py-3 px-3 text-left font-bold text-slate-700 border-r border-b border-slate-200", isFullscreen ? "w-[190px]" : "min-w-[200px]")}>
                Categorias
              </th>
              {columns.map((col, i) => visibleColumns[i] && (
                <th
                  key={col}
                  className={cn(
                    'py-3 px-2 text-right font-bold text-slate-700 border-r border-b border-slate-100 whitespace-nowrap',
                    isFullscreen ? "" : "min-w-[100px]",
                    viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/50' : 'bg-slate-50'
                  )}
                >
                  <div className="flex flex-col items-end gap-1">
                    <span>{col}</span>
                  </div>
                </th>
              ))}
              <th className={cn("py-3 px-2 text-right font-bold text-slate-800 bg-slate-200 border-b border-slate-300 whitespace-nowrap", isFullscreen ? "" : "min-w-[110px]")}>
                Total
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {currentData.map((master, masterIdx) => (
              <React.Fragment key={master.name}>
                {/* Master Row */}
                <tr
                  className="group transition-colors hover:bg-slate-50"
                >
                  <td
                    className={cn(
                      'sticky left-0 z-20 py-3 px-3 font-bold border-r border-b border-slate-200 flex items-center justify-between cursor-pointer',
                      master.name === 'ENTRADAS' ? 'text-emerald-700 bg-white' :
                      master.name === 'SAÍDAS' ? 'text-red-700 bg-white' : 'text-slate-800 bg-white'
                    )}
                    onClick={() => toggleMaster(master.name)}
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedMaster[master.name] ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                      {master.name}
                      {master.name === 'ENTRADAS' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                      {master.name === 'SAÍDAS' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </td>
                  {master.values.map((val, i) => visibleColumns[i] && (
                    <td
                      key={i}
                      title={formatFullValue(val, currencyMode)}
                      className={cn(
                        'py-3 px-2 text-right font-bold border-r border-b border-slate-100 font-mono whitespace-nowrap',
                        viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/20' : ''
                      )}
                    >
                      {formatValue(val, currencyMode)}
                    </td>
                  ))}
                  <td
                    title={formatFullValue(calculateRowTotal(master.values), currencyMode)}
                    className="py-3 px-2 text-right font-bold bg-slate-100 text-slate-900 border-b border-slate-200 font-mono whitespace-nowrap"
                  >
                    {formatValue(calculateRowTotal(master.values), currencyMode)}
                  </td>
                </tr>

                {/* Children Rows */}
                {expandedMaster[master.name] && (() => {
                  let currentSubMasterExpanded = true;
                  let currentSubMasterName = '';
                  return master.children?.map((child, childIdx) => {
                    if (child.isSubMaster) {
                      currentSubMasterExpanded = expandedSubMaster[child.name] !== false;
                      currentSubMasterName = child.name;
                    } else if (!currentSubMasterExpanded) {
                      return null;
                    }

                    const isOperatingExpense = master.name === 'SAÍDAS' && currentSubMasterName === 'Operação';
                    const isRestrictedCategory = master.name === 'ENTRADAS' || (master.name === 'SAÍDAS' && !isOperatingExpense);

                    return (
                      <tr
                        key={child.name}
                        className={cn(
                          'transition-colors group/row',
                          child.isSubMaster ? 'bg-slate-100 hover:bg-slate-100/80' : 'hover:bg-slate-50/50'
                        )}
                      >
                        <td
                          className={cn(
                            'sticky left-0 z-20 py-3 px-3 border-r border-b border-slate-200 flex items-center justify-between',
                            child.isSubMaster ? 'pl-7 font-bold text-slate-700 bg-slate-100 cursor-pointer' : 'pl-10 text-slate-600 font-medium bg-white'
                          )}
                          onClick={child.isSubMaster ? () => toggleSubMaster(child.name) : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {child.isSubMaster && (
                              expandedSubMaster[child.name] !== false ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{child.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {master.name === 'ENTRADAS' && /^Venda de /i.test(child.name) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCrop(child.name.replace(/^Venda de\s+/i, ''));
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer"
                                title="Ver Estoque"
                              >
                                <Warehouse className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        {child.values.map((val, i) => {
                          if (!visibleColumns[i]) return null;

                          const isOperatingExpenseCell = master.name === 'SAÍDAS' && currentSubMasterName === 'Operação';
                          const isRestrictedCategoryCell = master.name === 'ENTRADAS' || (master.name === 'SAÍDAS' && !isOperatingExpenseCell);
                          const isBeyondAutoLimit = isRestrictedCategoryCell && i > currentMonthIndex + 3;

                          const canEdit = !child.isSubMaster && (viewMode === 'annual' || i >= currentMonthIndex);

                          return (
                            <td
                              key={i}
                              title={formatFullValue(val, currencyMode)}
                              className={cn(
                                'py-3 px-2 text-right border-r border-b border-slate-50 font-mono relative transition-colors duration-500 whitespace-nowrap',
                                child.isSubMaster ? 'font-bold text-slate-700' : 'text-slate-600',
                                viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/10' : '',
                                isBeyondAutoLimit ? 'bg-slate-50/30' : '',
                                highlightedCell?.masterIdx === masterIdx && highlightedCell?.childIdx === childIdx && highlightedCell?.colIdx === i ? 'bg-emerald-100/80' : ''
                              )}
                            >
                              {canEdit ? (
                                <EditableCell
                                  value={val}
                                  currencyMode={currencyMode}
                                  onChange={(newVal) => handleCellChange(masterIdx, childIdx, i, newVal)}
                                />
                              ) : (
                                <span>
                                  {formatValue(val, currencyMode)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td
                          title={formatFullValue(calculateRowTotal(child.values), currencyMode)}
                          className={cn(
                            'py-3 px-2 text-right border-b border-slate-100 font-mono whitespace-nowrap',
                            child.isSubMaster ? 'font-bold text-slate-800 bg-slate-200' : 'font-semibold text-slate-700 bg-slate-100'
                          )}
                        >
                          {formatValue(calculateRowTotal(child.values), currencyMode)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </React.Fragment>
            ))}
          </tbody>

          <tfoot className="sticky bottom-0 z-40 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Saldo Inicial */}
            <tr className="text-slate-800">
              <td className="sticky left-0 z-50 bg-slate-50 py-3 px-3 font-semibold border-r border-t-2 border-t-emerald-600 border-r-slate-200">
                Saldo Inicial
              </td>
              {saldoInicialMensal.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-semibold border-r border-t-2 border-t-emerald-600 border-r-slate-200 font-mono bg-slate-50 relative text-slate-700 whitespace-nowrap"
                >
                  <EditableCell
                    value={val}
                    currencyMode={currencyMode}
                    onChange={(newVal) => handleSaldoOverride(i, newVal)}
                    isOverride={saldoOverrides[i] !== undefined}
                  />
                </td>
              ))}
              <td
                title={formatFullValue(saldoInicialMensal[0], currencyMode)}
                className="py-3 px-2 text-right font-semibold bg-slate-200 border-t-2 border-t-emerald-600 font-mono text-slate-800 whitespace-nowrap"
              >
                {formatValue(saldoInicialMensal[0], currencyMode)}
              </td>
            </tr>
            {/* Variação de Caixa */}
            <tr className="text-slate-800">
              <td className="sticky left-0 z-50 bg-slate-50 py-3 px-3 font-semibold border-r border-t border-slate-200">
                Variação de Caixa (Mensal)
              </td>
              {variacaoCaixa.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-semibold border-r border-t border-slate-200 font-mono bg-slate-50 text-slate-700 whitespace-nowrap"
                >
                  <div className="flex flex-col items-end">
                    <span>{val > 0 ? '+' : ''}{formatValue(val, currencyMode)}</span>
                  </div>
                </td>
              ))}
              <td
                title={formatFullValue(calculateRowTotal(variacaoCaixa), currencyMode)}
                className="py-3 px-2 text-right font-semibold bg-slate-200 border-t border-slate-200 font-mono text-slate-800 whitespace-nowrap"
              >
                {formatValue(calculateRowTotal(variacaoCaixa), currencyMode)}
              </td>
            </tr>
            {/* Saldo em Caixa */}
            <tr className="text-slate-900">
              <td className="sticky left-0 z-50 bg-slate-100 py-3 px-3 font-black border-r border-t border-slate-200">
                Saldo em Caixa (Acumulado)
              </td>
              {saldoAcumulado.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-black border-r border-t border-slate-200 font-mono bg-slate-100 whitespace-nowrap"
                >
                  <span className={cn(val >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {formatValue(val, currencyMode)}
                  </span>
                </td>
              ))}
              <td
                title={formatFullValue(saldoAcumulado[saldoAcumulado.length - 1], currencyMode)}
                className="py-3 px-2 text-right font-black bg-slate-300 border-t border-slate-300 font-mono whitespace-nowrap"
              >
                <span className={cn(saldoAcumulado[saldoAcumulado.length - 1] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {formatValue(saldoAcumulado[saldoAcumulado.length - 1], currencyMode)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
        <Info className="h-4 w-4 text-slate-400" />
        <p className="text-xs text-slate-500">
          * Valores realizados até <span className="font-bold text-slate-700">Março/2026</span>. Projeções baseadas no planejamento de safra e contratos futuros.
        </p>
      </div>
    </motion.div>
    </>
  );
}
