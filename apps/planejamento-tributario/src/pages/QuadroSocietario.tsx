import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Users, UserCheck, PieChart, Percent, Plus, Trash2, AlertTriangle, History } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import EditableCell from "@/components/EditableCell";
import ConfigPanel from "@/components/ConfigPanel";
import { useToast } from "@/hooks/use-toast";

export default function QuadroSocietario() {
  const { state, dispatch } = useCalcir();
  const { toast } = useToast();
  const { parceiros } = state;
  const totalParticipacao = parceiros.reduce((s, p) => s + p.participacao, 0);
  const participacaoOk = Math.abs(totalParticipacao - 100) < 0.1;

  const addParceiro = () => {
    dispatch({
      type: "ADD_PARCEIRO",
      payload: { id: crypto.randomUUID(), nome: "Novo Parceiro", cpf: "", participacao: 0 },
    });
  };

  const saveParticipacao = (parceiro: (typeof parceiros)[number], value: number | string) => {
    const participacao = Number(value);
    const novoTotalParticipacao = parceiros.reduce(
      (sum, item) => sum + (item.id === parceiro.id ? participacao : item.participacao),
      0,
    );
    if (novoTotalParticipacao > 100) {
      toast({ title: "Participação inválida", description: "Não pode ter mais que 100% de participação no total.", variant: "destructive" });
      return;
    }
    dispatch({ type: "UPDATE_PARCEIRO", payload: { ...parceiro, participacao } });
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div className="section-icon"><Users /></div>
        <div>
          <h1>Quadro Societário</h1>
          <p>Participação dos parceiros na estrutura de exploração</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="metric-pill animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="metric-label">Total Parceiros</span>
            <Users className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="metric-value">{parceiros.length}</span>
          <span className="metric-sub">Participantes ativos</span>
        </div>
        <div className={`metric-pill animate-fade-in ${!participacaoOk ? "!border-destructive/25 !bg-destructive/5" : ""}`} style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between">
            <span className="metric-label flex items-center gap-1">
              Participação Total
              {!participacaoOk && <AlertTriangle className="h-3 w-3 text-destructive/60" />}
            </span>
            <PieChart className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className={`metric-value ${!participacaoOk ? "text-destructive" : ""}`}>{formatPercent(totalParticipacao)}</span>
          <span className="metric-sub">{participacaoOk ? "Alocação 100%" : "Soma deve ser 100%"}</span>
        </div>
        <div className="metric-pill-accent animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between">
            <span className="metric-label">Maior Participação</span>
            <UserCheck className="h-4 w-4 text-white/50" />
          </div>
          <span className="metric-value truncate">{parceiros[0]?.nome || "-"}</span>
          <span className="metric-sub">{formatPercent(parceiros[0]?.participacao || 0)} de participação</span>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {parceiros.map((p, i) => (
          <div key={p.id} className="metric-pill animate-fade-in !p-4" style={{ animationDelay: `${(i + 3) * 80}ms`, animationFillMode: "both" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {p.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <EditableCell value={p.nome} type="text" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, nome: String(v) } })} className="font-semibold text-sm" />
                <EditableCell value={p.cpf} type="cpf" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, cpf: String(v) } })} className="text-xs text-muted-foreground font-mono block" />
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/40 hover:text-destructive shrink-0" onClick={() => dispatch({ type: "DELETE_PARCEIRO", payload: p.id })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Participação</span>
                <EditableCell value={p.participacao} type="percent" onSave={(v) => saveParticipacao(p, v)} className="text-sm font-bold" />
              </div>
              <Progress value={p.participacao} className="h-1.5 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={addParceiro}>
          <Plus className="h-3.5 w-3.5" /> Adicionar Parceiro
        </Button>
      </div>

      {/* Prejuízo Anterior por Parceiro */}
      <ConfigPanel
        icon={<History className="h-4 w-4" />}
        title="Prejuízo do Ano Anterior"
        summary={`${state.parceiros.filter(p => (state.prejuizosAnteriores[p.id] || 0) > 0).length} parceiro(s) com prejuízo`}
      >
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.parceiros.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/50 bg-background/60 p-4">
              <p className="text-xs font-bold text-foreground mb-2">{p.nome}</p>
              <div className="flex items-center justify-between">
                <span className="label-uppercase">Prejuízo anterior</span>
                <EditableCell
                  value={state.prejuizosAnteriores[p.id] || 0}
                  type="currency"
                  onSave={(v) => dispatch({ type: "UPDATE_PREJUIZO_ANTERIOR", payload: { parceiroId: p.id, valor: Number(v) } })}
                  className="text-sm font-bold"
                />
              </div>
            </div>
          ))}
        </div>
      </ConfigPanel>

      {/* Detail Table */}
      <div className="data-panel animate-fade-in">
        <div className="data-panel-header">
          <h3 className="flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Detalhamento</h3>
        </div>
        <div className="data-panel-body">
          <div className="table-modern">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-right">% Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parceiros.map((p, i) => (
                  <TableRow key={p.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                    <TableCell>
                      <EditableCell value={p.nome} type="text" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, nome: String(v) } })} className="font-medium" />
                    </TableCell>
                    <TableCell>
                      <EditableCell value={p.cpf} type="cpf" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, cpf: String(v) } })} className="font-mono text-sm text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableCell value={p.participacao} type="percent" onSave={(v) => saveParticipacao(p, v)} className="font-semibold" />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="row-total">
                  <TableCell className="font-bold" colSpan={2}>TOTAL</TableCell>
                  <TableCell className={`text-right font-bold tabular-nums ${!participacaoOk ? "text-destructive" : ""}`}>{formatPercent(totalParticipacao)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
