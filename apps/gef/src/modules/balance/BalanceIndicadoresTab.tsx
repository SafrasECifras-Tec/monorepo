import React, { useMemo } from 'react';
import { GlassCard } from '@socios/ui';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine, LabelList } from 'recharts';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import type { BalanceTableRow } from '@/contexts/ImportDataContext';
import { GefTooltip, CHART_CURSOR, CHART_GRID_PROPS, CHART_AXIS_TICK } from '@/lib/chartTheme';

interface BalanceIndicadoresTabProps {
  ativo: BalanceTableRow[];
  passivo: BalanceTableRow[];
  columns: string[];
}

const normStr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function findRootGroup(roots: BalanceTableRow[], include: string[], exclude: string[] = []): BalanceTableRow | undefined {
  return roots.find(r => {
    const n = normStr(r.name);
    return include.every(k => n.includes(k)) && exclude.every(k => !n.includes(k));
  });
}

function findChildGroup(group: BalanceTableRow | undefined, include: string[]): BalanceTableRow | undefined {
  if (!group?.children) return undefined;
  return group.children.find(c => {
    const n = normStr(c.name);
    return include.every(k => n.includes(k));
  });
}

function groupVal(group: BalanceTableRow | undefined, colIndex: number): number {
  return group?.values[colIndex] ?? 0;
}

const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="relative group flex items-center justify-center">
      <Info className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] p-3 bg-slate-800 text-white text-[13px] leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

const CustomTooltipCCL = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <GefTooltip
      title={label}
      entries={[{ label: 'Valor', value: payload[0].payload.label, color: payload[0].fill }]}
    />
  );
};

const CustomTooltipCompromissos = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <GefTooltip
      title={label}
      entries={payload.map((e: any) => ({ label: e.name, value: `${e.value}%`, color: e.fill ?? e.color }))}
    />
  );
};

const CustomTooltipValue = ({ active, payload, label, suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <GefTooltip
      title={label}
      entries={[{ label: 'Valor', value: `${payload[0].value}${suffix}`, color: payload[0].fill }]}
    />
  );
};

const CustomTooltipLine = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <GefTooltip
      title={label}
      entries={payload.map((e: any) => ({ label: e.name ?? 'Valor', value: e.payload.label ?? String(e.value), color: e.stroke ?? e.fill }))}
    />
  );
};

