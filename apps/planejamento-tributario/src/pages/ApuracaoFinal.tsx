import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Leaf, Building2, TrendingDown, DollarSign } from "lucide-react";

export default function ApuracaoFinal() {
  const { derived } = useCalcir();
  const { resultadosParceiros, impostosPJ, economia } = derived;

  return (
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon"><TrendingUp /></div>
        <div><h1>Apuração Final</h1><p>Resultado resumo e economia tributária</p></div>
      </div>

      {/* Hero Board */}
      <div className="hero-board animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <div className="hero-copy">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Receitas Totais", value: derived.totalReceitasPF, icon: TrendingUp },
              { title: "Despesas Totais", value: derived.totalDespesasPF, icon: TrendingDown },
              { title: "Resultado", value: derived.resultadoPF, icon: DollarSign },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl bg-background/60 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="label-uppercase">{c.title}</span>
                  <c.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                <p className="text-sm sm:text-lg font-extrabold tabular-nums"><ExpandableValue>{formatCurrency(c.value)}</ExpandableValue></p>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-insight">
          <div>
            <span className="hero-insight-label">Economia Tributária</span>
            <p className="hero-insight-value">{formatCurrency(economia.economia)}</p>
            <p className="hero-insight-sub">Antes: {formatCurrency(economia.antes)} → Depois: {formatCurrency(economia.depois)}</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Leaf className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[10px] uppercase font-bold text-white/50">{formatPercent(economia.percentual)} de redução</span>
          </div>
        </div>
      </div>

      {/* Estrutura de Exploração */}
      <div className="data-panel animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="data-panel-header"><h3>Estrutura de Exploração</h3></div>
        <div className="data-panel-body p-3">
          <div className="table-modern">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead className="text-right">% Receita</TableHead>
                  <TableHead className="text-right">% Despesas</TableHead>
                  <TableHead className="text-right">Prejuízo a Compensar</TableHead>
                  <TableHead className="text-right">IRPF Calculado</TableHead>
                  <TableHead className="text-right">Prejuízo Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultadosParceiros.map((p) => (
                  <TableRow key={p.parceiro}>
                    <TableCell className="font-medium">{p.parceiro}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(p.percReceita)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(p.percDespesa)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.prejuizoACompensar)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-destructive">{formatCurrency(p.irpfCalculado)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.prejuizoAcumulado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* PJ & Economia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="data-panel animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <div className="data-panel-header">
            <h3 className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Pessoa Jurídica</h3>
          </div>
          <div className="p-5 space-y-0">
            {[
              { label: "Receitas PJ", value: derived.totalReceitasPJ },
              { label: "Despesas PJ", value: derived.totalDespesasPJ },
              { label: "Funrural", value: impostosPJ.funrural, negative: true },
              { label: "IRPJ/CSLL", value: impostosPJ.ir15 + impostosPJ.irAdicional10 + impostosPJ.csll9, negative: true },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`tabular-nums font-semibold text-sm ${item.negative ? "text-destructive" : ""}`}>{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-pill-accent animate-fade-in !p-6 !min-h-0" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-5 w-5 text-white/80" />
            <h3 className="text-base font-bold text-white">Economia Tributária</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Antes (PF pura)", value: economia.antes },
              { label: "Depois (Holding + IRPFM)", value: economia.depois },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/15">
                <span className="text-sm text-white/60">{item.label}</span>
                <span className="tabular-nums font-semibold text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3">
              <span className="text-sm font-bold text-white">Economia</span>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">{formatCurrency(economia.economia)}</p>
                <p className="text-xs text-white/50">{formatPercent(economia.percentual)} de redução</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
