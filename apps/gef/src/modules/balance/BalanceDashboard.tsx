import React, { useState, useRef, useEffect } from 'react';
import { useBalancoData } from '@/hooks/useBalancoData';
import { useImportedData } from '@/contexts/ImportDataContext';
import type { BalanceTableRow } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { EmptyDataState } from '@/components/ui/EmptyDataState';
import { GlassCard, TabNav } from '@socios/ui';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { motion, AnimatePresence } from 'motion/react';
import { BalanceInicioTab } from './BalanceInicioTab';
import { BalanceAtivoTab } from './BalanceAtivoTab';
import { BalancePassivoTab } from './BalancePassivoTab';
import { BalanceIndicadoresTab } from './BalanceIndicadoresTab';

// Filtra a árvore por fazenda — linhas sem fazenda (grupos/subgrupos) sempre passam
function filterTree(rows: BalanceTableRow[], fazenda: string): BalanceTableRow[] {
  if (fazenda === 'Todas') return rows;
  return rows.reduce<BalanceTableRow[]>((acc, row) => {
    if (row.children) {
      const filteredChildren = filterTree(row.children, fazenda);
      if (filteredChildren.length > 0) acc.push({ ...row, children: filteredChildren });
    } else if (!row.fazenda || row.fazenda === fazenda) {
      acc.push(row);
    }
    return acc;
  }, []);
}

export function BalanceDashboard() {
  const balancoData = useBalancoData();
  const { data: importedData } = useImportedData();
  const { isLoading: importLoading, openFilePicker } = useUniversalImport();
  const hasImportedData = !!importedData.balanco;

  const columns  = balancoData?.columns  ?? [];
  const fazendas = balancoData?.fazendas ?? [];

  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedFazenda, setSelectedFazenda] = useState('Todas');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState('');
  const [viewMode, setViewMode] = useState('Detalhamento');
  const [isNavSticky, setIsNavSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsNavSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const importedAtivo   = React.useMemo(
    () => balancoData ? filterTree(balancoData.ativo,   selectedFazenda) : null,
    [balancoData, selectedFazenda],
  );
  const importedPassivo = React.useMemo(
    () => balancoData ? filterTree(balancoData.passivo, selectedFazenda) : null,
    [balancoData, selectedFazenda],
  );

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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Balanço Patrimonial</h1>
          <p className="text-muted-foreground mt-1">Visão geral do ativo, passivo e patrimônio líquido</p>
        </div>
        <ImportButton
          hasData={hasImportedData}
          isLoading={importLoading}
          onClick={openFilePicker}
        />
      </header>

      {/* Sentinel para detectar scroll */}
      <div ref={sentinelRef} className="h-px -mt-4" />

      {/* Controls Row: Tabs + Filters */}
      <div className={cn(
        'flex flex-row items-center justify-between gap-4 xl:gap-6 sticky top-0 z-40 transition-all duration-300 rounded-2xl',
        isNavSticky
          ? 'backdrop-blur-xl bg-white/90 border border-slate-200/60 shadow-lg shadow-slate-100/30 -mx-2 px-5 py-3'
          : 'py-0'
      )}>
          {/* Tabs Navigation */}
          <div className="flex flex-col gap-1.5">
            {isNavSticky && <span className="text-sm font-medium text-muted-foreground">Balanço Patrimonial</span>}
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
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-3 xl:gap-6 w-full xl:w-auto">
            {/* View Mode Filter (Only for Ativo and Passivo) */}
            {(activeTab === 'ativo' || activeTab === 'passivo') && (
              <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                <span className="text-sm font-medium text-muted-foreground">Visualização:</span>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="h-10 w-full lg:w-48 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Detalhamento">Detalhamento</SelectItem>
                    <SelectItem value="Tabela">Tabela</SelectItem>
                    <SelectItem value="Árvore Hierárquica">Árvore Hierárquica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fazenda Filter — apenas se a planilha tiver coluna Fazenda */}
            {fazendas.length > 0 && (
              <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                <span className="text-sm font-medium text-muted-foreground">Fazenda:</span>
                <Select value={selectedFazenda} onValueChange={setSelectedFazenda}>
                  <SelectTrigger className="h-10 w-full lg:w-48 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Todas">Todas</SelectItem>
                    {fazendas.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Avaliação Filter — populado dinamicamente pelas colunas importadas */}
            {columns.length > 0 && (
              <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                <span className="text-sm font-medium text-muted-foreground">Avaliação:</span>
                <Select value={selectedAvaliacao} onValueChange={setSelectedAvaliacao}>
                  <SelectTrigger className="h-10 w-full lg:w-48 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[...columns].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                  </SelectContent>
                </Select>
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
