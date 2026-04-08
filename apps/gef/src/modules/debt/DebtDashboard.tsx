import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Wallet, DollarSign, Percent, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DebtDetailsTab } from './DebtDetailsTab';
import { DebtBancosTab } from './DebtBancosTab';
import { DebtIndicadoresTab } from './DebtIndicadoresTab';
import {
  EndividamentoPorSafraChart,
  HistoricoEndividamentoChart,
  DebtSafraTable,
  DebtFilters,
} from './components';
import type { IndicatorRow } from '@/data/debt/debtDashboardData';
import type { BancoItem } from '@/data/debt/debtBancosData';
import type { EndividamentoPorSafraItem, HistoricoEndividamentoItem } from '@/data/debt/debtChartData';
import { useImportedData } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { EmptyDataState } from '@/components/ui/EmptyDataState';
import { useEndividamentoData } from '@/hooks/useEndividamentoData';

// ─── Helpers de parse do campo mesAno ("Jan-26", "Dez-25", ...) ──────────────
const MONTH_ABBR: Record<string, number> = {
  Jan:0, Fev:1, Mar:2, Abr:3, Mai:4, Jun:5,
  Jul:6, Ago:7, Set:8, Out:9, Nov:10, Dez:11,
  Feb:1, Apr:3, May:4, Aug:7, Sep:8, Oct:9, Dec:11,
};

function mesAnoToDate(mesAno: string): Date {
  const [mon, yr] = mesAno.split('-');
  const month = MONTH_ABBR[mon] ?? 0;
  const year  = 2000 + parseInt(yr ?? '0', 10);
  return new Date(year, month, 1);
}

function mesAnoToAno(mesAno: string): string {
  const parts = mesAno.split('-');
  return parts.length === 2 ? `20${parts[1]}` : mesAno;
}

