import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { FileText, TrendingUp, TrendingDown, DollarSign, SlidersHorizontal, Users } from "lucide-react";
import { calcularIRPF } from "@/lib/calcirEngine";

import ConfigPanel from "@/components/ConfigPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function RelatorioFinal() {
  const { state, derived, dispatch, selectedParceiroId } = useCalcir();
  const { resultadosParceiros } = derived;
  const parceiroId = selectedParceiroId || resultadosParceiros[0]?.parceiroId;

  const p = resultadosParceiros.find(r => r.parceiroId === parceiroId) || resultadosParceiros[0];
  if (!p) return null;

  const regime = state.regimeApuracaoRural[p.parceiroId] || "automatico";
  const lcdprObrigatorio = !state.contabilidadeRegular && derived.totalReceitasPF > state.lcdprLimite;
  const regimeEfetivo = p.regimeEfetivo || (regime === "automatico"
    ? (p.baseArbitramento <= p.baseCalculo ? "arbitramento" : "resultado")
    : regime);

  const regimeLabel = regime === "automatico" ? "Automático" : regime === "arbitramento" ? "Arbitramento" : "Resultado";
  const regimeEfetivoLabel = regimeEfetivo === "arbitramento" ? "Arbitramento (20% receita)" : "Resultado real";

  const baseTributavel = p.baseTributavel;
  const irpfResult = calcularIRPF(baseTributavel);

  const itens = [
    { item: "Receitas", perc: p.percReceita, apuracao: p.receitaApuracao, particular: p.receitaParticular, total: p.receitaTotal, highlight: false },
    { item: "Despesas", perc: p.percDespesa, apuracao: p.despesaApuracao, particular: p.despesaParticular, total: p.despesaTotal, highlight: false },
    { item: "Resultado", perc: p.percReceita, apuracao: p.resultadoApuracao, particular: p.resultadoParticular, total: p.resultadoTotal, highlight: true },
    { item: "Prejuízo a Compensar", perc: 0, apuracao: 0, particular: 0, total: -p.prejuizoACompensar, highlight: false },
    { item: "Prejuízo Acumulado", perc: 0, apuracao: 0, particular: 0, total: -p.prejuizoAcumulado, highlight: false },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="section-header mb-0">
          <div className="section-icon"><FileText /></div>
          <div>
            <h1>Relatório Final</h1>
            <p>Apuração por parceiro com demonstrativo fiscal</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Receitas PF", icon: TrendingUp, value: derived.totalReceitasPF, sub: `PJ: ${formatCurrency(derived.totalReceitasPJ)}`, accent: false },
          { title: `Despesas (${formatPercent(p.percDespesa)} PF)`, icon: TrendingDown, value: derived.totalDespesasPF, sub: `Realizado: ${formatCurrency(derived.totalDespesasRealizadas)}`, accent: false },
          { title: "Resultado PF", icon: DollarSign, value: derived.resultadoPF, sub: `Geral: ${formatCurrency(derived.totalReceitasGeral - derived.totalDespesas)}`, accent: true },
        ].map((c, i) => (
          <div key={c.title} className={`animate-fade-in ${c.accent ? "metric-pill-accent" : "metric-pill"}`} style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.accent ? "text-white/50" : "text-muted-foreground/50"}`} />
            </div>
            <span className="metric-value"><ExpandableValue>{formatCurrency(c.value)}</ExpandableValue></span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Config Panel — Regime */}
      <ConfigPanel
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="Regime de Apuração Rural"
        summary={`${regimeLabel} → ${regimeEfetivoLabel}`}
      >
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="label-uppercase">Regime</p>
            <Select
              value={regime}
              onValueChange={(value) => dispatch({ type: "UPDATE_REGIME_APURACAO_RURAL", payload: { parceiroId: p.parceiroId, regime: value as "automatico" | "arbitramento" | "resultado" } })}
            >
              <SelectTrigger className="h-10 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatico">Automático (menor base)</SelectItem>
                <SelectItem value="resultado">Resultado real</SelectItem>
                <SelectItem value="arbitramento">Arbitramento (20%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="label-uppercase">Regime Efetivo</p>
            <div className="h-10 rounded-xl border border-border/50 bg-muted/30 px-3 flex items-center">
              <span className="text-sm font-medium text-foreground">{regimeEfetivoLabel}</span>
            </div>
            {lcdprObrigatorio && (
              <p className="text-[11px] text-destructive/70 font-medium">⚠ LCDPR obrigatório — arbitramento aplicado</p>
            )}
          </div>
        </div>
        {regime === "automatico" && !lcdprObrigatorio && (
          <p className="text-[11px] text-muted-foreground mt-3">
            O sistema escolhe automaticamente entre resultado real e arbitramento, optando pela menor base tributável.
          </p>
        )}
      </ConfigPanel>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Apuração Table */}
        <div className="lg:col-span-2 data-panel animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <div className="data-panel-header">
            <h3 className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Apuração — {p.parceiro}</h3>
          </div>
          <div className="data-panel-body">
            <div className="table-modern">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Apuração</TableHead>
                    <TableHead className="text-right">Particular</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.item} className={item.highlight ? "bg-primary/5 font-semibold" : ""}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.perc > 0 ? formatPercent(item.perc) : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.apuracao)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.particular)}</TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold ${item.highlight && item.total < 0 ? "text-destructive" : ""}`}>{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Demonstrativo */}
        <div className="data-panel animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <div className="data-panel-header">
            <h3 className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Demonstrativo</h3>
          </div>
          <div className="p-5 space-y-0">
            {[
              { label: "Base de Cálculo", value: baseTributavel },
              { label: "Dedução Simplificada", value: irpfResult.deducaoSimplificada },
              { label: "Base Tributável", value: irpfResult.baseTributavel },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="tabular-nums font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-1 border-t-2 border-primary/20">
              <span className="text-sm font-bold text-foreground">IRPF a Pagar</span>
              <span className={`text-lg font-bold tabular-nums ${p.irpfCalculado > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {formatCurrency(p.irpfCalculado)}
              </span>
            </div>
            {irpfResult.usouSimplificado && (
              <p className="text-[10px] text-muted-foreground mt-2">✓ Modelo simplificado aplicado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
