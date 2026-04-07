import ExpandableValue from "@/components/ExpandableValue";
import { Badge } from "@/components/ui/badge";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Percent, Leaf, AlertTriangle, ChevronDown, Settings2, LayoutDashboard } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(152 55% 28%)", "hsl(38 70% 50%)", "hsl(152 45% 42%)",
  "hsl(200 60% 50%)", "hsl(25 80% 55%)", "hsl(340 50% 50%)"
];

export default function DashboardAnalises() {
  const { derived, state, dispatch } = useCalcir();
  const [composicaoActiveIdx, setComposicaoActiveIdx] = useState<number>(0);
  const [paramsOpen, setParamsOpen] = useState(true);

  const realTotalDespesasPF = state.despesas.filter(d => d.entidade === "PF").reduce((s, d) => s + d.total, 0) + state.imobilizadoAquisicao.filter(i => i.entidade === "PF").reduce((s, i) => s + i.total, 0);
  const realTotalDespesasPJ = state.despesas.filter(d => d.entidade === "PJ").reduce((s, d) => s + d.total, 0) + state.imobilizadoAquisicao.filter(i => i.entidade === "PJ").reduce((s, i) => s + i.total, 0);
  const totalDespesasReais = realTotalDespesasPF + realTotalDespesasPJ;
  const actualPFPerc = totalDespesasReais > 0 ? (realTotalDespesasPF / totalDespesasReais) * 100 : 0;
  const currentPFPerc = state.simulacaoDespesasPFPerc !== null ? state.simulacaoDespesasPFPerc : actualPFPerc;
  const currentPJPerc = 100 - currentPFPerc;

  const totalIRPFM = derived.irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
  const irpfmExtra = Math.max(0, totalIRPFM - derived.totalIRPF);
  const valorIrpfmDividendos = (irpfmExtra + (derived.impostoDividendosExcedente || 0)) * (state.contabilidadeRegular ? 0 : 1);

  const composicaoPFGlobal = [
    { name: "IRPF (Simulado)", value: derived.irpfGlobalPura },
    { name: "Funrural (Simulado)", value: derived.funruralGlobalPura },
  ];
  const composicaoHoldingCompleta = [
    { name: "IRPJ", value: derived.impostosPJ.ir15 + derived.impostosPJ.irAdicional10 },
    { name: "CSLL", value: derived.impostosPJ.csll9 },
    { name: "PIS/COFINS", value: derived.impostosPJ.pis + derived.impostosPJ.cofins },
    { name: "Funrural PJ", value: derived.impostosPJ.funrural },
    { name: "IRPF PF", value: derived.totalIRPF },
    { name: "Funrural PF", value: derived.funruralPF },
    { name: "IRPFM Dividendos", value: valorIrpfmDividendos },
  ];

  const abasComposicao = [
    { label: "PF Pura Global", data: composicaoPFGlobal },
    { label: "Holding Completa", data: composicaoHoldingCompleta },
  ];

  const composicaoAtualAtiva = abasComposicao[composicaoActiveIdx] || abasComposicao[0];
  const composicaoData = composicaoAtualAtiva.data.filter(d => d.value > 0);
  const hasComposicaoData = composicaoData.length > 0;

  const totalImpostosHoldingCompleto = derived.totalImpostosHoldingCompleto;
  const resultadoLiquido = derived.totalReceitasGeral - derived.totalDespesas;
  const isDeficit = resultadoLiquido < 0;
  const cargaTributariaPerc = derived.totalReceitasGeral > 0 ? (totalImpostosHoldingCompleto / derived.totalReceitasGeral) * 100 : 0;

  const impostosPFGlobal = derived.impostosPFPuraGlobal || 0;
  const impostosHoldingCompleta = derived.totalImpostosHoldingCompleto || 0;
  const economiaVal = impostosPFGlobal - impostosHoldingCompleta;
  const economiaPerc = impostosPFGlobal > 0 ? (economiaVal / impostosPFGlobal) * 100 : 0;

  const comparativoData = [
    { cenario: "PF Pura Global", impostos: impostosPFGlobal, breakdown: composicaoPFGlobal },
    { cenario: "Holding Completa", impostos: impostosHoldingCompleta, breakdown: composicaoHoldingCompleta },
  ];

  const maxImposto = Math.max(impostosPFGlobal, impostosHoldingCompleta, 1);
  const yAxisFormatter = (v: number) => {
    if (maxImposto >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (maxImposto >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return v.toFixed(0);
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-4 rounded-2xl shadow-float min-w-[220px] z-50">
          <p className="text-sm font-bold mb-2 border-b border-border/50 pb-2">{label}</p>
          <div className="space-y-1.5">
            {data.breakdown?.filter((item: any) => item.value > 0).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs gap-4">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-2 mt-2 border-t border-border font-bold">
              <span>Total</span><span>{formatCurrency(data.impostos)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (derived.totalReceitasGeral === 0) {
    return (
      <div className="space-y-5">
        <div className="section-header animate-fade-in">
          <div className="section-icon"><LayoutDashboard /></div>
          <div><h1>Dashboard / Análises</h1><p>Dashboard estratégico do planejamento tributário</p></div>
        </div>
        <div className="data-panel animate-fade-in flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Leaf className="h-7 w-7 text-primary" /></div>
          <h2 className="text-xl font-bold mb-2">Setup de Cenário Necessário</h2>
          <p className="text-sm text-muted-foreground max-w-md">Para gerar sua análise tributária, insira receitas e despesas nas abas Operacional.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon"><LayoutDashboard /></div>
        <div><h1>Dashboard / Análises</h1><p>Dashboard estratégico do planejamento tributário</p></div>
      </div>

      {isDeficit && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-destructive/70 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Resultado operacional negativo: {formatCurrency(resultadoLiquido)}</p>
            <p className="text-xs text-destructive/60 mt-0.5">Despesas ({formatCurrency(derived.totalDespesas)}) superam receitas ({formatCurrency(derived.totalReceitasGeral)}).</p>
          </div>
        </div>
      )}

      {/* Hero Board */}
      <div className="hero-board animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <div className="hero-copy space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "Receita Total", value: derived.totalReceitasGeral, icon: TrendingUp },
              { title: "Despesas", value: derived.totalDespesas, icon: TrendingDown },
              { title: "Carga Tributária", value: totalImpostosHoldingCompleto, icon: Percent, sub: formatPercent(cargaTributariaPerc) + " da receita" },
            ].map((c, i) => (
              <div key={c.title} className="rounded-2xl bg-background/60 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <c.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="label-uppercase">{c.title}</span>
                </div>
                <p className="text-lg font-extrabold tabular-nums">{formatCurrency(c.value)}</p>
                {c.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>}
              </div>
            ))}
          </div>
          {economiaVal > 0 && (
            <div className="stat-chip-success"><Leaf className="h-3 w-3" /> Economia de {formatCurrency(economiaVal)} ({formatPercent(economiaPerc)} de redução)</div>
          )}
        </div>
        <div className="hero-insight">
          <div>
            <span className="hero-insight-label">Economia Projetada</span>
            <p className="hero-insight-value">{formatCurrency(economiaVal)}</p>
            <p className="hero-insight-sub">PF Pura: {formatCurrency(impostosPFGlobal)} → Holding: {formatCurrency(impostosHoldingCompleta)}</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className={`h-2 w-2 rounded-full ${economiaVal > 0 ? 'bg-emerald-300' : 'bg-rose-400'}`} />
            <span className="text-[10px] uppercase font-bold text-white/50">{economiaVal > 0 ? "Holding mais eficiente" : "Sem ganho tributário"}</span>
          </div>
        </div>
      </div>

      {/* Parâmetros */}
      <Collapsible open={paramsOpen} onOpenChange={setParamsOpen}>
        <div className="data-panel animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <CollapsibleTrigger asChild>
            <button className="w-full data-panel-header cursor-pointer hover:bg-muted/20 transition-colors">
              <h3 className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Parâmetros de Simulação</h3>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", paramsOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="label-uppercase">Regime Funrural PF</Label>
                  <Select value={state.funruralPFRegime} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PF_REGIME", payload: value as "receita_bruta" | "folha" })}>
                    <SelectTrigger className="bg-background h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita_bruta">Comercialização (1,50%)</SelectItem><SelectItem value="folha">Folha</SelectItem></SelectContent>
                  </Select>
                  {state.funruralPFRegime === "folha" && (
                    <div className="space-y-1 mt-2 animate-fade-in">
                      <Label className="label-uppercase text-[10px]">Folha de Pagamento PF (R$)</Label>
                      <Input
                        type="number"
                        className="bg-background h-8 text-xs rounded-xl"
                        value={state.folhaPagamentoPF || ""}
                        onChange={(e) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PF", payload: Number(e.target.value) || 0 })}
                        placeholder="Valor da folha PF"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="label-uppercase">Regime Funrural PJ</Label>
                  <Select value={state.folhaPagamentoPJ === 0 ? "receita_bruta" : state.funruralPJRegime} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PJ_REGIME", payload: value as "receita_bruta" | "folha" })} disabled={state.folhaPagamentoPJ === 0}>
                    <SelectTrigger className="bg-background h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita_bruta">Receita Bruta</SelectItem><SelectItem value="folha" disabled={state.folhaPagamentoPJ === 0}>Folha</SelectItem></SelectContent>
                  </Select>
                  {state.funruralPJRegime === "folha" && state.folhaPagamentoPJ > 0 && (
                    <div className="space-y-1 mt-2 animate-fade-in">
                      <Label className="label-uppercase text-[10px]">Folha de Pagamento PJ (R$)</Label>
                      <Input
                        type="number"
                        className="bg-background h-8 text-xs rounded-xl"
                        value={state.folhaPagamentoPJ || ""}
                        onChange={(e) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PJ", payload: Number(e.target.value) || 0 })}
                        placeholder="Valor da folha PJ"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="label-uppercase">Contabilidade Regular</Label>
                  <div className="flex items-center gap-2 bg-background h-9 px-3 rounded-xl border text-xs">
                    <Switch checked={state.contabilidadeRegular} onCheckedChange={(checked) => dispatch({ type: "UPDATE_CONTABILIDADE_REGULAR", payload: checked })} className="scale-75" />
                    <Label className="text-xs font-normal">{state.contabilidadeRegular ? "Sim" : "Não"}</Label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="label-uppercase">Despesas PF ({currentPFPerc.toFixed(0)}%) / PJ ({currentPJPerc.toFixed(0)}%)</Label>
                  <Slider min={0} max={100} step={1} value={[currentPFPerc]} onValueChange={([v]) => dispatch({ type: "UPDATE_SIMULACAO_DESPESAS_PF_PERC", payload: v })} className="mt-2" />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Charts */}
      <div className="dashboard-grid animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
        {/* Comparativo */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Comparativo de Cenários</h3>
            <p>PF Pura vs Holding — Impostos totais</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparativoData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="cenario" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={yAxisFormatter} />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)', radius: 12 }} />
                <Bar dataKey="impostos" radius={[12, 12, 4, 4]} barSize={60}>
                  <Cell fill="hsl(var(--muted-foreground))" opacity={0.5} />
                  <Cell fill="hsl(152 55% 28%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composição */}
        <div className="chart-container">
          <div className="chart-header flex items-center justify-between">
            <div>
              <h3>Composição Tributária</h3>
              <p>{composicaoAtualAtiva.label}</p>
            </div>
            <div className="chart-switch">
              {abasComposicao.map((aba, idx) => (
                <button key={aba.label} data-active={composicaoActiveIdx === idx} onClick={() => setComposicaoActiveIdx(idx)} className="!w-auto !px-3 text-[10px] font-semibold">
                  {aba.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-body">
            {hasComposicaoData ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={composicaoData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel} animationBegin={0} animationDuration={600}>
                    {composicaoData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={3} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                    <div className="bg-popover border border-border rounded-2xl shadow-float p-3 text-xs">
                      <p className="font-bold">{payload[0].name}</p>
                      <p className="text-muted-foreground mt-0.5">{formatCurrency(Number(payload[0].value))}</p>
                    </div>
                  ) : null} />
                  <Legend formatter={(value) => <span className="text-[10px]">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">Sem dados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
