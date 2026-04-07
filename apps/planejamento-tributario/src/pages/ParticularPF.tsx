import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";
import { Leaf, ArrowUpRight, ArrowDownRight, User, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { MESES } from "@/lib/calcirEngine";
import EditableCell from "@/components/EditableCell";

export default function ParticularPF() {
  const { state, dispatch } = useCalcir();

  const getNextCellId = (prefix: string, rowIndex: number, monthIndex: number) => {
    if (rowIndex < 1) return `${prefix}-r${rowIndex + 1}-m${monthIndex}`;
    if (monthIndex < MESES.length - 1) return `${prefix}-r0-m${monthIndex + 1}`;
    return undefined;
  };

  const allReceitas = state.atividadeRuralParticular.reduce((s, a) => s + a.receitas.reduce((ss, v) => ss + v, 0), 0);
  const allDespesas = state.atividadeRuralParticular.reduce((s, a) => s + a.despesas.reduce((ss, v) => ss + v, 0), 0);
  const allResultado = allReceitas - allDespesas;

  const updateMonthlyValue = (parceiroId: string, field: "receitas" | "despesas", monthIndex: number, value: number) => {
    const atividade = state.atividadeRuralParticular.find(a => a.parceiroId === parceiroId);
    if (!atividade) return;
    const newArray = [...atividade[field]];
    newArray[monthIndex] = value;
    dispatch({
      type: "UPDATE_ATIVIDADE_PARTICULAR",
      payload: { ...atividade, [field]: newArray },
    });
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div className="section-icon"><User /></div>
        <div>
          <h1>Atividade Rural Particular</h1>
          <p>Receitas e despesas da atividade rural direta (não parceria)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Total Receitas", value: allReceitas, icon: TrendingUp, sub: "Receitas rurais particulares", accent: false },
          { title: "Total Despesas", value: allDespesas, icon: TrendingDown, sub: "Despesas rurais particulares", accent: false, negative: true },
          { title: "Resultado", value: allResultado, icon: DollarSign, sub: "Todos os parceiros", accent: true },
        ].map((c, i) => (
          <div key={c.title} className={`animate-fade-in ${c.accent ? "metric-pill-accent" : "metric-pill"}`} style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.accent ? "text-white/50" : c.negative ? "text-destructive/50" : "text-muted-foreground/50"}`} />
            </div>
            <span className={`metric-value ${!c.accent && c.negative ? "text-destructive" : ""}`}><ExpandableValue>{formatCurrency(c.value)}</ExpandableValue></span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      {state.parceiros.map((parceiro, pi) => {
        const atividade = state.atividadeRuralParticular.find(a => a.parceiroId === parceiro.id);
        if (!atividade) return null;

        const totalReceitas = atividade.receitas.reduce((s, v) => s + v, 0);
        const totalDespesas = atividade.despesas.reduce((s, v) => s + v, 0);

        return (
          <div key={parceiro.id} className="data-panel animate-fade-in overflow-auto" style={{ animationDelay: `${(pi + 3) * 100}ms`, animationFillMode: "both" }}>
            <div className="data-panel-header">
              <h3 className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {parceiro.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                {parceiro.nome}
              </h3>
            </div>
            <div className="data-panel-body overflow-x-auto">
              <div className="table-modern">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-muted/30 z-10 min-w-[120px]">Item</TableHead>
                      {MESES.map((m) => <TableHead key={m} className="text-right min-w-[90px]">{m}</TableHead>)}
                      <TableHead className="text-right min-w-[110px] bg-muted/40">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-background">
                      <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm">Receitas</TableCell>
                      {atividade.receitas.map((v, i) => (
                        <TableCell key={i} className="text-right text-sm tabular-nums p-1">
                          <EditableCell
                            value={v}
                            type="currency"
                            onSave={(val) => updateMonthlyValue(parceiro.id, "receitas", i, Number(val))}
                            cellId={`pf-${parceiro.id}-r0-m${i}`}
                            enterNextCellId={getNextCellId(`pf-${parceiro.id}`, 0, i)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold tabular-nums bg-muted/20">{formatCurrency(totalReceitas)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/10">
                      <TableCell className="sticky left-0 bg-muted/10 z-10 font-medium text-sm">Despesas</TableCell>
                      {atividade.despesas.map((v, i) => (
                        <TableCell key={i} className="text-right text-sm tabular-nums text-destructive p-1">
                          <EditableCell
                            value={v}
                            type="currency"
                            onSave={(val) => updateMonthlyValue(parceiro.id, "despesas", i, Number(val))}
                            cellId={`pf-${parceiro.id}-r1-m${i}`}
                            enterNextCellId={getNextCellId(`pf-${parceiro.id}`, 1, i)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold tabular-nums bg-muted/20 text-destructive">{formatCurrency(totalDespesas)}</TableCell>
                    </TableRow>
                    <TableRow className="row-total">
                      <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">Resultado</TableCell>
                      {MESES.map((_, i) => {
                        const res = atividade.receitas[i] - atividade.despesas[i];
                        return (
                          <TableCell key={i} className={`text-right font-semibold tabular-nums ${res < 0 ? "text-destructive" : ""}`}>
                            {formatCurrency(res)}
                          </TableCell>
                        );
                      })}
                      <TableCell className={`text-right font-bold text-base tabular-nums bg-primary/10 ${totalReceitas - totalDespesas < 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(totalReceitas - totalDespesas)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
