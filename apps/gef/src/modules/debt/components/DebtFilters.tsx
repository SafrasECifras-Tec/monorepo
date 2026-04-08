import React, { useRef, useEffect } from 'react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { ChevronDown, Eraser } from 'lucide-react';

interface Props {
  activeTab: string;
  analisarPorInicio: 'Ano' | 'Safra';
  setAnalisarPorInicio: (v: 'Ano' | 'Safra') => void;
  analisarPor: 'Valores Médios' | 'Valores Projetados';
  setAnalisarPor: (v: 'Valores Médios' | 'Valores Projetados') => void;
  selectedAno: string;
  setSelectedAno: (v: string) => void;
  anosOptions: string[];
  selectedSafra: string;
  setSelectedSafra: (v: string) => void;
  safrasOptions: string[];
  selectedBanco: string;
  setSelectedBanco: (v: string) => void;
  bancosOptions: string[];
  currencyMode: 'BRL' | 'SOJA';
  setCurrencyMode: (v: 'BRL' | 'SOJA') => void;
  sojaPrice?: number;
  onSojaPriceChange?: (v: number) => void;
  selectedTipos: string[];
  setSelectedTipos: (v: string[]) => void;
  tiposOptions: string[];
  pagoMode: 'Todos' | 'Sim' | 'Não';
  setPagoMode: (v: 'Todos' | 'Sim' | 'Não') => void;
}

const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">{children}</div>
);

const SelectIcon = () => (
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
);

const selectClass = 'appearance-none bg-card/60 border border-border/60 shadow-soft text-foreground hover:bg-card/80 transition-colors px-4 h-[40px] pr-10 text-sm font-medium rounded-xl outline-none cursor-pointer focus:border-primary';

const tabBtnClass = (active: boolean) => cn(
  'flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap',
  active ? 'bg-card text-primary shadow-soft border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-card/40',
);

