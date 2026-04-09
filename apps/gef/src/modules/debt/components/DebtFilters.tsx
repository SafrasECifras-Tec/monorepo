import React, { useRef, useEffect } from 'react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { ChevronDown, Eraser } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';

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

const tabBtnClass = (active: boolean) => cn(
  'flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap',
  active ? 'bg-white text-[#059669] shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40',
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
          <span className="text-sm font-medium text-slate-600">Analisar por:</span>
          <GlassCard className="p-1 flex items-center gap-1 w-fit bg-white/60 border border-slate-200/60 shadow-sm rounded-xl">
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
          <Select value={selectedAno} onValueChange={setSelectedAno}>
            <SelectTrigger className="h-10 w-32 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todos">Todos</SelectItem>
              {anosOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Safra */}
      {activeTab !== 'bancos' && activeTab !== 'indicadores' && activeTab !== 'inicio' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Safra:</span>
          <Select value={selectedSafra} onValueChange={setSelectedSafra}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todas">Todas</SelectItem>
              {safrasOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Analisar por — Indicadores */}
      {activeTab === 'indicadores' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Analisar por:</span>
          <GlassCard className="p-1 flex items-center gap-1 w-fit bg-white/60 border border-slate-200/60 shadow-sm rounded-xl overflow-x-auto custom-scrollbar">
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
          <Select value={selectedBanco} onValueChange={setSelectedBanco}>
            <SelectTrigger className="h-10 w-48 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todos">Todos</SelectItem>
              {bancosOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Moeda + preço da soja */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Moeda:</span>
        <Select value={currencyMode} onValueChange={v => setCurrencyMode(v as 'BRL' | 'SOJA')}>
          <SelectTrigger className="h-10 w-36 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="BRL">Reais</SelectItem>
            <SelectItem value="SOJA">Saca de Soja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tipo — Início */}
      {activeTab === 'inicio' && (
        <div className="flex flex-col gap-1.5 relative" ref={tipoRef}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Tipo:</span>
            {selectedTipos.length !== tiposOptions.length && (
              <button onClick={() => setSelectedTipos([...tiposOptions])} className="text-slate-400 hover:text-slate-600 transition-colors" title="Limpar seleção">
                <Eraser className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsTipoOpen(!isTipoOpen)}
              className="w-44 bg-background/70 border border-border/60 shadow-soft text-foreground hover:bg-background transition-colors px-4 h-10 text-sm font-medium rounded-xl outline-none cursor-pointer flex items-center justify-between"
            >
              <span className="truncate pr-2">
                {selectedTipos.length === tiposOptions.length ? 'Todos' : selectedTipos.length === 0 ? 'Nenhum' : `${selectedTipos.length} selecionados`}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isTipoOpen ? 'rotate-180' : '')} />
            </button>

            {isTipoOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-popover rounded-xl shadow-float border border-border/70 overflow-hidden z-50">
                <div className="p-2 flex flex-col gap-1">
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-lg cursor-pointer text-popover-foreground text-sm transition-colors">
                    <input type="checkbox" checked={selectedTipos.length === tiposOptions.length && tiposOptions.length > 0} onChange={handleSelectAll} className="rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary" />
                    <span>Selecionar todos</span>
                  </label>
                  <div className="h-px bg-border/50 my-1" />
                  {tiposOptions.map(tipo => (
                    <label key={tipo} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-lg cursor-pointer text-popover-foreground text-sm transition-colors">
                      <input type="checkbox" checked={selectedTipos.includes(tipo)} onChange={() => handleTipoToggle(tipo)} className="rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary" />
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
        <Select value={pagoMode} onValueChange={v => setPagoMode(v as 'Todos' | 'Sim' | 'Não')}>
          <SelectTrigger className="h-10 w-28 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Sim">Sim</SelectItem>
            <SelectItem value="Não">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}
