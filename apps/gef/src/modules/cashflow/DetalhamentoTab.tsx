import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@socios/ui';
import { Search, Calendar as CalendarIcon, FileDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { CurrencyMode } from '@/lib/formatters';
import { detalhamentoData } from '@/data/cashflow/detalhamentoData';
import type { TransactionRow } from '@/contexts/ImportDataContext';
import { monthFullNames } from '@/data/cashflow/cashFlowChartData';

interface RadarFilter {
  type: 'entrada' | 'saida' | 'todos';
  preset: 'proximos30';
}

interface DetalhamentoTabProps {
  currencyMode: CurrencyMode;
  initialMonth?: string; // passed when user clicks a chart month
  periodMode?: string;
  radarFilter?: RadarFilter | null;
  transactions?: TransactionRow[];
}

export function DetalhamentoTab({ currencyMode, initialMonth, periodMode = '2026', radarFilter, transactions }: DetalhamentoTabProps) {
  const data = transactions ?? detalhamentoData as TransactionRow[];
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'periodo' | 'unico'>('periodo');
  const [activePreset, setActivePreset] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'limpar' | null>('limpar');
  const [sortConfig, setSortConfig] = useState<{ key: 'data' | 'descricao' | 'categoria' | 'centroCusto' | 'status' | 'valor', direction: 'asc' | 'desc' } | null>({ key: 'data', direction: 'desc' });

  // Apply initialMonth whenever it changes (e.g. user clicked a chart bar)
  useEffect(() => {
    if (!initialMonth) return;

    const monthKeys = Object.keys(monthFullNames);
    const monthIndex = monthKeys.indexOf(initialMonth);
    if (monthIndex === -1) return;

    let yearStr = '2026';
    if (periodMode !== '2026') {
      const isFirstHalf = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].includes(initialMonth);
      yearStr = isFirstHalf ? `20${periodMode.split('/')[0]}` : `20${periodMode.split('/')[1]}`;
    }
    const year = parseInt(yearStr, 10);

    const getLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const startDateObj = new Date(year, monthIndex, 1);
    const endDateObj = new Date(year, monthIndex + 1, 0);

    setTypeFilter('todos');
    setDateFilterMode('periodo');
    setStartDate(getLocalDateStr(startDateObj));
    setEndDate(getLocalDateStr(endDateObj));
    setActivePreset(null);
  }, [initialMonth, periodMode]);

  useEffect(() => {
    if (!radarFilter) return;
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setTypeFilter(radarFilter.type);
    setDateFilterMode('periodo');
    setStartDate(fmt(today));
    setEndDate(fmt(future));
    setActivePreset(null);
  }, [radarFilter]);

  const setPreset = (preset: 'hoje' | 'semana' | 'mes' | 'ano' | 'limpar') => {
    const today = new Date();
    let start = new Date();

    setDateFilterMode('periodo');
    setActivePreset(preset);

    const getLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (preset) {
      case 'hoje':
        start = today;
        break;
      case 'semana':
        start.setDate(today.getDate() - 7);
        break;
      case 'mes':
        start.setDate(1);
        break;
      case 'ano':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'limpar':
        setStartDate('');
        setEndDate('');
        return;
    }

    setStartDate(getLocalDateStr(start));
    setEndDate(getLocalDateStr(today));
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
    setActivePreset(null);
  };

  const handleSort = (key: 'data' | 'descricao' | 'categoria' | 'centroCusto' | 'status' | 'valor') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Categorias únicas derivadas dos dados importados
  const categoriasOptions = useMemo(
    () => ['Todas', ...[...new Set(data.map(t => t.categoria).filter(Boolean))].sort()],
    [data]
  );

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch =
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' || item.tipo === typeFilter;

    const matchesCategoria = categoriaFilter === 'Todas' || item.categoria === categoriaFilter;

    const itemDateStr = item.data;
    let matchesDate = true;

    if (dateFilterMode === 'unico') {
      matchesDate = !startDate || itemDateStr === startDate;
    } else {
      const matchesStartDate = !startDate || itemDateStr >= startDate;
      const matchesEndDate = !endDate || itemDateStr <= endDate;
      matchesDate = matchesStartDate && matchesEndDate;
    }

    return matchesSearch && matchesType && matchesCategoria && matchesDate;
  }), [searchTerm, typeFilter, categoriaFilter, startDate, endDate, dateFilterMode]);

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;

    if (sortConfig.key === 'data') {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (sortConfig.key === 'valor') {
      return sortConfig.direction === 'asc' ? a.valor - b.valor : b.valor - a.valor;
    }

    const valA = String(a[sortConfig.key]).toLowerCase();
    const valB = String(b[sortConfig.key]).toLowerCase();

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;

    return 0;
  }), [filteredData, sortConfig]);

  const totalFiltrado = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.valor, 0),
    [filteredData]
  );

  return (
    <div className="flex flex-col flex-1 space-y-4 min-h-0">
      {/* Toolbar */}
      <GlassCard className="p-3 shrink-0">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          {/* Left: Search and Quick Filters */}
          <div className="flex flex-row flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-xs flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar descrição, fornecedor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Filters (Chips) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setTypeFilter('todos')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  typeFilter === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setTypeFilter('entrada')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  typeFilter === 'entrada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Entradas
              </button>
              <button
                onClick={() => setTypeFilter('saida')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  typeFilter === 'saida' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Saídas
              </button>
            </div>

            {/* Categoria Filter — derivado dos dados importados */}
            {categoriasOptions.length > 1 && (
              <div className="relative shrink-0">
                <select
                  value={categoriaFilter}
                  onChange={e => setCategoriaFilter(e.target.value)}
                  className="appearance-none bg-white/70 border border-slate-200 shadow-sm text-slate-700 hover:bg-white transition-colors pl-3 pr-8 h-[36px] text-xs font-medium rounded-xl outline-none cursor-pointer focus:border-emerald-500 max-w-[160px]"
                >
                  {categoriasOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Right: Period and Export */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                onClick={() => setDateFilterMode('periodo')}
                className={cn(
                  'px-2 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap',
                  dateFilterMode === 'periodo' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Período
              </button>
              <button
                onClick={() => setDateFilterMode('unico')}
                className={cn(
                  'px-2 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap',
                  dateFilterMode === 'unico' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Dia Único
              </button>
            </div>

            {/* Date Inputs */}
            <div className={cn(
              'flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all min-h-[36px] min-w-[140px] shrink-0',
              'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50'
            )}>
              <AnimatePresence mode="wait">
                {dateFilterMode === 'periodo' ? (
                  <motion.div
                    key="periodo"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 w-full"
                  >
                    <div className="flex items-center gap-2 w-full group/date">
                      <div className="flex flex-col flex-1">
                        <span className={cn(
                          'text-[8px] uppercase font-extrabold leading-none mb-0.5',
                          'text-slate-400'
                        )}>Período</span>
                        <div className="relative flex items-center w-full">
                          <Popover>
                            <PopoverTrigger className={cn(
                              'flex items-center justify-between w-full text-left font-bold text-xs bg-transparent border-none outline-none focus:ring-0 p-0 gap-2 cursor-pointer whitespace-nowrap',
                              (startDate || endDate) ? 'text-slate-700' : 'text-slate-400'
                            )}>
                              {startDate ? (
                                endDate ? (
                                  `${format(parseISO(startDate), 'dd/MM/yy')} - ${format(parseISO(endDate), 'dd/MM/yy')}`
                                ) : (
                                  `${format(parseISO(startDate), 'dd/MM/yy')} - Selecione`
                                )
                              ) : (
                                'Selecione'
                              )}
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover/date:text-emerald-500 transition-colors shrink-0" />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="range"
                                selected={{
                                  from: startDate ? parseISO(startDate) : undefined,
                                  to: endDate ? parseISO(endDate) : undefined
                                }}
                                onSelect={(range: any) => {
                                  if (range?.from) {
                                    handleDateChange('start', format(range.from, 'yyyy-MM-dd'));
                                  } else {
                                    handleDateChange('start', '');
                                  }
                                  if (range?.to) {
                                    handleDateChange('end', format(range.to, 'yyyy-MM-dd'));
                                  } else {
                                    handleDateChange('end', '');
                                  }
                                }}
                                initialFocus
                                locale={ptBR}
                                captionLayout="dropdown"
                                startMonth={new Date(2000, 0)}
                                endMonth={new Date(2050, 11)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unico"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 w-full group/date"
                  >
                    <div className="flex flex-col flex-1">
                      <span className={cn(
                        'text-[8px] uppercase font-extrabold leading-none mb-0.5',
                        'text-slate-400'
                      )}>Data Selecionada</span>
                      <div className="relative flex items-center w-full">
                        <Popover>
                          <PopoverTrigger className={cn(
                            'flex items-center justify-between w-full text-left font-bold text-xs bg-transparent border-none outline-none focus:ring-0 p-0 gap-2 cursor-pointer whitespace-nowrap',
                            startDate ? 'text-slate-700' : 'text-slate-400'
                          )}>
                            {startDate ? format(parseISO(startDate), 'dd/MM/yyyy') : 'dd/mm/aaaa'}
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover/date:text-emerald-500 transition-colors shrink-0" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={startDate ? parseISO(startDate) : undefined}
                              onSelect={(d) => handleDateChange('start', d ? format(d, 'yyyy-MM-dd') : '')}
                              initialFocus
                              locale={ptBR}
                              captionLayout="dropdown"
                              startMonth={new Date(2000, 0)}
                              endMonth={new Date(2050, 11)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 mx-1 shrink-0 hidden sm:block" />

            {/* Quick Action Presets */}
            <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100 shrink-0">
              {[
                { id: 'limpar', label: 'Tudo' },
                { id: 'mes', label: 'Mês' },
                { id: 'hoje', label: 'Hoje' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as any)}
                  className={cn(
                    'px-2 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                    activePreset === p.id
                      ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-white/50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 shrink-0 hidden sm:block" />

            <button
              className="flex items-center justify-center p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md h-[36px] w-[36px] cursor-pointer shrink-0"
              title="Exportar"
            >
              <FileDown className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Data Table */}
      <GlassCard className="overflow-hidden border-none shadow-xl flex flex-col flex-1 min-h-[500px]">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('data')}
                >
                  <div className="flex items-center gap-1">
                    Data
                    {sortConfig?.key === 'data' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('descricao')}
                >
                  <div className="flex items-center gap-1">
                    Descrição / Fornecedor
                    {sortConfig?.key === 'descricao' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoria
                    {sortConfig?.key === 'categoria' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('centroCusto')}
                >
                  <div className="flex items-center gap-1">
                    Centro de Custo
                    {sortConfig?.key === 'centroCusto' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {sortConfig?.key === 'status' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('valor')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor
                    {sortConfig?.key === 'valor' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-800" /> : <ArrowDown className="w-3 h-3 text-slate-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedData.length > 0 ? (
                sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {(() => {
                        const [year, month, day] = item.data.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{item.descricao}</span>
                        <span className="text-xs text-slate-400">{item.fornecedor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {item.centroCusto}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        item.status === 'pago' || item.status === 'recebido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.status === 'pendente' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                      )}>
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          item.status === 'pago' || item.status === 'recebido' ? 'bg-emerald-500' :
                            item.status === 'pendente' ? 'bg-amber-500' : 'bg-red-500'
                        )} />
                        {item.status}
                      </span>
                    </td>
                    <td className={cn(
                      'px-6 py-4 text-sm font-bold text-right tabular-nums',
                      item.valor > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {formatCurrency(item.valor, currencyMode)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum lançamento encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary - Fixed at bottom */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="text-sm text-slate-500 font-medium">
            Mostrando <span className="text-slate-800 font-bold">{sortedData.length}</span> de <span className="text-slate-800 font-bold">{data.length}</span> lançamentos
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Filtrado</span>
            <span className={cn(
              'text-base font-bold tabular-nums',
              totalFiltrado >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}>
              {formatCurrency(totalFiltrado, currencyMode)}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
