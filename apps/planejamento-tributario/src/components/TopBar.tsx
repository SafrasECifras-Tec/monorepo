import { Cloud, Loader2, Users, Plus, CheckCircle, BarChart3, Truck, Receipt, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useCalcir, type CreditoIBSCBS } from "@/contexts/CalcirContext";
import { useLocation } from "react-router-dom";

const PARCEIRO_ROUTES = ["/particular-pf", "/rec-nao-rurais", "/relatorio-final"];

export function TopBar() {
  const { role } = useAuth();
  const { saving, analises, analiseId, setAnaliseId, state, selectedParceiroId, setSelectedParceiroId, dispatch } = useCalcir();
  const location = useLocation();

  const showParceiroSelector = PARCEIRO_ROUTES.includes(location.pathname) && state.parceiros.length > 0;
  const isReceitas = location.pathname === "/receitas";
  const isDespesas = location.pathname === "/despesas";

  const emit = (kind: string, id: string) =>
    window.dispatchEvent(new CustomEvent("plt-item-added", { detail: { kind, id } }));

  const addReceitaRealizacao = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_RECEITA_REALIZACAO",
      payload: { id, produto: "NOVO", obs: "", entidade: "PF", pisCofins: false, funruralNaoIncidente: false, mes: "Jan", quantidade: 0, valorUnit: 0, total: 0, estoque: 0 },
    });
    emit("receita-realizacao", id);
  };

  const addReceitaProjecao = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_RECEITA_PROJECAO",
      payload: { id, produto: "NOVO", obs: "", entidade: "PF", pisCofins: false, funruralNaoIncidente: false, mes: "Jan", quantidade: 0, valorUnit: 0, total: 0, estoque: 0 },
    });
    emit("receita-projecao", id);
  };

  const addVendaImobilizado = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_VENDA_IMOBILIZADO",
      payload: { id, descricao: "Nova Venda", entidade: "PF", mes: "Jan", realizado: 0, projetado: 0, total: 0 },
    });
    emit("venda-imobilizado", id);
  };

  const addDespesaOperacional = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_DESPESA",
      payload: { id, descricao: "Nova Despesa", obs: "", entidade: "PF", totalAnoAnterior: 0, realizado: 0, aRealizar: 0, total: 0, creditoIBSCBS: "sem_credito" as CreditoIBSCBS, estoque: 0 },
    });
    emit("despesa-operacional", id);
  };

  const addImobilizadoAquisicao = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_IMOBILIZADO_AQUISICAO",
      payload: { id, descricao: "Novo Investimento", entidade: "PF", realizado: 0, aRealizar: 0, total: 0 },
    });
    emit("despesa-imobilizado", id);
  };

  return (
    <header className="glass-card flex h-14 items-center justify-between rounded-[2rem] px-5 shrink-0 shadow-float">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="lg:hidden rounded-full border border-border/60 bg-background/70 text-foreground shadow-soft" />

        {analises.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={analiseId ?? undefined} onValueChange={setAnaliseId}>
              <SelectTrigger className="h-9 w-[200px] rounded-full border-border/60 bg-background/70 text-xs shadow-soft">
                <SelectValue placeholder="Selecionar análise" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {analises.map((analise) => (
                  <SelectItem key={analise.id} value={analise.id}>
                    {analise.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div
              aria-label={saving ? "Salvando" : "Salvo"}
              title={saving ? "Salvando alterações..." : "Todas as alterações salvas"}
              className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <Cloud className="h-3.5 w-3.5 text-primary" />}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isReceitas && (
          <div className="flex items-center gap-px bg-primary/5 border border-primary/15 rounded-full p-1 shadow-soft">
            <Button
              variant="ghost"
              size="sm"
              onClick={addReceitaRealizacao}
              className="h-7 rounded-full text-xs px-3 gap-1.5 hover:bg-primary/15 hover:text-primary font-medium"
            >
              <Plus className="h-3 w-3" />
              <CheckCircle className="h-3 w-3 opacity-60" />
              <span className="hidden sm:inline">Realização</span>
            </Button>
            <div className="h-4 w-px bg-border/50 mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={addReceitaProjecao}
              className="h-7 rounded-full text-xs px-3 gap-1.5 hover:bg-primary/15 hover:text-primary font-medium"
            >
              <Plus className="h-3 w-3" />
              <BarChart3 className="h-3 w-3 opacity-60" />
              <span className="hidden sm:inline">Projeção</span>
            </Button>
            <div className="h-4 w-px bg-border/50 mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={addVendaImobilizado}
              className="h-7 rounded-full text-xs px-3 gap-1.5 hover:bg-primary/15 hover:text-primary font-medium"
            >
              <Plus className="h-3 w-3" />
              <Truck className="h-3 w-3 opacity-60" />
              <span className="hidden sm:inline">Imobilizado</span>
            </Button>
          </div>
        )}

        {isDespesas && (
          <div className="flex items-center gap-px bg-destructive/5 border border-destructive/15 rounded-full p-1 shadow-soft">
            <Button
              variant="ghost"
              size="sm"
              onClick={addDespesaOperacional}
              className="h-7 rounded-full text-xs px-3 gap-1.5 hover:bg-destructive/15 hover:text-destructive font-medium"
            >
              <Plus className="h-3 w-3" />
              <Receipt className="h-3 w-3 opacity-60" />
              <span className="hidden sm:inline">Operacional</span>
            </Button>
            <div className="h-4 w-px bg-border/50 mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={addImobilizadoAquisicao}
              className="h-7 rounded-full text-xs px-3 gap-1.5 hover:bg-destructive/15 hover:text-destructive font-medium"
            >
              <Plus className="h-3 w-3" />
              <Package className="h-3 w-3 opacity-60" />
              <span className="hidden sm:inline">Investimento</span>
            </Button>
          </div>
        )}

        {showParceiroSelector && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <Select
              value={selectedParceiroId || state.parceiros[0]?.id || ""}
              onValueChange={setSelectedParceiroId}
            >
              <SelectTrigger className="h-8 w-[160px] rounded-full border-border/60 bg-background/70 text-xs shadow-soft">
                <SelectValue placeholder="Parceiro" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {state.parceiros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </header>
  );
}
