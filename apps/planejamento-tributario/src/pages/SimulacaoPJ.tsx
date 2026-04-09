import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";
import { Building2, Receipt, DollarSign, Calculator, Info, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import EditableCell from "@/components/EditableCell";
import ConfigPanel from "@/components/ConfigPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from "recharts";

export default function SimulacaoPJ() {
  const { state, derived, dispatch } = useCalcir();
  const { impostosPJ, retencaoFonteParceiros, distribuicaoDividendos, trimestresPJ } = derived;
  const [aliquotaSelectOpen, setAliquotaSelectOpen] = useState(false);
  const [customAliquotaInput, setCustomAliquotaInput] = useState("");

  const isAliquotaCustom = state.funruralPJAliquota !== 0.0205 && state.funruralPJAliquota !== 0.0223;
  const aliquotaCustomValue = String(state.funruralPJAliquota);
  const parseAliquotaPercentInput = (raw: string): number | null => {
    const normalized = raw.replace(",", ".");
    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed <= 0 || parsed > 100) return null;
    return parsed / 100;
  };

  const suggestedFolhaPagamento = state.rendimentosParticulares.reduce(
    (sum, rendimentos) => sum + rendimentos.proLabore.reduce((acc, value) => acc + value, 0), 0,
  );
  const hasSuggestedFolha = suggestedFolhaPagamento > 0;
  const funruralRegimeEfetivoPJ = state.funruralPJRegime;
  const funruralEfetivaPJAliquota = funruralRegimeEfetivoPJ === "folha" ? 0.288 : state.funruralPJAliquota;
  const funruralAliquotaLabel = funruralRegimeEfetivoPJ === "folha"
    ? "28,80% s/ folha"
    : `${(state.funruralPJAliquota * 100).toFixed(2).replace(".", ",")}%`;
  const funruralPFLabel = state.funruralPFRegime === "folha" ? "Folha (28,80%)" : "Comercialização (1,50%)";

  const impostos = [
    { label: "Base de Cálculo IR", value: impostosPJ.baseCalculoIR, isBase: true },
    { label: "Base CSLL", value: impostosPJ.baseCalculoCSLL, isBase: true },
    { label: "IR 15%", value: impostosPJ.ir15 },
    { label: "IR Adicional 10%", value: impostosPJ.irAdicional10 },
    { label: "CSLL 9%", value: impostosPJ.csll9 },
    { label: `Funrural ${funruralAliquotaLabel}`, value: impostosPJ.funrural },
    { label: "Dif. Funrural (PJ−PF)", value: impostosPJ.diferencaFunrural055, isBase: true },
    { label: "PIS", value: impostosPJ.pis },
    { label: "COFINS", value: impostosPJ.cofins },
  ];

  const totalImpostos = impostos.filter(i => !i.isBase).reduce((s, i) => s + i.value, 0);
  const donutData = impostos.filter(i => !i.isBase && i.value > 0).map(i => ({ name: i.label, value: i.value }));
  const DONUT_COLORS = ["hsl(152 55% 28%)", "hsl(38 70% 50%)", "hsl(152 45% 42%)", "hsl(200 60% 50%)", "hsl(25 80% 55%)", "hsl(340 50% 50%)"];
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <TooltipProvider>
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon"><Building2 /></div>
        <div>
          <h1>Simulação PJ</h1>
          <p>Simulação de tributação como Pessoa Jurídica</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: "Receita Total PJ", value: impostosPJ.faturamentoTotal, icon: TrendingUp, sub: "Faturamento bruto anual", accent: true },
          { title: "Demais Despesas PJ", value: derived.totalDespesasPJ, icon: Receipt, sub: "Despesas agro + extras" },
          { title: "Lucro Acumulado", value: state.lucroAcumuladoPJ, icon: DollarSign, sub: "Exercícios anteriores", editable: true },
          { title: "Total Impostos", value: totalImpostos, icon: Calculator, sub: "Carga tributária PJ", destructive: true },
        ].map((c, i) => (
          <div key={c.title} className={`animate-fade-in ${c.accent ? "metric-pill-accent" : "metric-pill"} ${c.destructive ? "!border-destructive/20" : ""}`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className={`metric-label ${c.destructive ? "!text-destructive" : ""}`}>{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.accent ? "text-white/50" : c.destructive ? "text-destructive/50" : "text-muted-foreground/40"}`} />
            </div>
            {c.editable ? (
              <EditableCell value={c.value} type="currency" onSave={(v) => dispatch({ type: "UPDATE_LUCRO_ACUMULADO_PJ", payload: Number(v) })} className="metric-value" />
            ) : (
              <span className={`metric-value ${c.destructive ? "!text-destructive" : ""}`}>{formatCurrency(c.value)}</span>
            )}
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Funrural Config — now using ConfigPanel, starts collapsed */}
      <ConfigPanel
        icon={<Building2 className="h-4 w-4" />}
        title="Configuração Funrural"
        summary={`PJ: ${state.funruralPJRegime === "folha" ? "Folha" : "Rec. Bruta"} (${funruralAliquotaLabel}) · PF: ${funruralPFLabel}`}
      >
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PJ */}
          <div className="space-y-3 p-4 rounded-2xl border border-border/50 bg-background/60">
            <p className="text-xs font-bold text-foreground">Pessoa Jurídica (PJ)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="label-uppercase">Forma de Tributação</p>
                <Select value={state.funruralPJRegime} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PJ_REGIME", payload: value as "receita_bruta" | "folha" })}>
                  <SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="receita_bruta">Receita Bruta</SelectItem><SelectItem value="folha">Folha</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="label-uppercase">Alíquota Funrural PJ</p>
                {funruralRegimeEfetivoPJ === "folha" ? (
                  <div className="h-10 flex items-center px-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground">28,80% (s/ folha)</div>
                ) : (
                  <Select open={aliquotaSelectOpen} onOpenChange={(open) => { setAliquotaSelectOpen(open); if (open) setCustomAliquotaInput((state.funruralPJAliquota * 100).toFixed(2).replace(".", ",")); }} value={isAliquotaCustom ? aliquotaCustomValue : String(state.funruralPJAliquota)} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PJ_ALIQUOTA", payload: Number(value) })}>
                    <SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.0205">2,05%</SelectItem>
                      <SelectItem value="0.0223">2,23%</SelectItem>
                      {isAliquotaCustom && <SelectItem value={aliquotaCustomValue}>{`${(state.funruralPJAliquota * 100).toFixed(2).replace(".", ",")}%`}</SelectItem>}
                      <div className="px-2 py-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground mb-1.5">Adicionar alíquota</p>
                        <div className="flex items-center gap-1.5">
                          <Input value={customAliquotaInput} onChange={(e) => setCustomAliquotaInput(e.target.value)} placeholder="Ex.: 2,30" className="h-8 text-xs rounded-lg" />
                          <Button type="button" size="sm" className="h-8 text-xs px-3 rounded-lg" onClick={() => { const parsed = parseAliquotaPercentInput(customAliquotaInput); if (parsed === null) return; dispatch({ type: "UPDATE_FUNRURAL_PJ_ALIQUOTA", payload: parsed }); setAliquotaSelectOpen(false); }}>OK</Button>
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1">
                <p className="label-uppercase">Folha PJ (Anual)</p>
                <EditableCell value={state.folhaPagamentoPJ} type="currency" onSave={(v) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PJ", payload: Number(v) })} className="text-sm font-bold" />
              </div>
            </div>
            {state.funruralPJRegime === "folha" && hasSuggestedFolha && (
              <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2">
                <button className="text-[11px] text-primary font-medium hover:underline" onClick={() => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PJ", payload: suggestedFolhaPagamento })}>
                  Sugestão: <strong>Folha</strong> é {formatCurrency(suggestedFolhaPagamento)} mais barata.
                </button>
              </div>
            )}
          </div>
          {/* PF */}
          <div className="space-y-3 p-4 rounded-2xl border border-border/50 bg-background/60">
            <p className="text-xs font-bold text-foreground">Pessoa Física (PF)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="label-uppercase">Forma de Tributação</p>
                <Select value={state.funruralPFRegime} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PF_REGIME", payload: value as "receita_bruta" | "folha" })}>
                  <SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="receita_bruta">Comercialização (1,50%)</SelectItem><SelectItem value="folha">Folha</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="label-uppercase">Folha PF (Anual)</p>
                <EditableCell value={state.folhaPagamentoPF} type="currency" onSave={(v) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PF", payload: Number(v) })} className="text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
      </ConfigPanel>

      {/* Main content: Tables + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Impostos Table */}
        <div className="data-panel animate-fade-in lg:col-span-1" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
          <div className="data-panel-header">
            <h3 className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Apuração de Impostos</h3>
          </div>
          <div className="data-panel-body">
            <div className="table-modern">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Tributo</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {impostos.map((item) => (
                    <TableRow key={item.label} className={item.isBase ? "text-muted-foreground" : ""}>
                      <TableCell className={`py-2 text-xs ${item.isBase ? "text-muted-foreground" : "font-medium"}`}>{item.label}</TableCell>
                      <TableCell className={`py-2 text-xs text-right tabular-nums ${item.isBase ? "text-muted-foreground" : "text-destructive font-semibold"}`}>{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="row-total">
                    <TableCell className="py-2 text-xs font-bold">TOTAL IMPOSTOS</TableCell>
                    <TableCell className="py-2 text-right tabular-nums font-bold text-destructive">{formatCurrency(totalImpostos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-container animate-fade-in lg:col-span-1" style={{ animationDelay: "420ms", animationFillMode: "both" }}>
          <div className="chart-header">
            <h3>Composição Tributária</h3>
            <p>Distribuição dos impostos PJ</p>
          </div>
          <div className="chart-body">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel} animationBegin={0} animationDuration={600}>
                    {donutData.map((_, idx) => <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={3} />)}
                  </Pie>
                  <RTooltip content={({ active, payload }) => active && payload?.[0] ? (
                    <div className="bg-popover border border-border rounded-2xl shadow-float p-3 text-xs">
                      <p className="font-bold">{payload[0].name}</p>
                      <p className="text-muted-foreground mt-0.5">{formatCurrency(Number(payload[0].value))}</p>
                    </div>
                  ) : null} />
                  <Legend formatter={(value) => <span className="text-[10px]">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">Sem impostos</div>
            )}
          </div>
        </div>

        {/* Trimestral */}
        <div className="data-panel animate-fade-in lg:col-span-1" style={{ animationDelay: "490ms", animationFillMode: "both" }}>
          <div className="data-panel-header">
            <h3>Apuração Trimestral</h3>
          </div>
          <div className="data-panel-body">
            <div className="table-modern overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="text-xs">Trim.</TableHead><TableHead className="text-right text-xs">Receita</TableHead><TableHead className="text-right text-xs">IR</TableHead><TableHead className="text-right text-xs">CSLL</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {trimestresPJ.map((t) => (
                    <Tooltip key={t.trimestre}>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-default">
                          <TableCell className="py-2 text-xs font-medium">{t.trimestre}</TableCell>
                          <TableCell className="py-2 text-xs text-right tabular-nums">{formatCurrency(t.faturamento)}</TableCell>
                          <TableCell className="py-2 text-xs text-right tabular-nums text-destructive">{formatCurrency(t.irTotal)}</TableCell>
                          <TableCell className="py-2 text-xs text-right tabular-nums text-destructive">{formatCurrency(t.csll9)}</TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-xs space-y-1">
                        <p className="font-bold">Trimestre {t.trimestre}</p>
                        <p>Faturamento: {formatCurrency(t.faturamento)}</p>
                        <p>Base IR (8%): {formatCurrency(t.faturamento * 0.08)}</p>
                        <p>Base CSLL (12%): {formatCurrency(t.faturamento * 0.12)}</p>
                        <p>IR Total: {formatCurrency(t.irTotal)}</p>
                        <p>CSLL 9%: {formatCurrency(t.csll9)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição de Dividendos + Retenção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="data-panel animate-fade-in" style={{ animationDelay: "560ms", animationFillMode: "both" }}>
          <div className="data-panel-header"><h3>Distribuição de Dividendos</h3></div>
          <div className="data-panel-body">
            <div className="table-modern">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Receita PJ", value: distribuicaoDividendos.receitaPJ },
                    { label: "(-) Impostos PJ", value: -distribuicaoDividendos.impostosPJ },
                    { label: "(-) Demais Despesas", value: -distribuicaoDividendos.demaisDespesas },
                    { label: "Dividendos a Distribuir", value: distribuicaoDividendos.dividendosADistribuir, bold: true },
                    { label: "Lucro Acumulado", value: distribuicaoDividendos.lucroAcumulado },
                    { label: "Total Tributável", value: distribuicaoDividendos.dividendosTributavel, bold: true },
                  ].map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className={`py-2 text-xs ${item.bold ? "font-bold" : ""}`}>{item.label}</TableCell>
                      <TableCell className={`py-2 text-xs text-right tabular-nums ${item.bold ? "font-bold" : ""} ${item.value < 0 ? "text-destructive" : ""}`}>{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="data-panel animate-fade-in" style={{ animationDelay: "630ms", animationFillMode: "both" }}>
          <div className="data-panel-header"><h3>Retenção na Fonte</h3></div>
          <div className="data-panel-body">
            <div className="table-modern">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Parceiro</TableHead><TableHead className="text-right">Dividendo</TableHead><TableHead className="text-right">IRRF 10%</TableHead><TableHead className="text-right">Líquido</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {retencaoFonteParceiros.map((r) => (
                    <TableRow key={r.parceiro}>
                      <TableCell className="py-2 text-xs font-medium">{r.parceiro}</TableCell>
                      <TableCell className="py-2 text-xs text-right tabular-nums">{formatCurrency(r.valorBruto)}</TableCell>
                      <TableCell className="py-2 text-xs text-right tabular-nums text-destructive">{formatCurrency(r.retencao10)}</TableCell>
                      <TableCell className="py-2 text-xs text-right tabular-nums font-semibold">{formatCurrency(r.valorLiquido)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
