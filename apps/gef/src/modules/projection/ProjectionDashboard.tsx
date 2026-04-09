import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Calendar,
  ChevronUp,
  ChevronDown,
  Info,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  LineChart as LineChartIcon,
  Plus,
  X,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Cell
} from 'recharts';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';

// Types
type Scenario = 'base' | 'optimistic' | 'pessimistic';

interface ProjectionData {
  month: string;
  actual?: number;
  projected?: number;
  isFuture: boolean;
}

export function ProjectionDashboard({ hideTitle = false }: { hideTitle?: boolean }) {
  // State for Scenario
  const [scenario, setScenario] = useState<Scenario>('base');
  const [showHelp, setShowHelp] = useState(false);
  
  // State for Simulation Variables
  const [soyPrice, setSoyPrice] = useState(120.00);
  const [dollarRate, setDollarRate] = useState(5.15);
  const [productivity, setProductivity] = useState(65);
  const [inputCosts, setInputCosts] = useState(0);
  
  // State for Simulated Events
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [simulatedEvents, setSimulatedEvents] = useState<{id: string, name: string, value: number, month: string, type: 'entrada' | 'saida'}[]>([]);
  const [newEvent, setNewEvent] = useState<{name: string, value: number, month: string, type: 'entrada' | 'saida'}>({ name: '', value: 0, month: 'Mai', type: 'saida' });

  // Mock Data Generation based on variables
  const data = useMemo(() => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    // Current month is March (index 2)
    const currentMonthIndex = 2;
    
    // Base multipliers for scenarios
    const scenarioMultiplier = {
      base: 1,
      optimistic: 1.2,
      pessimistic: 0.8
    }[scenario];

    // Calculate projected values based on variables
    // This is a simplified model: Balance = (Productivity * Price * Dollar) - Costs
    const totalRevenuePerHa = productivity * soyPrice * scenarioMultiplier;
    const baseCosts = 4500 * (1 + inputCosts / 100); // R$ per ha
    
    return months.map((month, index) => {
      const isFuture = index > currentMonthIndex;
      const isTransitionMonth = index === currentMonthIndex;
      
      // Calculate projected values for all months from current onwards
      // This ensures the projected line starts from the last actual point
      const seasonalFactor = Math.sin((index / 11) * Math.PI) * 0.5 + 0.5;
      const projectedValue = (totalRevenuePerHa * seasonalFactor * 100) - (baseCosts * 100);
      
      let accumulatedEventCosts = 0;
      let monthEventCost = 0;
      for (let i = 0; i <= index; i++) {
        const m = months[i];
        const costForMonth = simulatedEvents.filter(e => e.month === m).reduce((acc, curr) => {
          return acc + (curr.type === 'entrada' ? -curr.value : curr.value);
        }, 0);
        accumulatedEventCosts += costForMonth;
        if (i === index) monthEventCost = costForMonth;
      }

      // Historical data (actual)
      if (index <= currentMonthIndex) {
        const actualValues = [150000, 280000, 120000]; // Random historical values
        return {
          month,
          actual: actualValues[index],
          // Include projected in transition month to bridge the gap
          projected: isTransitionMonth ? actualValues[index] : undefined,
          projectedWithEvent: isTransitionMonth ? actualValues[index] : undefined,
          riskBalance: (isTransitionMonth && actualValues[index] < 0) ? actualValues[index] : 0,
          isFuture: false
        };
      }
      
      const projectedWithEvent = projectedValue - accumulatedEventCosts;

      // Projected data
      return {
        month,
        projected: projectedValue,
        projectedWithEvent: projectedWithEvent,
        riskBalance: projectedWithEvent < 0 ? projectedWithEvent : 0,
        isFuture: true,
        simulatedEvent: monthEventCost !== 0 ? -monthEventCost : undefined
      };
    });
  }, [scenario, soyPrice, dollarRate, productivity, inputCosts, simulatedEvents]);

  // Derived Stats
  const finalBalance = data[data.length - 1].projectedWithEvent !== undefined ? data[data.length - 1].projectedWithEvent : (data[data.length - 1].projected || 0);
  const minBalanceValue = Math.min(...data.map(d => d.projectedWithEvent !== undefined ? d.projectedWithEvent : (d.projected ?? d.actual ?? 0)));
  const necessityOfCapital = minBalanceValue < 0 ? Math.abs(minBalanceValue) : 0;
  const minMonth = data.find(d => (d.projectedWithEvent !== undefined ? d.projectedWithEvent : (d.projected ?? d.actual ?? 0)) === minBalanceValue)?.month;
  const profitMargin = (((finalBalance as number) / (productivity * soyPrice * 100)) * 100).toFixed(1);
  const profitMarginNum = parseFloat(profitMargin);
  
  const baseFinalBalance = data[data.length - 1].projected || 0;
  const baseProfitMargin = (((baseFinalBalance as number) / (productivity * soyPrice * 100)) * 100).toFixed(1);
  const marginDiff = (profitMarginNum - parseFloat(baseProfitMargin)).toFixed(1);
  const marginDiffNum = parseFloat(marginDiff);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header with Scenario Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          {!hideTitle && (
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Projeção de Safra</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-500">Safra 24/25</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-500">Moeda: BRL (R$)</span>
              </div>
            </div>
          )}

          {/* Scenario Description Hint */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={scenario}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 h-fit"
            >
              {scenario === 'base' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <p className="text-xs text-slate-600 font-medium">
                    <span className="font-bold">Cenário Base:</span> Seu planejamento real.
                  </p>
                </>
              )}
              {scenario === 'optimistic' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-xs text-emerald-700 font-medium">
                    <span className="font-bold">Cenário Otimista (+20%):</span> Prêmios melhores e custos reduzidos.
                  </p>
                </>
              )}
              {scenario === 'pessimistic' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs text-red-700 font-medium">
                    <span className="font-bold">Cenário Pessimista (-20%):</span> Proteção contra quebras e fretes.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/40 shadow-sm">
            <button
              onClick={() => setScenario('base')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                scenario === 'base' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              ⚪ Cenário Base
            </button>
            <button
              onClick={() => setScenario('optimistic')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                scenario === 'optimistic' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              🟢 Otimista
            </button>
            <button
              onClick={() => setScenario('pessimistic')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                scenario === 'pessimistic' ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              🔴 Pessimista
            </button>
          </div>
          
          <button 
            onClick={() => setShowHelp(true)}
            className="p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Entenda os cenários"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Simulator Panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6 bg-white/60 border-white/40">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800">Simulador</h2>
            </div>

            <div className="space-y-8">
              {/* Soy Price */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-600">Preço Soja (sc)</label>
                  <span className="text-sm font-bold text-emerald-700">R$ {soyPrice.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="80" 
                  max="300" 
                  step="0.5"
                  value={soyPrice}
                  onChange={(e) => setSoyPrice(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>R$ 80</span>
                  <span>R$ 300</span>
                </div>
              </div>

              {/* Dollar Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-600">Dólar (USD/BRL)</label>
                  <span className="text-sm font-bold text-blue-700">R$ {dollarRate.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="4.50" 
                  max="6.00" 
                  step="0.01"
                  value={dollarRate}
                  onChange={(e) => setDollarRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>R$ 4.50</span>
                  <span>R$ 6.00</span>
                </div>
              </div>

              {/* Productivity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-600">Produtividade (sc/ha)</label>
                  <span className="text-sm font-bold text-amber-700">{productivity} sc/ha</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="200" 
                  step="1"
                  value={productivity}
                  onChange={(e) => setProductivity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>40 sc/ha</span>
                  <span>200 sc/ha</span>
                </div>
              </div>

              {/* Input Costs */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-600">Custo de Insumos</label>
                  <span className={cn("text-sm font-bold", inputCosts > 0 ? "text-red-600" : inputCosts < 0 ? "text-emerald-600" : "text-slate-600")}>
                    {inputCosts > 0 ? '+' : ''}{inputCosts}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  step="1"
                  value={inputCosts}
                  onChange={(e) => setInputCosts(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-50%</span>
                  <span>Base</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Add Simulation Button */}
              <div className="pt-4 border-t border-slate-200/60">
                <button 
                  onClick={() => {
                    setEditingEventId(null);
                    setNewEvent({ name: '', value: 0, month: 'Mai', type: 'saida' });
                    setShowSimulationModal(true);
                  }}
                  className="w-full py-3 bg-white border border-dashed border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Simulação
                </button>
                
                {/* List of simulated events */}
                {simulatedEvents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {simulatedEvents.map(event => (
                      <div key={event.id} className={cn("flex items-center justify-between p-3 border rounded-xl", event.type === 'entrada' ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100")}>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{event.name}</p>
                          <p className={cn("text-[10px]", event.type === 'entrada' ? "text-emerald-600" : "text-red-600")}>
                            {event.type === 'entrada' ? '+' : '-'} R$ {(event.value / 1000).toFixed(0)}k • {event.month}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingEventId(event.id);
                              setNewEvent({ name: event.name, value: event.value, month: event.month, type: event.type });
                              setShowSimulationModal(true);
                            }}
                            className={cn("p-1.5 rounded-lg transition-colors cursor-pointer", event.type === 'entrada' ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-red-600 hover:bg-red-50")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setSimulatedEvents(prev => prev.filter(e => e.id !== event.id))}
                            className={cn("p-1.5 rounded-lg transition-colors cursor-pointer", event.type === 'entrada' ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-red-600 hover:bg-red-50")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Os valores acima impactam diretamente o cálculo de receita bruta e margem líquida projetada para a safra atual.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Main Chart and Result Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Chart: Cone of Uncertainty */}
          <GlassCard className="p-6 bg-white/60 border-white/40 h-[450px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold text-slate-800">Cone de Incerteza: Fluxo de Caixa Projetado</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-emerald-600" />
                  <span className="text-slate-500">Realizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-emerald-600 border-t border-dashed" />
                  <span className="text-slate-500">Projetado</span>
                </div>
                {simulatedEvents.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#f4af2d] border-t border-dashed" />
                    <span className="text-slate-500">Com Simulação</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                    <pattern id="stripedRed" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.5" />
                    </pattern>
                    <pattern id="stripedGreen" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#10b981" strokeWidth="4" strokeOpacity="0.5" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'simulatedEvent') return [`R$ ${Math.abs(value).toLocaleString('pt-BR')}`, value > 0 ? 'Entrada Simulada' : 'Custo Simulado'];
                      if (name === 'projectedWithEvent') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo (com Simulação)'];
                      if (name === 'projected') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo Projetado'];
                      if (name === 'actual') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo Realizado'];
                      return [`R$ ${value.toLocaleString('pt-BR')}`, name];
                    }}
                  />
                  
                  {/* Breakeven Area (Red below zero) */}
                  <Area 
                    type="monotone" 
                    dataKey="riskBalance" 
                    stroke="none" 
                    fill="url(#colorRisk)" 
                    baseValue={0}
                    connectNulls
                    tooltipType="none"
                  />

                  <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />
                  
                  {/* Simulated Event Bar */}
                  <Bar 
                    dataKey="simulatedEvent" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.simulatedEvent && entry.simulatedEvent > 0 ? "url(#stripedGreen)" : "url(#stripedRed)"} />
                    ))}
                  </Bar>

                  {/* Historical Line (Solid) */}
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    dot={{ fill: '#059669', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />

                  {/* Projected Line (Dashed) */}
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    strokeDasharray="8 5"
                    dot={false}
                    opacity={simulatedEvents.length > 0 ? 0.3 : 1}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />

                  {/* Projected Line (With Events) */}
                  {simulatedEvents.length > 0 && (
                    <Line 
                      type="monotone" 
                      dataKey="projectedWithEvent" 
                      stroke="#f4af2d" 
                      strokeWidth={3} 
                      strokeDasharray="8 5"
                      dot={{ fill: '#f4af2d', strokeWidth: 2, r: 4, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 bg-white/60 border-white/40">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Saldo Final Projetado</p>
              <div className="flex items-end gap-2">
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight",
                  finalBalance >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  R$ {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Estimativa para Dezembro 2026</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-white/60 border-white/40">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Necessidade de Capital</p>
              <div className="flex items-end gap-2">
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight",
                  necessityOfCapital > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  R$ {necessityOfCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={cn(
                "mt-4 flex items-center gap-1.5 text-xs font-medium",
                necessityOfCapital > 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {necessityOfCapital > 0 ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Pico negativo em {minMonth}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Caixa Saudável</span>
                  </>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-white/60 border-white/40">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Margem de Lucro Est.</p>
              <div className="flex items-end gap-2">
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight",
                  profitMarginNum >= 0 ? "text-slate-800" : "text-red-600"
                )}>
                  {profitMargin}%
                </h3>
                {marginDiffNum !== 0 && (
                  <span className={cn(
                    "text-xs font-medium mb-1 flex items-center",
                    marginDiffNum > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {marginDiffNum > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {Math.abs(marginDiffNum).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                {profitMarginNum >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>Baseado no cenário {scenario}</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <HelpCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Entenda os Cenários</h2>
                      <p className="text-slate-500 text-sm">Como as projeções são calculadas</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <XCircle className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Base */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <span className="text-lg">⚪</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Cenário Base</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      O seu planejamento real. Baseado exatamente nos valores que você definiu no simulador (Preço, Dólar e Produtividade).
                    </p>
                  </div>

                  {/* Optimistic */}
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <span className="text-lg">🟢</span>
                    </div>
                    <h3 className="font-bold text-emerald-800">Otimista</h3>
                    <p className="text-xs text-emerald-600 leading-relaxed">
                      Cenário de oportunidade (+20%). Simula prêmios melhores, grãos de alta qualidade e custos logísticos reduzidos.
                    </p>
                  </div>

                  {/* Pessimistic */}
                  <div className="p-5 rounded-2xl bg-red-50 border border-red-100 space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <span className="text-lg">🔴</span>
                    </div>
                    <h3 className="font-bold text-red-800">Pessimista</h3>
                    <p className="text-xs text-red-600 leading-relaxed">
                      Cenário de risco (-20%). Proteja-se contra quebras pontuais, descontos por umidade ou aumentos repentinos no frete.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Dica:</span> Use o cenário pessimista para testar a resiliência do seu fluxo de caixa. Se o saldo final continuar positivo, sua operação está segura!
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 cursor-pointer"
                >
                  Entendi, vamos simular!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSimulationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSimulationModal(false);
                setEditingEventId(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingEventId ? 'Editar Simulação' : 'Adicionar Simulação'}
                  </h2>
                  <button 
                    onClick={() => {
                      setShowSimulationModal(false);
                      setEditingEventId(null);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <XCircle className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Simulação</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewEvent({...newEvent, type: 'entrada'})}
                        className={cn(
                          "flex-1 py-2 text-sm font-bold rounded-xl transition-all border cursor-pointer",
                          newEvent.type === 'entrada' 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        Entrada (+)
                      </button>
                      <button
                        onClick={() => setNewEvent({...newEvent, type: 'saida'})}
                        className={cn(
                          "flex-1 py-2 text-sm font-bold rounded-xl transition-all border cursor-pointer",
                          newEvent.type === 'saida' 
                            ? "bg-red-50 border-red-200 text-red-700" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        Saída (-)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">O que é?</label>
                    <input 
                      type="text" 
                      placeholder={newEvent.type === 'entrada' ? "Ex: Venda de Maquinário" : "Ex: Trator Novo"}
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 500.000,00"
                      value={newEvent.value ? newEvent.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setNewEvent({...newEvent, value: Number(rawValue) / 100});
                      }}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quando?</label>
                    <select 
                      value={newEvent.month}
                      onChange={(e) => setNewEvent({...newEvent, month: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                    >
                      {['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(m => (
                        <option key={m} value={m}>{m}/26</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => {
                      setShowSimulationModal(false);
                      setEditingEventId(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (newEvent.name && newEvent.value > 0) {
                        if (editingEventId) {
                          setSimulatedEvents(prev => prev.map(e => e.id === editingEventId ? { ...newEvent, id: editingEventId } : e));
                        } else {
                          setSimulatedEvents([...simulatedEvents, { ...newEvent, id: Date.now().toString() }]);
                        }
                        setNewEvent({ name: '', value: 0, month: 'Mai', type: 'saida' });
                        setEditingEventId(null);
                        setShowSimulationModal(false);
                      }
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    {editingEventId ? 'Salvar Alterações' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
