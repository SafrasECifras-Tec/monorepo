import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Info,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, AlertCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { GlassCard } from '@socios/ui';
import { TabNav } from '@socios/ui';
import { cn } from '@/lib/utils';
import {
  FAZENDAS, alertasData,
} from '@/data/dre/dreData';
import type { Fazenda, AlertaConsultor } from '@/data/dre/dreData';
import type { SafraImportData } from '@/contexts/ImportDataContext';
import { useDREData, useDRESafras } from '@/hooks/useDREData';
import { useImportedData } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { EmptyDataState } from '@/components/ui/EmptyDataState';
import { DREInicioTab } from './components/DREInicioTab';
import { DREVBPTab } from './components/DREVBPTab';
import { DRECustoTab } from './components/DRECustoTab';
import { DREAnalisesTab } from './components/DREAnalisesTab';

// ── Formatters ───────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    : `R$ ${(v / 1_000).toFixed(0)}k`;

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

// ── Shared tab config ────────────────────────────────────────────────────────

const DRE_TABS = [
  { id: 'inicio',   label: 'Início' },
  { id: 'analises', label: 'Análises' },
  { id: 'vbp',      label: 'VBP' },
  { id: 'custo',    label: 'Custo' },
  { id: 'culturas', label: 'Por Cultura' },
  { id: 'historico',label: 'Histórico' },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, delay = 0 }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string }; delay?: number;
}) {
  const up = trend && trend.value > 0;
  const down = trend && trend.value < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <GlassCard className="p-5 flex flex-col gap-2 hover:shadow-md transition-all duration-300 h-full">
        <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[24px] font-black text-slate-800 leading-tight">{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold mt-auto',
            up ? 'text-emerald-600' : down ? 'text-red-500' : 'text-slate-400'
          )}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : down ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function CulturaCard({ cultura, idx, ...rest }: { cultura: any; idx: number; [k: string]: any }) {
  const up = cultura.variacaoMargem > 0;
  const down = cultura.variacaoMargem < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 * idx }}>
      <GlassCard className="p-5 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cultura.emoji}</span>
            <span className="font-bold text-slate-800 text-base">{cultura.nome}</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full',
            up ? 'bg-emerald-100 text-emerald-700' : down ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
          )}>
            {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {cultura.variacaoMargem > 0 ? '+' : ''}{cultura.variacaoMargem.toFixed(1)} pp
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Área', value: `${fmtNum(cultura.area)} ha` },
            { label: 'Produção', value: `${fmtNum(cultura.producao)} sc` },
            { label: 'Produtividade', value: `${cultura.produtividade.toFixed(1)} sc/ha` },
            { label: 'Preço Médio', value: `R$ ${cultura.precoMedio}/sc` },
            { label: 'Receita', value: fmtCompact(cultura.receitaBruta) },
            { label: 'Margem Líq.', value: `${cultura.margemLiquida.toFixed(1)}%` },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{item.label}</span>
              <span className="text-sm font-bold text-slate-700">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Margem Líquida</span>
            <span>{cultura.margemLiquida.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(cultura.margemLiquida, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 * idx }}
              className={cn('h-full rounded-full',
                cultura.margemLiquida >= 20 ? 'bg-emerald-500' :
                cultura.margemLiquida >= 10 ? 'bg-amber-400' : 'bg-red-400')}
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AlertaCard({ alerta, idx, ...rest }: { alerta: AlertaConsultor; idx: number; [k: string]: any }) {
  const config = {
    alerta:       { bg: 'bg-amber-50 border-amber-200',   icon: AlertTriangle, iconColor: 'text-amber-500',  dot: 'bg-amber-400' },
    oportunidade: { bg: 'bg-emerald-50 border-emerald-200', icon: Lightbulb,   iconColor: 'text-emerald-600', dot: 'bg-emerald-500' },
    info:         { bg: 'bg-blue-50 border-blue-200',     icon: Info,          iconColor: 'text-blue-500',   dot: 'bg-blue-400' },
  }[alerta.tipo];
  const Icon = config.icon;
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 * idx }}>
      <div className={cn('flex items-start gap-3 p-4 rounded-xl border', config.bg)}>
        <div className="p-1.5 rounded-lg bg-white/60 shrink-0 mt-0.5">
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{alerta.titulo}</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alerta.descricao}</p>
        </div>
        <span className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', config.dot)} />
      </div>
    </motion.div>
  );
}

// ── Tab content components ───────────────────────────────────────────────────

