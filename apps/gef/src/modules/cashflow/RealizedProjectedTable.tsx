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
  if (value === 0) return <span className="text-muted-foreground">-</span>;

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
        "overflow-hidden border-border/60 bg-card/80 shadow-elevated flex flex-col rounded-[2rem]",
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
      <div className="px-5 py-4 border-b border-border/50 bg-card/40 flex flex-col gap-3">
        {/* Row 1: Título + ações primárias */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Fluxo de Caixa Realizado vs Projetado</h2>
              <p className="text-xs text-muted-foreground">Visão detalhada mensal com separação de competência</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar Projeção
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Minimizar' : 'Tela Cheia'}
            </button>
          </div>
        </div>

        {/* Row 2: Controles de visualização */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent border border-border rounded-lg">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Saldo Inicial</span>
            <div className="h-3.5 w-px bg-border" />
            <span className="text-xs text-muted-foreground shrink-0">R$</span>
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
              className="w-24 text-sm font-medium text-foreground bg-transparent outline-none text-right"
            />
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                viewMode === 'monthly' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                viewMode === 'annual' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Anual
            </button>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <Columns className="h-4 w-4" />
              Ocultar {viewMode === 'monthly' ? 'Meses' : 'Anos'}
            </button>

            {showColumnFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-elevated border border-border/50 z-50 py-2">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {viewMode === 'monthly' ? 'Meses' : 'Anos'} Visíveis
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {columns.map((col, i) => (
                    <label key={col} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[i]}
                        onChange={() => toggleColumn(i)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{col}</span>
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
          <thead className="sticky top-0 z-40 bg-accent">
            <tr className="bg-accent">
              <th className={cn("sticky left-0 z-50 bg-accent py-3 px-3 text-left font-bold text-foreground border-r border-b border-border", isFullscreen ? "w-[190px]" : "min-w-[200px]")}>
                Categorias
              </th>
              {columns.map((col, i) => visibleColumns[i] && (
                <th
                  key={col}
                  className={cn(
                    'py-3 px-2 text-right font-bold text-foreground border-r border-b border-border/50 whitespace-nowrap',
                    isFullscreen ? "" : "min-w-[100px]",
                    viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/50' : 'bg-accent'
                  )}
                >
                  <div className="flex flex-col items-end gap-1">
                    <span>{col}</span>
                  </div>
                </th>
              ))}
              <th className={cn("py-3 px-2 text-right font-bold text-foreground bg-muted border-b border-border whitespace-nowrap", isFullscreen ? "" : "min-w-[110px]")}>
                Total
              </th>
            </tr>
          </thead>

          <tbody className="bg-card">
            {currentData.map((master, masterIdx) => (
              <React.Fragment key={master.name}>
                {/* Master Row */}
                <tr
                  className="group transition-colors hover:bg-accent"
                >
                  <td
                    className={cn(
                      'sticky left-0 z-20 py-3 px-3 font-bold border-r border-b border-border flex items-center justify-between cursor-pointer',
                      master.name === 'ENTRADAS' ? 'text-primary bg-card' :
                      master.name === 'SAÍDAS' ? 'text-destructive bg-card' : 'text-foreground bg-card'
                    )}
                    onClick={() => toggleMaster(master.name)}
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedMaster[master.name] ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      {master.name}
                      {master.name === 'ENTRADAS' && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                      {master.name === 'SAÍDAS' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </td>
                  {master.values.map((val, i) => visibleColumns[i] && (
                    <td
                      key={i}
                      title={formatFullValue(val, currencyMode)}
                      className={cn(
                        'py-3 px-2 text-right font-bold border-r border-b border-border/50 font-mono whitespace-nowrap',
                        viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/20' : ''
                      )}
                    >
                      {formatValue(val, currencyMode)}
                    </td>
                  ))}
                  <td
                    title={formatFullValue(calculateRowTotal(master.values), currencyMode)}
                    className="py-3 px-2 text-right font-bold bg-muted text-foreground border-b border-border font-mono whitespace-nowrap"
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
                          child.isSubMaster ? 'bg-muted hover:bg-muted/80' : 'hover:bg-accent/50'
                        )}
                      >
                        <td
                          className={cn(
                            'sticky left-0 z-20 py-3 px-3 border-r border-b border-border flex items-center justify-between',
                            child.isSubMaster ? 'pl-7 font-bold text-foreground bg-muted cursor-pointer' : 'pl-10 text-muted-foreground font-medium bg-card'
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
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer"
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
                                'py-3 px-2 text-right border-r border-b border-accent font-mono relative transition-colors duration-500 whitespace-nowrap',
                                child.isSubMaster ? 'font-bold text-foreground' : 'text-muted-foreground',
                                viewMode === 'monthly' && i > currentMonthIndex ? 'bg-blue-50/10' : '',
                                isBeyondAutoLimit ? 'bg-accent/30' : '',
                                highlightedCell?.masterIdx === masterIdx && highlightedCell?.childIdx === childIdx && highlightedCell?.colIdx === i ? 'bg-primary/10' : ''
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
                            'py-3 px-2 text-right border-b border-border/50 font-mono whitespace-nowrap',
                            child.isSubMaster ? 'font-bold text-foreground bg-muted' : 'font-semibold text-foreground bg-muted'
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

          <tfoot className="sticky bottom-0 z-40 bg-card shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Saldo Inicial */}
            <tr className="text-foreground">
              <td className="sticky left-0 z-50 bg-accent py-3 px-3 font-semibold border-r border-t-2 border-t-primary border-r-border">
                Saldo Inicial
              </td>
              {saldoInicialMensal.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-semibold border-r border-t-2 border-t-primary border-r-border font-mono bg-accent relative text-foreground whitespace-nowrap"
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
                className="py-3 px-2 text-right font-semibold bg-muted border-t-2 border-t-primary font-mono text-foreground whitespace-nowrap"
              >
                {formatValue(saldoInicialMensal[0], currencyMode)}
              </td>
            </tr>
            {/* Variação de Caixa */}
            <tr className="text-foreground">
              <td className="sticky left-0 z-50 bg-accent py-3 px-3 font-semibold border-r border-t border-border">
                Variação de Caixa (Mensal)
              </td>
              {variacaoCaixa.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-semibold border-r border-t border-border font-mono bg-accent text-foreground whitespace-nowrap"
                >
                  <div className="flex flex-col items-end">
                    <span>{val > 0 ? '+' : ''}{formatValue(val, currencyMode)}</span>
                  </div>
                </td>
              ))}
              <td
                title={formatFullValue(calculateRowTotal(variacaoCaixa), currencyMode)}
                className="py-3 px-2 text-right font-semibold bg-muted border-t border-border font-mono text-foreground whitespace-nowrap"
              >
                {formatValue(calculateRowTotal(variacaoCaixa), currencyMode)}
              </td>
            </tr>
            {/* Saldo em Caixa */}
            <tr className="text-foreground">
              <td className="sticky left-0 z-50 bg-muted py-3 px-3 font-black border-r border-t border-border">
                Saldo em Caixa (Acumulado)
              </td>
              {saldoAcumulado.map((val, i) => visibleColumns[i] && (
                <td
                  key={i}
                  title={formatFullValue(val, currencyMode)}
                  className="py-3 px-2 text-right font-black border-r border-t border-border font-mono bg-muted whitespace-nowrap"
                >
                  <span className={cn(val >= 0 ? 'text-primary' : 'text-destructive')}>
                    {formatValue(val, currencyMode)}
                  </span>
                </td>
              ))}
              <td
                title={formatFullValue(saldoAcumulado[saldoAcumulado.length - 1], currencyMode)}
                className="py-3 px-2 text-right font-black bg-muted border-t border-border font-mono whitespace-nowrap"
              >
                <span className={cn(saldoAcumulado[saldoAcumulado.length - 1] >= 0 ? 'text-primary' : 'text-destructive')}>
                  {formatValue(saldoAcumulado[saldoAcumulado.length - 1], currencyMode)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 bg-accent border-t border-border flex items-center gap-3">
        <Info className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          * Valores realizados até <span className="font-bold text-foreground">Março/2026</span>. Projeções baseadas no planejamento de safra e contratos futuros.
        </p>
      </div>
    </motion.div>
    </>
  );
}
