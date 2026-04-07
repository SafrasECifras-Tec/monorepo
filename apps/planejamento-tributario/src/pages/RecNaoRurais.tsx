import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir, type RendimentosParticulares, type RetencoesParticulares } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";

import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { MESES } from "@/lib/calcirEngine";
import EditableCell from "@/components/EditableCell";


type RendField = keyof Omit<RendimentosParticulares, "parceiroId">;
type RetField = keyof Omit<RetencoesParticulares, "parceiroId">;

export default function RecNaoRurais() {
  const { state, dispatch, selectedParceiroId, setSelectedParceiroId } = useCalcir();
  const parceiroId = selectedParceiroId || state.parceiros[0]?.id;

  const getNextCellId = (prefix: string, rowIndex: number, monthIndex: number, totalRows: number) => {
    if (rowIndex < totalRows - 1) return `${prefix}-r${rowIndex + 1}-m${monthIndex}`;
    if (monthIndex < MESES.length - 1) return `${prefix}-r0-m${monthIndex + 1}`;
    return undefined;
  };

  const parceiro = state.parceiros.find(p => p.id === parceiroId) || state.parceiros[0];

  if (!parceiro) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Nenhum parceiro cadastrado. Adicione parceiros no Quadro Societário.
      </div>
    );
  }

  const rendimentos = state.rendimentosParticulares.find(r => r.parceiroId === parceiro.id);
  const retencoes = state.retencoesParticulares.find(r => r.parceiroId === parceiro.id);

  const updateRendimento = (field: RendField, monthIndex: number, value: number) => {
    if (!rendimentos) return;
    const newArr = [...(rendimentos[field] as number[])];
    newArr[monthIndex] = value;
    dispatch({ type: "UPDATE_RENDIMENTOS_PARTICULARES", payload: { ...rendimentos, [field]: newArr } });
  };

  const updateRetencao = (field: RetField, monthIndex: number, value: number) => {
    if (!retencoes) return;
    const newArr = [...(retencoes[field] as number[])];
    newArr[monthIndex] = value;
    dispatch({ type: "UPDATE_RETENCOES_PARTICULARES", payload: { ...retencoes, [field]: newArr } });
  };

  const rendimentosRows: { label: string; field: RendField; values: number[] }[] = [
    { label: "Dividendos", field: "dividendos", values: rendimentos?.dividendos || Array(12).fill(0) },
    { label: "Aluguéis", field: "alugueis", values: rendimentos?.alugueis || Array(12).fill(0) },
    { label: "Pró-Labore", field: "proLabore", values: rendimentos?.proLabore || Array(12).fill(0) },
    { label: "Rend. Aplicações", field: "rendAplicacoes", values: rendimentos?.rendAplicacoes || Array(12).fill(0) },
    { label: "LCI/LCA/Poupança", field: "rendProtegidos", values: rendimentos?.rendProtegidos || Array(12).fill(0) },
    { label: "Doações", field: "doacoes", values: rendimentos?.doacoes || Array(12).fill(0) },
    { label: "Ganho de Capital", field: "ganhoCapital", values: rendimentos?.ganhoCapital || Array(12).fill(0) },
  ];

  const retencoesRows: { label: string; field: RetField; values: number[] }[] = [
    { label: "IRRF Dividendos", field: "irrfDividendos", values: retencoes?.irrfDividendos || Array(12).fill(0) },
    { label: "IRRF Aluguéis", field: "irrfAlugueis", values: retencoes?.irrfAlugueis || Array(12).fill(0) },
    { label: "IRRF Pró-Labore", field: "irrfProLabore", values: retencoes?.irrfProLabore || Array(12).fill(0) },
    { label: "IRRF Rend. Aplicações", field: "irrfRendAplicacoes", values: retencoes?.irrfRendAplicacoes || Array(12).fill(0) },
    { label: "IRRF Operações Bolsa", field: "irrfOperacoesBolsa", values: retencoes?.irrfOperacoesBolsa || Array(12).fill(0) },
  ];

  const totalRendimentos = rendimentosRows.reduce((s, r) => s + r.values.reduce((a, b) => a + b, 0), 0);
  const totalRetencoes = retencoesRows.reduce((s, r) => s + r.values.reduce((a, b) => a + b, 0), 0);
  const totalLiquido = totalRendimentos - totalRetencoes;

  const totalMensal = MESES.map((_, i) =>
    rendimentosRows.reduce((s, r) => s + r.values[i], 0) -
    retencoesRows.reduce((s, r) => s + r.values[i], 0)
  );

  const renderEditableTable = (
    tableId: string,
    title: string,
    rows: { label: string; field: string; values: number[] }[],
    icon: React.ReactNode,
    isRetencao?: boolean,
  ) => (
    <Card className="animate-fade-in overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="sticky left-0 bg-muted/40 z-10 min-w-[160px] font-semibold text-foreground">Item</TableHead>
                {MESES.map((m) => <TableHead key={m} className="text-right min-w-[100px] font-semibold text-foreground">{m}</TableHead>)}
                <TableHead className="text-right min-w-[120px] font-bold text-foreground bg-muted/60">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, ri) => (
                <TableRow key={row.label} className={ri % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <TableCell className={`sticky left-0 z-10 font-medium ${ri % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>{row.label}</TableCell>
                  {row.values.map((v, i) => (
                    <TableCell key={i} className={`text-right text-sm tabular-nums p-1 ${isRetencao && v > 0 ? "text-destructive" : ""}`}>
                      <EditableCell
                        value={v}
                        type="currency"
                        onSave={(val) => {
                          if (isRetencao) {
                            updateRetencao(row.field as RetField, i, Number(val));
                          } else {
                            updateRendimento(row.field as RendField, i, Number(val));
                          }
                        }}
                        cellId={`${tableId}-r${ri}-m${i}`}
                        enterNextCellId={getNextCellId(tableId, ri, i, rows.length)}
                      />
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-semibold tabular-nums ${ri % 2 === 0 ? "bg-muted/30" : "bg-muted/40"} ${isRetencao ? "text-destructive" : ""}`}>
                    {formatCurrency(row.values.reduce((a, b) => a + b, 0))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-primary/5 border-t-2 border-primary/20 hover:bg-primary/10">
                <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold text-foreground">TOTAL</TableCell>
                {MESES.map((_, i) => {
                  const sum = rows.reduce((s, r) => s + r.values[i], 0);
                  return (
                    <TableCell key={i} className={`text-right font-semibold tabular-nums ${isRetencao && sum > 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(sum)}
                    </TableCell>
                  );
                })}
                <TableCell className={`text-right font-bold text-lg tabular-nums bg-primary/10 ${isRetencao ? "text-destructive" : ""}`}>
                  {formatCurrency(rows.reduce((s, r) => s + r.values.reduce((a, b) => a + b, 0), 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="section-header mb-0">
          <div className="section-icon"><Wallet /></div>
          <div>
            <h1>Rec. Não Rurais</h1>
            <p>Rendimentos e retenções particulares por parceiro</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Total Rendimentos", value: totalRendimentos, icon: TrendingUp, sub: `${rendimentosRows.length} fontes de renda`, accent: false },
          { title: "Total Retenções", value: totalRetencoes, icon: TrendingDown, sub: `${retencoesRows.length} tipos de retenção`, accent: false, negative: true },
          { title: "Resultado Líquido", value: totalLiquido, icon: DollarSign, sub: `${parceiro.nome} — Acumulado anual`, accent: true },
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

      <Card className="gradient-card text-primary-foreground border-0 animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary-foreground">Resultado Final Mensal — {parceiro.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 pb-2">
            {MESES.map((m, i) => (
              <div key={m} className="flex flex-col items-center px-2 py-2 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
                <span className="text-[10px] text-primary-foreground/60 uppercase font-medium">{m}</span>
                <span className="text-xs font-bold mt-0.5">{formatCurrency(totalMensal[i])}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {renderEditableTable(`rend-${parceiro.id}`, "Rendimentos", rendimentosRows, <ArrowUpRight className="h-5 w-5 text-success" />)}
      {renderEditableTable(`ret-${parceiro.id}`, "Retenções", retencoesRows, <ArrowDownRight className="h-5 w-5 text-destructive" />, true)}
    </div>
  );
}