export function DebtFilters({
  activeTab,
  analisarPorInicio, setAnalisarPorInicio,
  analisarPor, setAnalisarPor,
  selectedAno, setSelectedAno, anosOptions,
  selectedSafra, setSelectedSafra, safrasOptions,
  selectedBanco, setSelectedBanco, bancosOptions,
  currencyMode, setCurrencyMode,
  sojaPrice = 120, onSojaPriceChange,
  selectedTipos, setSelectedTipos, tiposOptions,
  pagoMode, setPagoMode,
}: Props) {
  const [isTipoOpen, setIsTipoOpen] = React.useState(false);
  const tipoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (tipoRef.current && !tipoRef.current.contains(e.target as Node)) {
        setIsTipoOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleTipoToggle = (tipo: string) =>
    setSelectedTipos(
      selectedTipos.includes(tipo)
        ? selectedTipos.filter(t => t !== tipo)
        : [...selectedTipos, tipo],
    );

  const handleSelectAll = () =>
    setSelectedTipos(selectedTipos.length === tiposOptions.length ? [] : [...tiposOptions]);

  return (
    <div className="flex flex-wrap items-end gap-3">

      {/* Analisar por — Início */}
      {activeTab === 'inicio' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Analisar por:</span>
          <GlassCard className="p-1 flex items-center gap-1 w-fit bg-card/60 border border-border/60 shadow-soft rounded-xl">
            {(['Safra', 'Ano'] as const).map(opt => (
              <button key={opt} onClick={() => setAnalisarPorInicio(opt)} className={tabBtnClass(analisarPorInicio === opt)}>{opt}</button>
            ))}
          </GlassCard>
        </div>
      )}

      {/* Ano — Detalhes */}
      {activeTab === 'detalhes' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Ano:</span>
          <SelectWrapper>
            <select value={selectedAno} onChange={e => setSelectedAno(e.target.value)} className={cn(selectClass, 'w-32')}>
              <option value="Todos">Todos</option>
              {anosOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <SelectIcon />
          </SelectWrapper>
        </div>
      )}

      {/* Safra */}
      {activeTab !== 'bancos' && activeTab !== 'indicadores' && activeTab !== 'inicio' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Safra:</span>
          <SelectWrapper>
            <select value={selectedSafra} onChange={e => setSelectedSafra(e.target.value)} className={cn(selectClass, 'w-36')}>
              <option value="Todas">Todas</option>
              {safrasOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <SelectIcon />
          </SelectWrapper>
        </div>
      )}

      {/* Analisar por — Indicadores */}
      {activeTab === 'indicadores' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Analisar por:</span>
          <GlassCard className="p-1 flex items-center gap-1 w-fit bg-card/60 border border-border/60 shadow-soft rounded-xl overflow-x-auto custom-scrollbar">
            {(['Valores Médios', 'Valores Projetados'] as const).map(opt => (
              <button key={opt} onClick={() => setAnalisarPor(opt)} className={tabBtnClass(analisarPor === opt)}>{opt}</button>
            ))}
          </GlassCard>
        </div>
      )}

      {/* Banco — Bancos + Início */}
      {(activeTab === 'bancos' || activeTab === 'inicio') && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Banco:</span>
          <SelectWrapper>
            <select value={selectedBanco} onChange={e => setSelectedBanco(e.target.value)} className={cn(selectClass, 'w-48')}>
              <option value="Todos">Todos</option>
              {bancosOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <SelectIcon />
          </SelectWrapper>
        </div>
      )}

      {/* Moeda + preço da soja */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Moeda:</span>
        <div className="flex items-center gap-2">
          <SelectWrapper>
            <select value={currencyMode} onChange={e => setCurrencyMode(e.target.value as 'BRL' | 'SOJA')} className={cn(selectClass, 'w-28 px-3 pr-8')}>
              <option value="BRL">Reais</option>
              <option value="SOJA">Saca de Soja</option>
            </select>
            <SelectIcon />
          </SelectWrapper>
          {currencyMode === 'SOJA' && (
            <div className="flex items-center gap-1.5 bg-card/60 border border-border/60 shadow-soft rounded-xl px-3 h-[40px]">
              <span className="text-xs text-muted-foreground whitespace-nowrap">R$/sc</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={sojaPrice}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) onSojaPriceChange?.(v);
                }}
                className="w-16 bg-transparent text-sm font-semibold text-foreground outline-none text-right"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tipo — Início */}
      {activeTab === 'inicio' && (
        <div className="flex flex-col gap-1.5 relative" ref={tipoRef}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
            {selectedTipos.length !== tiposOptions.length && (
              <button onClick={() => setSelectedTipos([...tiposOptions])} className="text-muted-foreground hover:text-foreground transition-colors" title="Limpar seleção">
                <Eraser className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsTipoOpen(!isTipoOpen)}
              className="w-44 bg-card/60 border border-border/60 shadow-soft text-foreground hover:bg-card/80 transition-colors px-4 h-[40px] text-sm font-medium rounded-xl outline-none cursor-pointer focus:border-primary flex items-center justify-between"
            >
              <span className="truncate pr-2">
                {selectedTipos.length === tiposOptions.length ? 'Todos' : selectedTipos.length === 0 ? 'Nenhum' : `${selectedTipos.length} selecionados`}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isTipoOpen ? 'rotate-180' : '')} />
            </button>

            {isTipoOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e293b] rounded-xl shadow-elevated border border-slate-700 overflow-hidden z-50">
                <div className="p-2 flex flex-col gap-1">
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/50 rounded-lg cursor-pointer text-slate-200 text-sm transition-colors">
                    <input type="checkbox" checked={selectedTipos.length === tiposOptions.length && tiposOptions.length > 0} onChange={handleSelectAll} className="rounded border-slate-500 bg-slate-800 text-primary focus:ring-primary/20" />
                    <span>Selecionar todos</span>
                  </label>
                  <div className="h-px bg-slate-700 my-1" />
                  {tiposOptions.map(tipo => (
                    <label key={tipo} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/50 rounded-lg cursor-pointer text-slate-200 text-sm transition-colors">
                      <input type="checkbox" checked={selectedTipos.includes(tipo)} onChange={() => handleTipoToggle(tipo)} className="rounded border-slate-500 bg-slate-800 text-primary focus:ring-primary/20" />
                      <span>{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pago */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Pago?</span>
        <SelectWrapper>
          <select value={pagoMode} onChange={e => setPagoMode(e.target.value as 'Todos' | 'Sim' | 'Não')} className={cn(selectClass, 'w-24 px-3 pr-8')}>
            <option value="Todos">Todos</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
          <SelectIcon />
        </SelectWrapper>
      </div>

    </div>
  );
}