function InicioTab({ safraAtual, dreDataRecord, safras }: { safraAtual: string; dreDataRecord: Record<string, SafraImportData>; safras: string[] }) {
  const data = dreDataRecord[safraAtual];
  const safraAnteriorKey = useMemo(() => {
    const idx = safras.indexOf(safraAtual);
    return idx > 0 ? safras[idx - 1] : null;
  }, [safraAtual, safras]);
  const prev = safraAnteriorKey ? dreDataRecord[safraAnteriorKey] : null;

  const trendProd = prev ? ((data.produtividadeMedia - prev.produtividadeMedia) / prev.produtividadeMedia) * 100 : null;
  const trendArea = prev ? ((data.areaTotal - prev.areaTotal) / prev.areaTotal) * 100 : null;
  const alertasSafra = alertasData.filter(a => a.safra === safraAtual);

  return (
    <div className="flex flex-col gap-6">
      {/* Big Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Área Plantada" value={`${fmtNum(data.areaTotal)} ha`}
          trend={trendArea ? { value: trendArea, label: 'vs safra ant.' } : undefined} delay={0} />
        <KpiCard label="Produção Total" value={`${fmtNum(data.producaoTotal)} sc`}
          sub={`${fmtNum(data.producaoTotal * 60)} kg`}
          trend={trendProd ? { value: trendProd, label: 'vs safra ant.' } : undefined} delay={0.05} />
        <KpiCard label="Produtividade Média" value={`${data.produtividadeMedia.toFixed(1)} sc/ha`}
          trend={trendProd ? { value: trendProd, label: 'vs safra ant.' } : undefined} delay={0.1} />
        <KpiCard label="Preço Médio de Venda" value={`R$ ${data.precoMedioVenda}/sc`}
          sub={`Total: ${fmtCompact(data.receitaBruta)}`} delay={0.15} />
      </div>

    </div>
  );
}

function CulturasTab({ safraAtual, dreDataRecord, selectedCultura }: { safraAtual: string; dreDataRecord: Record<string, SafraImportData>; selectedCultura: string }) {
  const data = dreDataRecord[safraAtual];
  const culturas = selectedCultura === 'Todas' ? data.culturas : data.culturas.filter(c => c.nome === selectedCultura);
  return (
    <div className="flex flex-col gap-6">
      <div className={cn('grid gap-4', culturas.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}>
        {culturas.map((c, i) => <CulturaCard key={c.nome} cultura={c} idx={i} />)}
      </div>
    </div>
  );
}

function HistoricoTab({ dreDataRecord, safras }: { dreDataRecord: Record<string, SafraImportData>; safras: string[] }) {
  const historicoPorSafra = safras.map(s => ({
    safra: s,
    producaoTotal: dreDataRecord[s]?.producaoTotal ?? 0,
    margemLiquida: dreDataRecord[s]?.margemLiquida ?? 0,
  }));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-1">Produção Total por Safra</h3>
          <p className="text-xs text-slate-400 mb-4">Em sacas (60kg)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicoPorSafra} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                <XAxis dataKey="safra" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k sc`} />
                <Tooltip formatter={(v: number) => [`${fmtNum(v)} sc`, 'Produção']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="producaoTotal" fill="#10b981" radius={[6, 6, 0, 0]} name="Produção" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-1">Margem Líquida por Safra</h3>
          <p className="text-xs text-slate-400 mb-4">Em % sobre receita bruta</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicoPorSafra} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.4} />
                <XAxis dataKey="safra" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} width={40} tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Margem Líquida']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="margemLiquida" stroke="#10b981" strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Tabela comparativa */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Comparativo por Safra</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Safra', 'Área (ha)', 'Produção (sc)', 'Produtiv. (sc/ha)', 'Receita Bruta', 'Custo Total', 'Result. Líquido', 'Margem'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...safras].reverse().map((safra) => {
                const d = dreDataRecord[safra];
                return (
                  <tr key={safra} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-800">{safra}</td>
                    <td className="px-3 py-3 text-slate-600">{fmtNum(d.areaTotal)}</td>
                    <td className="px-3 py-3 text-slate-600">{fmtNum(d.producaoTotal)}</td>
                    <td className="px-3 py-3 text-slate-600">{d.produtividadeMedia.toFixed(1)}</td>
                    <td className="px-3 py-3 text-slate-600">{fmtCompact(d.receitaBruta)}</td>
                    <td className="px-3 py-3 text-slate-600">{fmtCompact(d.custoTotal)}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-700">{fmtCompact(d.resultadoLiquido)}</td>
                    <td className="px-3 py-3">
                      <span className={cn('font-bold px-2 py-0.5 rounded-full text-xs',
                        d.margemLiquida >= 20 ? 'bg-emerald-100 text-emerald-700' :
                        d.margemLiquida >= 12 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {d.margemLiquida.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function DREDashboard() {
  const dreDataRecord = useDREData();
  const safras = useDRESafras();
  const { data: importedData } = useImportedData();
  const { isLoading: importLoading, openFilePicker } = useUniversalImport();
  const hasImportedData = !!importedData.dre;

  const [safraAtual, setSafraAtual] = useState<string>(() => {
    const available = safras ?? [];
    return available.length > 0 ? available[available.length - 1] : '2024/25';
  });
  const [fazenda, setFazenda] = useState<Fazenda>('Todas');
  const [selectedCultura, setSelectedCultura] = useState<string>('Todas');
  const [activeTab, setActiveTab] = useState('inicio');

  const culturasOptions = useMemo(() => {
    const rec = dreDataRecord;
    if (!rec || !safraAtual || !rec[safraAtual]) return [];
    return rec[safraAtual].culturas.map(c => c.nome);
  }, [dreDataRecord, safraAtual]);

  // Inicializa safraAtual com a última safra disponível quando dados carregam
  useEffect(() => {
    if (safras && safras.length > 0) {
      setSafraAtual(prev => safras.includes(prev) ? prev : safras[safras.length - 1]);
    }
  }, [safras]);

  return (
    <div className="flex flex-col gap-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">DRE</h1>
          <p className="text-slate-500 mt-1">Demonstrativo de Resultado por Safra — Fazenda Santa Fé</p>
        </div>
        <ImportButton
          hasData={hasImportedData}
          isLoading={importLoading}
          onClick={openFilePicker}
        />
      </header>

      {/* Tab navigation + Filtros */}
      <div className="flex flex-row items-end justify-between gap-4">
        <TabNav tabs={DRE_TABS} activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Fazenda:</span>
            <Select value={fazenda} onValueChange={v => setFazenda(v as Fazenda)}>
              <SelectTrigger className="h-10 w-40 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {FAZENDAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {activeTab !== 'analises' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Safra:</span>
              <Select value={safraAtual} onValueChange={setSafraAtual}>
                <SelectTrigger className="h-10 w-36 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(safras ?? []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Atividade:</span>
            <Select value={selectedCultura} onValueChange={setSelectedCultura}>
              <SelectTrigger className="h-10 w-44 rounded-xl border-border/60 bg-background/70 text-sm shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Todas">{activeTab === 'analises' ? 'Análise Global' : 'Todas'}</SelectItem>
                {culturasOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasImportedData && (
        <EmptyDataState
          module="DRE"
          description="Importe uma planilha com a aba 'DRE' para visualizar receitas, custos e margens por safra."
          onImport={openFilePicker}
          isLoading={importLoading}
        />
      )}

      {/* Tab content */}
      {hasImportedData && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${safraAtual}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'inicio'    && (() => {
              const rec = dreDataRecord!;
              const sfs = safras!;
              const current = rec[safraAtual];
              const filtered = selectedCultura === 'Todas' ? current : {
                ...current,
                culturas: current.culturas.filter(c => c.nome === selectedCultura),
              };
              const prevKey = sfs.indexOf(safraAtual) > 0 ? sfs[sfs.indexOf(safraAtual) - 1] : null;
              const prevData = prevKey ? rec[prevKey] : null;
              return <DREInicioTab data={filtered} prev={prevData} dreDataRecord={rec} safras={sfs} onNavigate={setActiveTab} />;
            })()}
            {activeTab === 'vbp'       && <DREVBPTab safraAtual={safraAtual} dreDataRecord={dreDataRecord!} safras={safras!} selectedCultura={selectedCultura} />}
            {activeTab === 'custo'     && <DRECustoTab safraAtual={safraAtual} dreDataRecord={dreDataRecord!} safras={safras!} selectedCultura={selectedCultura} />}
            {activeTab === 'culturas'  && <CulturasTab safraAtual={safraAtual} dreDataRecord={dreDataRecord!} selectedCultura={selectedCultura} />}
            {activeTab === 'historico' && <HistoricoTab dreDataRecord={dreDataRecord!} safras={safras!} />}
            {activeTab === 'analises'  && <DREAnalisesTab dreDataRecord={dreDataRecord!} safras={safras!} selectedCultura={selectedCultura} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