function mesAnoToSafra(mesAno: string): string {
  const d     = mesAnoToDate(mesAno);
  const month = d.getMonth(); // 0-based
  const year  = d.getFullYear();
  // Jul-Dez → começo da safra; Jan-Jun → fim da safra anterior
  if (month >= 6) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

const TABS = [
  { id: 'inicio',      label: 'Início' },
  { id: 'detalhes',   label: 'Detalhes' },
  { id: 'bancos',     label: 'Bancos' },
  { id: 'indicadores', label: 'Indicadores' },
];

export function DebtDashboard() {
  const { data: importedData } = useImportedData();
  const { isLoading: importLoading, openFilePicker } = useUniversalImport();
  const hasImportedData = !!importedData.endividamento;
  const endividamentoData = useEndividamentoData();
  const parcelas = endividamentoData?.parcelas ?? [];

  const [activeTab,         setActiveTab]         = useState('inicio');
  const [selectedAno,       setSelectedAno]       = useState('Todos');
  const [selectedSafra,     setSelectedSafra]     = useState('Todas');
  const [currencyMode,      setCurrencyMode]      = useState<'BRL' | 'SOJA'>('BRL');
  const [pagoMode,          setPagoMode]          = useState<'Todos' | 'Sim' | 'Não'>('Todos');
  const [selectedBanco,     setSelectedBanco]     = useState('Todos');
  const [analisarPor,       setAnalisarPor]       = useState<'Valores Médios' | 'Valores Projetados'>('Valores Médios');
  const [analisarPorInicio, setAnalisarPorInicio] = useState<'Ano' | 'Safra'>('Safra');
  const [selectedTipos,     setSelectedTipos]     = useState<string[]>([]);
  const [sojaPrice,         setSojaPrice]         = useState<number>(() => {
    const saved = localStorage.getItem('gef_soja_price');
    return saved ? parseFloat(saved) : 120;
  });
  const handleSojaPriceChange = (v: number) => {
    setSojaPrice(v);
    localStorage.setItem('gef_soja_price', String(v));
  };

  // ─── Opções dinâmicas derivadas das parcelas importadas ──────────────────────
  const anosOptions  = useMemo(() => [...new Set(parcelas.map(p => mesAnoToAno(p.mesAno)))].sort(), [parcelas]);
  const safrasOptions = useMemo(() => [...new Set(parcelas.map(p => mesAnoToSafra(p.mesAno)))].sort(), [parcelas]);
  const bancosOptions = useMemo(() => [...new Set(parcelas.map(p => p.banco))].sort(), [parcelas]);
  const tiposOptions  = useMemo(() => [...new Set(parcelas.map(p => p.tipo))].sort(), [parcelas]);

  // Inicializa tipos selecionados quando as parcelas carregam (todos por padrão)
  useEffect(() => {
    if (tiposOptions.length > 0 && selectedTipos.length === 0) {
      setSelectedTipos(tiposOptions);
    }
  }, [tiposOptions]);

  // ─── Filtragem real (row-level) ───────────────────────────────────────────────
  const TODAY = useMemo(() => new Date(), []);

  const filteredParcelas = useMemo(() => {
    return parcelas.filter(p => {
      // Filtro por Ano
      if (selectedAno !== 'Todos' && mesAnoToAno(p.mesAno) !== selectedAno) return false;
      // Filtro por Safra
      if (selectedSafra !== 'Todas' && mesAnoToSafra(p.mesAno) !== selectedSafra) return false;
      // Filtro por Banco
      if (selectedBanco !== 'Todos' && p.banco !== selectedBanco) return false;
      // Filtro por Tipo (multi-select)
      if (selectedTipos.length > 0 && !selectedTipos.includes(p.tipo)) return false;
      // Filtro por Pago (baseado na data de vencimento vs hoje)
      if (pagoMode !== 'Todos') {
        const venc = mesAnoToDate(p.mesAno);
        const isPago = venc < TODAY;
        if (pagoMode === 'Sim' && !isPago) return false;
        if (pagoMode === 'Não' && isPago) return false;
      }
      return true;
    });
  }, [parcelas, selectedAno, selectedSafra, selectedBanco, selectedTipos, pagoMode, TODAY]);

  // ─── KPI totals das parcelas filtradas ───────────────────────────────────────
  const totais = useMemo(() => {
    const totalEndividamento = filteredParcelas.reduce((s, p) => s + p.total, 0);
    const totalPrincipal     = filteredParcelas.reduce((s, p) => s + p.principal, 0);
    const totalJuros         = filteredParcelas.reduce((s, p) => s + p.juros, 0);
    const pesoTotal          = totalEndividamento;
    const taxaEfetiva        = pesoTotal > 0
      ? filteredParcelas.reduce((s, p) => s + p.taxa * p.total, 0) / pesoTotal
      : 0;
    return { totalEndividamento, totalPrincipal, totalJuros, taxaEfetiva };
  }, [filteredParcelas]);

  const { totalEndividamento, totalPrincipal, totalJuros, taxaEfetiva } = totais;

  // ─── Curto vs Longo Prazo (12 meses) — derivado das parcelas filtradas ───────
  const filteredTermData = useMemo(() => {
    const cutoff = new Date(TODAY);
    cutoff.setMonth(cutoff.getMonth() + 12);
    const curto  = filteredParcelas.filter(p => mesAnoToDate(p.mesAno) <= cutoff);
    const longo  = filteredParcelas.filter(p => mesAnoToDate(p.mesAno) >  cutoff);
    const totalG = filteredParcelas.reduce((s, p) => s + p.principal, 0) || 1;
    const curtoV = curto.reduce((s, p) => s + p.principal, 0);
    const longoV = longo.reduce((s, p) => s + p.principal, 0);
    return [
      { name: 'Curto Prazo (até 12 meses)', value: curtoV, percent: Math.round(curtoV / totalG * 1000) / 10, color: '#3b82f6' },
      { name: 'Longo Prazo',                value: longoV, percent: Math.round(longoV / totalG * 1000) / 10, color: '#8b5cf6' },
    ].filter(d => d.value > 0);
  }, [filteredParcelas, TODAY]);

  // ─── Bancos Tab — cards derivados das parcelas filtradas ─────────────────────
  const bancosTabData = useMemo((): BancoItem[] => {
    const grouped = new Map<string, { endividamento: number; principal: number; juros: number; taxa_peso: number; peso: number }>();
    filteredParcelas.forEach(p => {
      const g = grouped.get(p.banco) ?? { endividamento: 0, principal: 0, juros: 0, taxa_peso: 0, peso: 0 };
      g.endividamento += p.total;
      g.principal     += p.principal;
      g.juros         += p.juros;
      g.taxa_peso     += p.taxa * p.total;
      g.peso          += p.total;
      grouped.set(p.banco, g);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, g]) => ({
      name,
      endividamento: g.endividamento,
      principal:     g.principal,
      juros:         g.juros,
      taxa:          g.peso > 0 ? g.taxa_peso / g.peso : 0,
      logoUrl:       `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=475569`,
    }));
  }, [filteredParcelas]);

  // ─── Tabela por Ano/Safra — derivada das parcelas filtradas ──────────────────
  const filteredIndicatorsData = useMemo((): IndicatorRow[] => {
    const key = (p: { mesAno: string }) =>
      analisarPorInicio === 'Safra' ? mesAnoToSafra(p.mesAno) : mesAnoToAno(p.mesAno);

    const grouped = new Map<string, { endividamento: number; principal: number; juros: number; taxa_peso: number; peso: number }>();
    filteredParcelas.forEach(p => {
      const k = key(p);
      const g = grouped.get(k) ?? { endividamento: 0, principal: 0, juros: 0, taxa_peso: 0, peso: 0 };
      g.endividamento += p.total;
      g.principal     += p.principal;
      g.juros         += p.juros;
      g.taxa_peso     += p.taxa * p.total;
      g.peso          += p.total;
      grouped.set(k, g);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, g]) => ({
        safra:         k,
        endividamento: g.endividamento,
        principal:     g.principal,
        juros:         g.juros,
        taxa:          g.peso > 0 ? g.taxa_peso / g.peso : 0,
      }));
  }, [filteredParcelas, analisarPorInicio]);

  // ─── Endividamento por Safra — chart data derivado das parcelas filtradas ────
  const endividamentoPorSafraChartData = useMemo((): EndividamentoPorSafraItem[] => {
    if (!filteredParcelas.length) return [];
    const grouped = new Map<string, { custeios: number; investimentos: number; investimentosDolar: number }>();
    filteredParcelas.forEach(p => {
      const safra = mesAnoToSafra(p.mesAno);
      const g = grouped.get(safra) ?? { custeios: 0, investimentos: 0, investimentosDolar: 0 };
      const tipoLower = p.tipo.toLowerCase();
      if (tipoLower.includes('custeio')) g.custeios += p.total;
      else g.investimentos += p.total;
      grouped.set(safra, g);
    });
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([safra, g]) => ({
        safra: `Safra ${safra}`,
        custeios: g.custeios,
        investimentos: g.investimentos,
        investimentosDolar: g.investimentosDolar,
        total: g.custeios + g.investimentos + g.investimentosDolar,
      }));
  }, [filteredParcelas]);

  // ─── Histórico do Endividamento — chart data derivado de TODAS as parcelas ───
  const historicoChartData = useMemo((): HistoricoEndividamentoItem[] => {
    if (!parcelas.length) return [];
    const grouped = new Map<string, { compraDeTerras: number; custeios: number; investimentos: number; investimentosDolar: number }>();
    parcelas.forEach(p => {
      const ano = mesAnoToAno(p.mesAno);
      const g = grouped.get(ano) ?? { compraDeTerras: 0, custeios: 0, investimentos: 0, investimentosDolar: 0 };
      const tipoLower = p.tipo.toLowerCase();
      if (tipoLower.includes('custeio')) g.custeios += p.total;
      else if (tipoLower.includes('fazenda') || tipoLower.includes('terra')) g.compraDeTerras += p.total;
      else g.investimentos += p.total;
      grouped.set(ano, g);
    });
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ano, g]) => ({
        data: ano,
        compraDeTerras: g.compraDeTerras,
        custeios: g.custeios,
        investimentos: g.investimentos,
        investimentosDolar: g.investimentosDolar,
        total: g.compraDeTerras + g.custeios + g.investimentos + g.investimentosDolar,
      }));
  }, [parcelas]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Endividamento</h1>
          <p className="text-slate-500 mt-1">Visão geral e projeção de dívidas</p>
        </div>
        <ImportButton
          hasData={hasImportedData}
          isLoading={importLoading}
          onClick={openFilePicker}
        />
      </header>

      {/* Tabs + Filters */}
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
        {/* Linha 1 / esquerda em 2xl: Tab nav */}
        <div className="flex overflow-x-auto custom-scrollbar shrink-0">
          <GlassCard className="p-1 flex items-center gap-1 w-fit bg-white/60 border border-slate-200/60 shadow-sm rounded-xl shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-white text-[#059669] shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40',
                )}
              >
                {tab.label}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Linha 2: Filtros */}
        <DebtFilters
          activeTab={activeTab}
          analisarPorInicio={analisarPorInicio} setAnalisarPorInicio={setAnalisarPorInicio}
          analisarPor={analisarPor}             setAnalisarPor={setAnalisarPor}
          selectedAno={selectedAno}             setSelectedAno={setSelectedAno}
          anosOptions={anosOptions}
          selectedSafra={selectedSafra}         setSelectedSafra={setSelectedSafra}
          safrasOptions={safrasOptions}
          selectedBanco={selectedBanco}         setSelectedBanco={setSelectedBanco}
          bancosOptions={bancosOptions}
          currencyMode={currencyMode}           setCurrencyMode={setCurrencyMode}
          sojaPrice={sojaPrice}                 onSojaPriceChange={handleSojaPriceChange}
          selectedTipos={selectedTipos}         setSelectedTipos={setSelectedTipos}
          tiposOptions={tiposOptions}
          pagoMode={pagoMode}                   setPagoMode={setPagoMode}
        />
      </div>

      {/* Empty state */}
      {!hasImportedData && (
        <EmptyDataState
          module="Endividamento"
          description="Importe uma planilha com a aba 'Parcelas' para visualizar dívidas, parcelas e indicadores."
          onImport={openFilePicker}
          isLoading={importLoading}
        />
      )}

      {/* KPI Cards */}
      {hasImportedData && (<>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-slate-800" />
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Endividamento</span>
          </div>
          <div className="text-xl lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
            {formatCurrency(totalEndividamento, currencyMode)}
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-slate-800" />
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Valor Principal</span>
          </div>
          <div className="text-xl lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
            {formatCurrency(totalPrincipal, currencyMode)}
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-slate-800" />
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Juros</span>
          </div>
          <div className="text-xl lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
            {formatCurrency(totalJuros, currencyMode)}
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="h-5 w-5 text-slate-800" />
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Taxa Efetiva</span>
          </div>
          <div className="text-xl lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
            {taxaEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
        </GlassCard>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'inicio' && (
          <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EndividamentoPorSafraChart data={endividamentoPorSafraChartData} currencyMode={currencyMode} sojaPrice={sojaPrice} />

              {/* Valores por Horizonte */}
              <GlassCard className="p-6 flex flex-col hover:shadow-md transition-all duration-300">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#1e3a29]">Valores por Horizonte</h3>
                  <p className="text-sm text-slate-400 mt-1">Principal sem juros por prazo</p>
                </div>
                <div className="flex flex-col gap-8">
                  {filteredTermData.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-600">{item.name}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>{formatCurrency(item.value, currencyMode)}</span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{item.percent}% do total</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-5 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Total Principal</span>
                  <span className="text-lg font-bold text-[#1e3a29]">
                    {formatCurrency(filteredTermData.reduce((acc, d) => acc + d.value, 0), currencyMode)}
                  </span>
                </div>
              </GlassCard>
            </div>

            <HistoricoEndividamentoChart data={historicoChartData} currencyMode={currencyMode} sojaPrice={sojaPrice} />

            <DebtSafraTable data={filteredIndicatorsData} currencyMode={currencyMode} />
          </motion.div>
        )}

        {activeTab === 'detalhes' && (
          <motion.div key="detalhes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <DebtDetailsTab currencyMode={currencyMode} filteredParcelas={filteredParcelas} />
          </motion.div>
        )}

        {activeTab === 'indicadores' && (
          <motion.div key="indicadores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <DebtIndicadoresTab currencyMode={currencyMode} analisarPor={analisarPor} />
          </motion.div>
        )}

        {activeTab === 'bancos' && (
          <motion.div key="bancos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <DebtBancosTab currencyMode={currencyMode} data={bancosTabData} />
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </div>
  );
}
