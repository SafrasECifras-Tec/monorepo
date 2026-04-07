import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TabNav } from '@/components/ui/TabNav';
import { cn } from '@/lib/utils';
import { RealizedProjectedTable } from './RealizedProjectedTable';
import { EstoqueTab } from './EstoqueTab';
import { DetalhamentoTab } from './DetalhamentoTab';
import { CashFlowSummaryCards } from './components/CashFlowSummaryCards';
import { EvoluçaoMensalChart } from './components/EvoluçaoMensalChart';
import { TopCategoriesSection } from './components/TopCategoriesSection';
import { ShortTermRadarCard } from './components/ShortTermRadarCard';
import type { CurrencyMode } from '@/lib/formatters';
import type { CropStock } from '@/data/cashflow/estoqueData';
import { MONTHS_PT } from '@/lib/formatters';
import { monthFullNames } from '@/data/cashflow/cashFlowChartData';
import { emptyData, recalculateData, generateAnnualData, buildMonthlyFromTransactions, buildMonthlyFromAggregated } from '@/data/cashflow/realizedProjectedData';
import type { CategoryData } from '@/data/cashflow/realizedProjectedData';
import { useFluxoCaixaData } from '@/hooks/useFluxoCaixaData';
import { useEstoqueData } from '@/hooks/useEstoqueData';
import { useCashFlowChartData } from '@/hooks/useCashFlowChartData';
import { useImportedData } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { EmptyDataState } from '@/components/ui/EmptyDataState';

const totalSaidasComposicao = 0; // Removed composicaoSaidas data

