import React, { useState } from 'react';
import { useBalancoData } from '@/hooks/useBalancoData';
import { useImportedData } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { EmptyDataState } from '@/components/ui/EmptyDataState';
import { GlassCard, TabNav } from '@socios/ui';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BalanceInicioTab } from './BalanceInicioTab';
import { BalanceAtivoTab } from './BalanceAtivoTab';
import { BalancePassivoTab } from './BalancePassivoTab';
import { BalanceIndicadoresTab } from './BalanceIndicadoresTab';

export function BalanceDashboard() {
  const balancoData = useBalancoData();
  const importedAtivo   = balancoData?.ativo   ?? null;
  const importedPassivo = balancoData?.passivo ?? null;
  const columns = balancoData?.columns ?? [];
  const { data: importedData } = useImportedData();
  const { isLoading: importLoading, openFilePicker } = useUniversalImport();
  const hasImportedData = !!importedData.balanco;

  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedFazenda, setSelectedFazenda] = useState('Todas');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState('');
  const [viewMode, setViewMode] = useState('Detalhamento');

  // Sincroniza selectedAvaliacao quando as colunas carregam/mudam
  React.useEffect(() => {
    if (columns.length > 0 && (!selectedAvaliacao || !columns.includes(selectedAvaliacao))) {
      setSelectedAvaliacao(columns[columns.length - 1]);
    }
  }, [columns]);

  return (
    <div className={cn(
      "flex flex-col space-y-4",
      (activeTab === 'ativo' || activeTab === 'passivo') && viewMode === 'Detalhamento' ? "h-[calc(100vh-2rem)] pb-10" : "pb-10"
    )}>
      {/* Header Row: Title */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Balanço Patrimonial</h1>
          <p className="text-slate-600 mt-1 text-lg">Visão geral do ativo, passivo e patrimônio líquido</p>
        </div>
        <ImportButton
          hasData={hasImportedData}
          isLoading={importLoading}
          onClick={openFilePicker}
        />
      </header>

      {/* Controls Row: Tabs + Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 xl:gap-6">
        {/* Tabs Navigation */}
        <TabNav
          tabs={[
            { id: 'inicio', label: 'Início' },
            { id: 'ativo', label: 'Ativo' },
            { id: 'passivo', label: 'Passivo' },
            { id: 'indicadores', label: 'Indicadores' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-3 xl:gap-6 w-full xl:w-auto">
          {/* View Mode Filter (Only for Ativo and Passivo) */}
          {(activeTab === 'ativo' || activeTab === 'passivo') && (
            <div className="flex flex-col gap-1.5 w-full lg:w-auto">
              <span className="text-sm font-medium text-slate-600">Visualização:</span>
              <div className="relative">
                <select 
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full lg:w-48 appearance-none bg-white/60 border border-slate-200/60 shadow-sm text-slate-700 hover:bg-white/80 transition-colors px-4 h-[40px] pr-10 text-sm font-medium rounded-xl outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="Detalhamento">Detalhamento</option>
                  <option value="Tabela">Tabela</option>
                  <option value="Árvore Hierárquica">Árvore Hierárquica</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Fazenda Filter */}
          <div className="flex flex-col gap-1.5 w-full lg:w-auto">
            <span className="text-sm font-medium text-slate-600">Fazenda:</span>
            <div className="relative">
              <select 
                value={selectedFazenda}
                onChange={(e) => setSelectedFazenda(e.target.value)}
                className="w-full lg:w-48 appearance-none bg-white/60 border border-slate-200/60 shadow-sm text-slate-700 hover:bg-white/80 transition-colors px-4 h-[40px] pr-10 text-sm font-medium rounded-xl outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="Todas">Todas</option>
                <option value="Fazenda Boa Vista">Fazenda Boa Vista</option>
                <option value="Fazenda São João">Fazenda São João</option>
                <option value="Fazenda Santa Rita">Fazenda Santa Rita</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Avaliação Filter — populado dinamicamente pelas colunas importadas */}
          {columns.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full lg:w-auto">
              <span className="text-sm font-medium text-slate-600">Coluna:</span>
              <div className="relative">
                <select
                  value={selectedAvaliacao}
                  onChange={(e) => setSelectedAvaliacao(e.target.value)}
                  className="w-full lg:w-48 appearance-none bg-white/60 border border-slate-200/60 shadow-sm text-slate-700 hover:bg-white/80 transition-colors px-4 h-[40px] pr-10 text-sm font-medium rounded-xl outline-none cursor-pointer focus:border-emerald-500"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasImportedData && (
        <EmptyDataState
          module="Balanço Patrimonial"
          description="Importe uma planilha com as abas 'Ativo' e 'Passivo' para visualizar o balanço patrimonial."
          onImport={openFilePicker}
          isLoading={importLoading}
        />
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {hasImportedData && activeTab === 'inicio' && (
          <motion.div 
            key="inicio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <BalanceInicioTab
              ativo={importedAtivo ?? []}
              passivo={importedPassivo ?? []}
              columns={columns}
              selectedColumn={selectedAvaliacao}
            />
          </motion.div>
        )}

        {hasImportedData && activeTab === 'ativo' && (
          <motion.div
            key="ativo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <BalanceAtivoTab viewMode={viewMode} importedTableData={importedAtivo} columns={columns} selectedColumn={selectedAvaliacao} />
          </motion.div>
        )}

        {hasImportedData && activeTab === 'passivo' && (
          <motion.div
            key="passivo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <BalancePassivoTab viewMode={viewMode} importedTableData={importedPassivo} columns={columns} selectedColumn={selectedAvaliacao} />
          </motion.div>
        )}

        {hasImportedData && activeTab === 'indicadores' && (
          <motion.div
            key="indicadores"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <BalanceIndicadoresTab
              ativo={importedAtivo ?? []}
              passivo={importedPassivo ?? []}
              columns={columns}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