export function BalanceIndicadoresTab({ ativo, passivo, columns }: BalanceIndicadoresTabProps) {
  const { balanceIndicadores: vis } = useSettings();

  // ─── Find structural groups ──────────────────────────────────────────────────
  const acGroup  = useMemo(() => findRootGroup(ativo,   ['circulante'], ['nao']),               [ativo]);
  const ancGroup = useMemo(() => findRootGroup(ativo,   ['circulante', 'nao']),                  [ativo]);
  const pcGroup  = useMemo(() => findRootGroup(passivo, ['circulante'], ['nao', 'patrimoni']),   [passivo]);
  const pncGroup = useMemo(() => findRootGroup(passivo, ['circulante', 'nao']),                  [passivo]);
  const plGroup  = useMemo(() => findRootGroup(passivo, ['patrimoni']),                          [passivo]);

  // "Financeiro" sub-item of ativo circulante (for liquidez imediata)
  const financeiroAC = useMemo(() => findChildGroup(acGroup, ['financei']), [acGroup]);
  // "Terras" sub-item of ativo não circulante (for PL sem terras)
  const terrasGroup  = useMemo(() => findChildGroup(ancGroup, ['terr']),    [ancGroup]);

  // ─── Compute metrics per column ──────────────────────────────────────────────
  const colColor = (idx: number, isGood: boolean) =>
    idx < columns.length - 1 ? '#94a3b8' : isGood ? '#10b981' : '#ef4444';

  const metrics = useMemo(() => columns.map((col, i) => {
    const ac    = groupVal(acGroup,   i);
    const anc   = groupVal(ancGroup,  i);
    const pc    = groupVal(pcGroup,   i);
    const pnc   = groupVal(pncGroup,  i);
    const pl    = groupVal(plGroup,   i) || (ativo.reduce((s, r) => s + (r.values[i] ?? 0), 0) - passivo.reduce((s, r) => s + (r.values[i] ?? 0), 0));
    const fin   = groupVal(financeiroAC, i);
    const terras = groupVal(terrasGroup, i);
    const totalPassivoI = pc + pnc;

    const ccl                = (ac - pc) / 1_000_000;
    const liquidezCorrente   = pc > 0 ? +(ac / pc).toFixed(2) : 0;
    const liquidezImediata   = pc > 0 ? +(fin / pc).toFixed(2) : 0;
    const liquidezGeral      = (pc + pnc) > 0 ? +((ac + anc) / (pc + pnc)).toFixed(2) : 0;
    const endividamentoPL    = pl > 0 ? +((totalPassivoI / pl) * 100).toFixed(2) : 0;
    const totalAtivo         = ativo.reduce((s, r) => s + (r.values[i] ?? 0), 0);
    const grauEndividamento  = totalAtivo > 0 ? +((totalPassivoI / totalAtivo) * 100).toFixed(2) : 0;
    const plMi               = pl / 1_000_000;
    const plSemTerrasMi      = (pl - terras) / 1_000_000;
    const pcPct              = totalPassivoI > 0 ? +((pc / totalPassivoI) * 100).toFixed(2) : 0;
    const pncPct             = totalPassivoI > 0 ? +((pnc / totalPassivoI) * 100).toFixed(2) : 0;

    return { col, ccl, liquidezCorrente, liquidezImediata, liquidezGeral, endividamentoPL, grauEndividamento, plMi, plSemTerrasMi, pcPct, pncPct, pl };
  }), [ativo, passivo, columns, acGroup, ancGroup, pcGroup, pncGroup, plGroup, financeiroAC, terrasGroup]);

  // ─── Build chart data arrays ──────────────────────────────────────────────────
  const cclData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: +m.ccl.toFixed(1),
    label: `${m.ccl >= 0 ? '' : '-'}R$ ${Math.abs(m.ccl).toFixed(1)} Mi`,
    color: colColor(i, m.ccl >= 0),
  })), [metrics]);

  const compromissosData = useMemo(() => metrics.map(m => ({
    name: m.col,
    'Passivo Circulante': m.pcPct,
    'Passivo Não Circulante': m.pncPct,
  })), [metrics]);

  const liquidezCorrenteData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: m.liquidezCorrente, color: colColor(i, m.liquidezCorrente >= 1),
  })), [metrics]);

  const liquidezImediataData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: m.liquidezImediata, color: colColor(i, m.liquidezImediata >= 1),
  })), [metrics]);

  const liquidezGeralData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: m.liquidezGeral, color: colColor(i, m.liquidezGeral >= 1),
  })), [metrics]);

  const endividamentoPLData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: m.endividamentoPL, color: colColor(i, m.endividamentoPL <= 50),
  })), [metrics]);

  const grauEndividamentoData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: m.grauEndividamento, color: colColor(i, m.grauEndividamento <= 40),
  })), [metrics]);

  const patrimonioLiquidoData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: +m.plMi.toFixed(1),
    label: `R$ ${m.plMi.toFixed(1)} Mi`,
    color: i === 0 ? '#94a3b8' : m.plMi >= (metrics[i - 1]?.plMi ?? 0) ? '#16a34a' : '#ef4444',
  })), [metrics]);

  const patrimonioLiquidoTerraData = useMemo(() => metrics.map((m, i) => ({
    name: m.col, value: +m.plSemTerrasMi.toFixed(1),
    label: `R$ ${m.plSemTerrasMi.toFixed(1)} Mi`,
    color: i === 0 ? '#94a3b8' : m.plSemTerrasMi >= (metrics[i - 1]?.plSemTerrasMi ?? 0) ? '#16a34a' : '#ef4444',
  })), [metrics]);

  const last = metrics[metrics.length - 1];
  return (
    <motion.div 
      className="flex flex-col flex-1 min-h-0 gap-10 pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Capital Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Capital Circulante Líquido</h2>
          <span className="text-slate-500">-</span>
          <p className="text-slate-500">Mostra a capacidade de honrar as dívidas no curto prazo.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CCL */}
            {vis.ccl && <GlassCard className="p-0 flex flex-col overflow-visible border-slate-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Capital Circulante Líquido (CCL)</h3>
                  <InfoTooltip text="Este indicador tem como finalidade demonstrar o total de recursos disponíveis para cobrir as obrigações de curto prazo da empresa." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cclData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 40 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={['dataMin - 1', 0]}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <RechartsTooltip content={<CustomTooltipCCL />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" radius={[0, 0, 4, 4]}>
                        {cclData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="label" position="bottom" fill="#ef4444" fontSize={14} offset={10} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Déficit Atual</h4>
                    <div className={`text-3xl font-black tracking-tight ${last?.ccl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{last ? `${last.ccl >= 0 ? '' : '-'}R$ ${Math.abs(last.ccl).toFixed(1)} Mi` : '-'}</div>
                  </div>
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    +87%
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O resultado demonstra que, após cobrir todas as dívidas de curto prazo, a empresa ainda terá este déficit. A piora de quase 87% em relação ao fechamento do ano exige atenção imediata.
                </p>
                <p className="text-[10px] text-slate-400 italic text-right mt-2">*Última Avaliação</p>
              </div>
            </GlassCard>}

            {/* Compromissos */}
            {vis.compromissos_prazo && <GlassCard className="p-0 flex flex-col overflow-visible border-slate-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-700">Compromissos Curto x Longo prazo</h3>
                  <InfoTooltip text="O indicador mostra a distribuição da dívida da empresa entre curto prazo (até 12 meses) e longo prazo (após 12 meses), permitindo avaliar o perfil do endividamento." />
                </div>
                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#6366f1] shrink-0"></div>
                    <span className="text-xs md:text-sm text-slate-600">Passivo Circulante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#cbd5e1] shrink-0"></div>
                    <span className="text-xs md:text-sm text-slate-600">Passivo Não Circulante</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={compromissosData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip content={<CustomTooltipCompromissos />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="Passivo Circulante" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]}>
                        <LabelList dataKey="Passivo Circulante" position="inside" fill="#ffffff" fontSize={12} formatter={(val: number) => `${val}%`} />
                      </Bar>
                      <Bar dataKey="Passivo Não Circulante" stackId="a" fill="#cbd5e1" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="Passivo Não Circulante" position="inside" fill="#475569" fontSize={12} formatter={(val: number) => `${val}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">O que o resultado diz?</h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                  A distribuição indica o nível de pressão financeira no horizonte mais imediato.
                </p>
                <ul className="text-sm text-slate-600 leading-relaxed space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span>Se a maior parte está no curto prazo, há mais pressão imediata sobre o caixa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span>Se está no longo prazo, a empresa tem mais tempo para pagar.</span>
                  </li>
                </ul>
              </div>
            </GlassCard>}
        </div>
      </div>

      {/* Liquidez Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Índices de Liquidez</h2>
          <span className="text-slate-500">-</span>
          <p className="text-slate-500">Mostra a capacidade de honrar os compromissos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liquidez Imediata */}
            {vis.liquidez_imediata && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Liquidez Imediata</h3>
                  <InfoTooltip text="Mostrar a capacidade de honrar compromissos imediatamente. Calculado por: (Caixa + Bancos + Aplicações de curto prazo) / Passivo Circulante" />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={liquidezImediataData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 'dataMax + 0.2']} 
                      />
                      <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" />
                      <RechartsTooltip content={<CustomTooltipValue />} cursor={CHART_CURSOR} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {liquidezImediataData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={14} offset={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">O que o resultado diz?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-red-600">Atenção:</span> Seu caixa imediato cobre apenas 10% das dívidas que vencem agora. Risco alto de insolvência.
                </p>
              </div>
            </GlassCard>}

            {vis.liquidez_corrente && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Liquidez Corrente</h3>
                  <InfoTooltip text="Esse indicador mostra a capacidade da empresa em pagar suas dívidas de curto prazo com os ativos de curto prazo." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={liquidezCorrenteData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 'dataMax + 0.2']} 
                      />
                      <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" />
                      <RechartsTooltip content={<CustomTooltipValue />} cursor={CHART_CURSOR} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {liquidezCorrenteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={14} offset={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">O que o resultado diz?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-red-600">Atenção:</span> Para cada R$ 1,00 de dívida de curto prazo, a empresa possui R$ 0,87 em ativos circulantes. Risco de não honrar compromissos de curto prazo.
                </p>
              </div>
            </GlassCard>}

            {vis.liquidez_geral && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Liquidez Geral</h3>
                  <InfoTooltip text="Esse indicador mostra a capacidade de pagamento da empresa considerando todas as dívidas e os ativos totais." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={liquidezGeralData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 'dataMax + 0.5']} 
                      />
                      <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" />
                      <RechartsTooltip content={<CustomTooltipValue />} cursor={CHART_CURSOR} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {liquidezGeralData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={14} offset={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">O que o resultado diz?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-emerald-600">Confortável:</span> A empresa possui R$ 3,17 para cada R$ 1,00 de dívida total (curto e longo prazo), indicando boa solvência no longo prazo.
                </p>
              </div>
            </GlassCard>}
        </div>
      </div>

      {/* Endividamento Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Índices de Endividamento</h2>
          <span className="text-slate-500">-</span>
          <p className="text-slate-500">Relação Capital Próprio x Capital de Terceiros</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vis.endividamento_pl && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Endividamento sobre o Patrimônio Líquido</h3>
                  <InfoTooltip text="Esse indicador mostra quanto a empresa está alavancada, ou seja, usando dívida em vez de capital próprio para financiar suas operações." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={endividamentoPLData}
                      margin={{ top: 30, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                      />
                      <RechartsTooltip content={<CustomTooltipValue suffix="%" />} cursor={CHART_CURSOR} />
                      <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'right', value: 'Recomendado: < 50%', fill: '#64748b', fontSize: 12 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {endividamentoPLData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={14} offset={10} formatter={(val: number) => `${val}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Endividamento Atual</h4>
                    <div className={`text-3xl font-black tracking-tight ${last?.endividamentoPL <= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{last ? `${last.endividamentoPL.toFixed(2)}%` : '-'}</div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    -11.3%
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-emerald-600">Melhora:</span> Seu endividamento está em um nível controlado, abaixo dos 50% recomendados para o seu perfil de operação. Houve uma redução de 11,3% em relação ao fechamento do ano.
                </p>
              </div>
            </GlassCard>}

            {vis.grau_endividamento && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Grau de Endividamento</h3>
                  <InfoTooltip text="Esse indicador mostra o peso da dívida em relação ao tamanho total da empresa." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={grauEndividamentoData}
                      margin={{ top: 30, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                      />
                      <RechartsTooltip content={<CustomTooltipValue suffix="%" />} cursor={CHART_CURSOR} />
                      <ReferenceLine y={40} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'right', value: 'Recomendado: < 40%', fill: '#64748b', fontSize: 12 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {grauEndividamentoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={14} offset={10} formatter={(val: number) => `${val}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Grau Atual</h4>
                    <div className={`text-3xl font-black tracking-tight ${last?.grauEndividamento <= 40 ? 'text-emerald-600' : 'text-red-600'}`}>{last ? `${last.grauEndividamento.toFixed(2)}%` : '-'}</div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    -7.7%
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-emerald-600">Melhora:</span> A dependência de capital de terceiros diminuiu 7,7%, indicando uma empresa mais sustentada por recursos próprios.
                </p>
              </div>
            </GlassCard>}
        </div>
      </div>

      {/* Patrimônio Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Patrimônio Líquido</h2>
          <span className="text-slate-500">-</span>
          <p className="text-slate-500">Mostra os recursos próprios disponíveis da empresa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vis.patrimonio_liquido && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Patrimônio Líquido</h3>
                  <InfoTooltip text="Esse indicador demonstra a evolução do capital próprio da empresa ao longo do tempo." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={patrimonioLiquidoData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <RechartsTooltip content={<CustomTooltipLine />} cursor={CHART_CURSOR} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {patrimonioLiquidoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="label" position="top" fill="#64748b" fontSize={14} offset={10} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Patrimônio Atual</h4>
                    <div className="text-3xl font-black text-green-600 tracking-tight">{last ? `R$ ${last.plMi.toFixed(1)} Mi` : '-'}</div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    + R$ 1,0 Mi
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-green-600">Crescimento:</span> Houve um ganho patrimonial de R$ 1,0 Mi desde o último período, indicando geração de valor e fortalecimento da empresa.
                </p>
              </div>
            </GlassCard>}

            {vis.patrimonio_liquido_terras && <GlassCard className="p-0 flex flex-col overflow-visible border-emerald-200/60 shadow-sm">
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">Patrimônio Líquido (Excluindo Terras)</h3>
                  <InfoTooltip text="Mostra o capital próprio da empresa sem considerar o valor das terras (Liquidez Real). Ajuda a separar o que é 'chão' do que é 'caixa/produção'." />
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={patrimonioLiquidoTerraData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      maxBarSize={80}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                      />
                      <YAxis width={45} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dx={0}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <RechartsTooltip content={<CustomTooltipLine />} cursor={CHART_CURSOR} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {patrimonioLiquidoTerraData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="label" position="top" fill="#64748b" fontSize={14} offset={10} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 md:px-6 rounded-b-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Liquidez Real Atual</h4>
                    <div className="text-3xl font-black text-green-600 tracking-tight">{last ? `R$ ${last.plSemTerrasMi.toFixed(1)} Mi` : '-'}</div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    + R$ 1,0 Mi
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-green-600">Crescimento Operacional:</span> O patrimônio livre de terras cresceu R$ 1,0 Mi. Isso demonstra que a operação (caixa/produção) está gerando valor real além da valorização imobiliária.
                </p>
              </div>
            </GlassCard>}
        </div>
      </div>
    </motion.div>
  );
}