export function CashFlowDashboard() {
  const transactions = useFluxoCaixaData();
  const estoqueBase = useEstoqueData();
  const { data: importedData } = useImportedData();
  const { isLoading: importLoading, openFilePicker } = useUniversalImport();
  const hasImportedData = !!importedData.fluxoCaixa || !!importedData.fluxoAgregado;
  const agregadoRows    = importedData.fluxoAgregado?.rows ?? null;

  const importedSaldoInicial = importedData.fluxoCaixa?.saldoInicial;

  const [saldoInicial, setSaldoInicialState] = useState<number>(() => {
    if (importedSaldoInicial != null) return importedSaldoInicial;
    const saved = localStorage.getItem('gef_saldo_inicial');
    return saved ? parseFloat(saved) : 1500000;
  });
  const handleSaldoInicialChange = (v: number) => {
    setSaldoInicialState(v);
    localStorage.setItem('gef_saldo_inicial', String(v));
  };

  // Sincroniza saldo inicial quando um novo import chega com valor definido
  useEffect(() => {
    if (importedSaldoInicial != null) {
      setSaldoInicialState(importedSaldoInicial);
      localStorage.setItem('gef_saldo_inicial', String(importedSaldoInicial));
    }
  }, [importedSaldoInicial]);

  const { cashFlowData, annualTotals, topSaidas, topEntradas, shortTermLiquidity } = useCashFlowChartData(transactions ?? [], saldoInicial);

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('BRL');
  const [periodMode, setPeriodMode] = useState('2026');
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedDetalhamentoMonth, setSelectedDetalhamentoMonth] = useState<string | undefined>(undefined);
  const [radarFilter, setRadarFilter] = useState<{ type: 'entrada' | 'saida' | 'todos'; preset: 'proximos30' } | null>(null);
  const [stockData, setStockData] = useState<CropStock[]>(() => (estoqueBase ?? []).map(c => ({ ...c, sales: [...c.sales] })));

  // Sincroniza stockData quando estoqueBase muda (ex: dados importados ou removidos)
  useEffect(() => {
    setStockData((estoqueBase ?? []).map(c => ({ ...c, sales: [...c.sales] })));
  }, [estoqueBase]);

  // Reinicializa Realizado/Projetado quando dados importados mudam.
  // Prioridade: fluxoAgregado > transactions (evita duplicação).
  useEffect(() => {
    let built = null;

    if (agregadoRows?.length) {
      // Modo agregado: usa buildMonthlyFromAggregated (realizado/orçado já separados)
      built = buildMonthlyFromAggregated(agregadoRows);
    } else if (transactions?.length) {
      // Modo lançamento a lançamento: comportamento original
      built = buildMonthlyFromTransactions(transactions);
    }

    if (!built) return;
    setMonthlyData(built);
    setAnnualData(recalculateData(generateAnnualData(built)));
    setSaldoOverridesMonthly({});
    setSaldoOverridesAnnual({});
  }, [transactions, agregadoRows]);
  const [monthlyData, setMonthlyData] = useState<CategoryData[]>(() => recalculateData(emptyData()));
  const [annualData, setAnnualData] = useState<CategoryData[]>(() => recalculateData(generateAnnualData(emptyData())));
  const [saldoOverridesMonthly, setSaldoOverridesMonthly] = useState<Record<number, number>>({});
  const [saldoOverridesAnnual, setSaldoOverridesAnnual] = useState<Record<number, number>>({});

  const handleStockUpdate = (cropName: string, quantity: number, avgPrice: number, totalValue: number, monthIndex: number) => {
    const day = `01/${String(monthIndex + 1).padStart(2, '0')}/2026`;
    setStockData(prev => prev.map(crop => {
      if (crop.name.toLowerCase() !== cropName.toLowerCase()) return crop;
      return {
        ...crop,
        soldStock: crop.soldStock + quantity,
        sales: [{ date: day, quantity, avgPrice, totalValue }, ...crop.sales],
      };
    }));
  };

  const handleRadarClick = (type: 'entrada' | 'saida') => {
    setRadarFilter({ type, preset: 'proximos30' });
    setSelectedDetalhamentoMonth(undefined);
    setActiveTab('detalhamento');
  };

  const handleMonthClick = (monthLabel: string) => {
    if (!monthLabel) return;
    const monthKeys = Object.keys(monthFullNames);
    if (monthKeys.indexOf(monthLabel) === -1) return;

    setRadarFilter(null);                        // limpa filtro do Radar
    setSelectedDetalhamentoMonth(monthLabel);
    setActiveTab('detalhamento');
  };

  const summaryValues = useMemo(() => {
    const { totalEntradas, totalSaidas } = annualTotals;
    const saldoFinalProjetado = saldoInicial + totalEntradas - totalSaidas;
    return { saldoInicial, totalEntradas, totalSaidas, saldoFinalProjetado };
  }, [annualTotals, saldoInicial]);

  return (
    <div className={cn(
      'flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000',
      (activeTab === 'detalhamento' || activeTab === 'realizado_projetado') ? 'h-[calc(100vh-2rem)] -mb-8 overflow-hidden' : 'pb-6'
    )}>
      {/* Header Row: Title */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground mt-1">Acompanhamento financeiro e projeções</p>
        </div>
        <ImportButton
          hasData={hasImportedData}
          isLoading={importLoading}
          onClick={openFilePicker}
        />
      </header>

      {/* Controls Row: Tabs + Filters + Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        {/* Tabs Navigation */}
        <TabNav
          tabs={[
            { id: 'inicio', label: 'Início' },
            { id: 'detalhamento', label: 'Detalhamento' },
            { id: 'realizado_projetado', label: 'Realizado/Projetado' },
            { id: 'estoque', label: 'Estoque' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>


      {/* Empty state quando não há dados importados */}
      {!hasImportedData && (
        <EmptyDataState
          module="Fluxo de Caixa"
          description="Importe uma planilha com a aba 'Transações' para visualizar entradas, saídas e saldo acumulado."
          onImport={openFilePicker}
          isLoading={importLoading}
        />
      )}

      {/* Content based on active tab */}
      <AnimatePresence mode="sync">
        {hasImportedData && activeTab === 'inicio' && (
          <motion.div
            key="inicio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 4 Smart Cards */}
            <CashFlowSummaryCards
              saldoInicial={summaryValues.saldoInicial}
              totalEntradas={summaryValues.totalEntradas}
              totalSaidas={summaryValues.totalSaidas}
              saldoFinalProjetado={summaryValues.saldoFinalProjetado}
              currencyMode={currencyMode}
            />

            {/* Charts Section */}
            <div className="flex flex-col gap-6">
              {/* Main Area Chart (Evolução Mensal) */}
              <EvoluçaoMensalChart
                data={cashFlowData}
                currencyMode={currencyMode}
                onMonthClick={handleMonthClick}
                periodMode={periodMode}
              />

              {/* New Grid: Top 5 and Short-Term Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopCategoriesSection
                  topSaidas={topSaidas}
                  topEntradas={topEntradas}
                  currencyMode={currencyMode}
                />

                <ShortTermRadarCard
                  data={shortTermLiquidity}
                  currencyMode={currencyMode}
                  onClickAPagar={() => handleRadarClick('saida')}
                  onClickAReceber={() => handleRadarClick('entrada')}
                  onClickVerDetalhado={() => handleRadarClick('todos')}
                />
              </div>
            </div>
          </motion.div>
        )}

        {hasImportedData && activeTab === 'realizado_projetado' && (
          <motion.div
            key="realizado_projetado"
            className="flex-1 min-h-0 pb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <RealizedProjectedTable
              currencyMode={currencyMode}
              stockData={stockData}
              onStockUpdate={handleStockUpdate}
              monthlyData={monthlyData}
              setMonthlyData={setMonthlyData}
              annualData={annualData}
              setAnnualData={setAnnualData}
              saldoOverridesMonthly={saldoOverridesMonthly}
              setSaldoOverridesMonthly={setSaldoOverridesMonthly}
              saldoOverridesAnnual={saldoOverridesAnnual}
              setSaldoOverridesAnnual={setSaldoOverridesAnnual}
              saldoInicial={saldoInicial}
              onSaldoInicialChange={handleSaldoInicialChange}
            />
          </motion.div>
        )}

        {hasImportedData && activeTab === 'estoque' && (
          <motion.div
            key="estoque"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <EstoqueTab stockData={stockData} />
          </motion.div>
        )}

        {/* Aba de Projeção ocultada temporariamente
        {activeTab === 'projecao' && (
          <motion.div
            key="projecao"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <ProjectionDashboard hideTitle={true} />
          </motion.div>
        )}
        */}

        {hasImportedData && activeTab === 'detalhamento' && (
          <motion.div
            key="detalhamento"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 space-y-4 min-h-0"
          >
            <DetalhamentoTab
              currencyMode={currencyMode}
              initialMonth={selectedDetalhamentoMonth}
              periodMode={periodMode}
              radarFilter={radarFilter}
              transactions={transactions}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
