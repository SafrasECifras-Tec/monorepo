import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, ChevronDown, FileText, History, Loader2, LayoutDashboard, MapPin, Percent, PieChart, Plus, Scale, Trash2, TrendingDown, TrendingUp, UserCheck, Users, Pencil } from "lucide-react";
import ExpandableValue from "@/components/ExpandableValue";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import EditableCell from "@/components/EditableCell";
import ConfigPanel from "@/components/ConfigPanel";
import { useCalcir } from "@/contexts/CalcirContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatPercent } from "@/lib/format";

interface ClienteInfo {
  nome: string;
  documento: string | null;
  estado: string | null;
  regional: string | null;
  foto_url: string | null;
}

export default function InformacoesCliente() {
  const { clienteId, state, dispatch, derived } = useCalcir();
  const { toast } = useToast();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCliente = async () => {
      if (!clienteId) { setCliente(null); setLoading(false); return; }
      setLoading(true);
      const { data } = await supabase.from("clientes").select("nome, documento, estado, regional, foto_url").eq("id", clienteId).maybeSingle();
      setCliente((data as ClienteInfo | null) ?? null);
      setLoading(false);
    };
    loadCliente();
  }, [clienteId]);

  const fotoPublica = useMemo(() => {
    if (!cliente?.foto_url) return null;
    const { data } = supabase.storage.from("fazenda-fotos").getPublicUrl(cliente.foto_url);
    return data.publicUrl;
  }, [cliente?.foto_url]);

  const totalReceitas = derived.totalReceitasGeral;
  const totalDespesas = derived.totalDespesas;
  const totalParticipacao = state.parceiros.reduce((sum, p) => sum + p.participacao, 0);
  const participacaoOk = Math.abs(totalParticipacao - 100) < 0.1;
  const maxParticipacao = state.parceiros.length > 0 ? Math.max(...state.parceiros.map(p => p.participacao)) : 0;
  const parceirosMaiorParticipacao = state.parceiros.filter(p => p.participacao === maxParticipacao);
  const isEmpateMaiorParticipacao = parceirosMaiorParticipacao.length > 1;

  const [funruralOpen, setFunruralOpen] = useState(false);
  const [aliquotaSelectOpen, setAliquotaSelectOpen] = useState(false);
  const [customAliquotaInput, setCustomAliquotaInput] = useState("");

  const funruralAliquotaLabel = `${(state.funruralPJAliquota * 100).toFixed(2).replace(".", ",")}%`;
  const isAliquotaCustom = state.funruralPJAliquota !== 0.0205 && state.funruralPJAliquota !== 0.0223;
  const aliquotaCustomValue = String(state.funruralPJAliquota);

  const parseAliquotaPercentInput = (raw: string): number | null => {
    const trimmed = raw.trim().replace("%", "");
    const cleaned = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
    const value = Number(cleaned);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value / 100;
  };

  const suggestedFolhaPagamento = state.rendimentosParticulares.reduce(
    (sum, rendimentos) => sum + rendimentos.proLabore.reduce((acc, value) => acc + value, 0), 0,
  );
  const hasSuggestedFolha = suggestedFolhaPagamento > 0;

  const addParceiro = () => {
    dispatch({ type: "ADD_PARCEIRO", payload: { id: crypto.randomUUID(), nome: "Novo Parceiro", cpf: "", participacao: 0 } });
  };

  const saveParticipacao = (parceiro: (typeof state.parceiros)[number], value: number | string) => {
    const participacao = Number(value);
    const novoTotalParticipacao = state.parceiros.reduce((sum, item) => sum + (item.id === parceiro.id ? participacao : item.participacao), 0);
    if (novoTotalParticipacao > 100) {
      toast({ title: "Participação inválida", description: "Não pode ter mais que 100% de participação no total.", variant: "destructive" });
      return;
    }
    dispatch({ type: "UPDATE_PARCEIRO", payload: { ...parceiro, participacao } });
  };

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!clienteId) {
    return <div className="space-y-2"><h1 className="text-2xl font-bold">Informações do Cliente</h1><p className="text-sm text-muted-foreground">Selecione um cliente para visualizar os dados da capa.</p></div>;
  }

  return (
    <div className="space-y-5">
      {/* Hero Board */}
      <div className="hero-board animate-fade-in">
        <div className="hero-copy relative overflow-hidden">
          {fotoPublica && (
            <div className="absolute inset-y-0 right-0 w-1/2 opacity-15 pointer-events-none" style={{ backgroundImage: `url(${fotoPublica})`, backgroundSize: 'cover', backgroundPosition: 'right center', maskImage: 'linear-gradient(to right, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)' }} />
          )}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-[1.35rem] gradient-primary flex items-center justify-center shadow-card">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="hero-copy-title">{cliente?.nome || "Cliente"}</h1>
                <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs font-medium">{cliente?.regional || cliente?.estado || "Regional não informada"}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/60 p-3">
                <span className="label-uppercase block mb-1">Documento</span>
                <div className="flex items-center gap-2 text-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold">{cliente?.documento || "Não informado"}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-background/60 p-3">
                <span className="label-uppercase block mb-1">Estrutura</span>
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold">{state.parceiros.length} {state.parceiros.length === 1 ? 'Sócio' : 'Sócios'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-insight">
          <div>
            <span className="hero-insight-label">Resultado Operacional</span>
            <p className="hero-insight-value">{formatCurrency(totalReceitas - totalDespesas)}</p>
            <p className="hero-insight-sub">Receitas: {formatCurrency(totalReceitas)} · Despesas: {formatCurrency(totalDespesas)}</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-2 w-2 rounded-full ${totalReceitas - totalDespesas >= 0 ? 'bg-emerald-300' : 'bg-rose-400'}`} />
            <span className="text-[10px] uppercase font-bold text-white/60">{totalReceitas - totalDespesas >= 0 ? "Resultado Positivo" : "Resultado Negativo"}</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: "Receita Total", value: totalReceitas, icon: TrendingUp, sub: `PF: ${formatCurrency(derived.totalReceitasPF)} · PJ: ${formatCurrency(derived.totalReceitasPJ)}` },
          { title: "Despesas Totais", value: totalDespesas, icon: TrendingDown, sub: `PF: ${formatCurrency(derived.totalDespesasPF)} · PJ: ${formatCurrency(derived.totalDespesasPJ)}` },
          { title: "Participação", value: totalParticipacao, icon: PieChart, sub: participacaoOk ? "Alocação 100%" : "Soma inválida", isPercent: true, warning: !participacaoOk },
          { title: "Maior Sócio", value: maxParticipacao, icon: UserCheck, sub: isEmpateMaiorParticipacao ? `${parceirosMaiorParticipacao.length} sócios iguais` : parceirosMaiorParticipacao[0]?.nome || "-", isPercent: true },
        ].map((c, i) => (
          <div key={c.title} className={`metric-pill animate-fade-in ${c.warning ? "!border-destructive/25 !bg-destructive/5" : ""}`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.warning ? "text-destructive/40" : "text-muted-foreground/40"}`} />
            </div>
            <span className={`metric-value ${c.warning ? "text-destructive" : ""}`}>
              {c.isPercent ? formatPercent(c.value) : <ExpandableValue>{formatCurrency(c.value)}</ExpandableValue>}
            </span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Funrural Config */}
      <Collapsible open={funruralOpen} onOpenChange={setFunruralOpen}>
        <div className="data-panel animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <CollapsibleTrigger asChild>
            <button className="w-full data-panel-header cursor-pointer hover:bg-muted/20 transition-colors">
              <h3 className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Configuração Funrural
              </h3>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", funruralOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* PJ */}
                <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-background/60">
                  <p className="text-sm font-bold text-foreground">Pessoa Jurídica (PJ)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="label-uppercase">Forma de Tributação</p>
                      <Select
                        value={state.funruralPJRegime}
                        onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PJ_REGIME", payload: value as "receita_bruta" | "folha" })}
                      >
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita_bruta">Receita Bruta</SelectItem>
                          <SelectItem value="folha">Folha</SelectItem>
                        </SelectContent>
                      </Select>
                      {state.funruralPJRegime === "folha" && state.folhaPagamentoPJ === 0 ? (
                        <div className="p-3 text-xs rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">Informe a folha:</span>{" "}
                          <span className="text-amber-600/80 dark:text-amber-500/80">Insira o valor da folha de pagamento anual PJ ao lado.</span>
                        </div>
                      ) : derived.sugestaoRegimeFunrural && (
                        <div className="p-3 text-xs rounded-xl border border-primary/20 bg-primary/5">
                          <span className="font-semibold text-primary">Sugestão:</span> <strong>{derived.sugestaoRegimeFunrural.regime === "folha" ? "Folha" : "Receita Bruta"}</strong> é <strong>{formatCurrency(derived.sugestaoRegimeFunrural.economia)}</strong> mais barata.
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="label-uppercase">Alíquota Funrural PJ</p>
                      <Select
                        open={aliquotaSelectOpen}
                        onOpenChange={(open) => { setAliquotaSelectOpen(open); if (open) setCustomAliquotaInput((state.funruralPJAliquota * 100).toFixed(2).replace(".", ",")); }}
                        value={isAliquotaCustom ? aliquotaCustomValue : String(state.funruralPJAliquota)}
                        onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PJ_ALIQUOTA", payload: Number(value) })}
                      >
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.0205">2,05%</SelectItem>
                          <SelectItem value="0.0223">2,23%</SelectItem>
                          {isAliquotaCustom && <SelectItem value={aliquotaCustomValue}>{funruralAliquotaLabel}</SelectItem>}
                          <div className="px-2 py-2 border-t border-border">
                            <p className="text-[10px] text-muted-foreground mb-1.5">Adicionar alíquota</p>
                            <div className="flex items-center gap-1.5">
                              <Input value={customAliquotaInput} onChange={(e) => setCustomAliquotaInput(e.target.value)} placeholder="Ex.: 2,30" className="h-7 text-xs rounded-lg" />
                              <Button type="button" size="sm" className="h-7 text-xs px-2 rounded-lg" onClick={() => { const parsed = parseAliquotaPercentInput(customAliquotaInput); if (parsed === null) return; dispatch({ type: "UPDATE_FUNRURAL_PJ_ALIQUOTA", payload: parsed }); setAliquotaSelectOpen(false); }}>OK</Button>
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="label-uppercase">Folha PJ (Anual)</p>
                      <EditableCell
                        value={state.folhaPagamentoPJ}
                        type="currency"
                        onSave={(v) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PJ", payload: Number(v) })}
                        className="text-sm font-bold"
                      />
                      {state.funruralPJRegime === "folha" && hasSuggestedFolha && (
                        <button className="text-[10px] text-primary hover:underline" onClick={() => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PJ", payload: suggestedFolhaPagamento })}>
                          Usar sugerido: {formatCurrency(suggestedFolhaPagamento)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* PF */}
                <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-background/60">
                  <p className="text-sm font-bold text-foreground">Pessoa Física (PF)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="label-uppercase">Forma de Tributação</p>
                      <Select value={state.funruralPFRegime} onValueChange={(value) => dispatch({ type: "UPDATE_FUNRURAL_PF_REGIME", payload: value as "receita_bruta" | "folha" })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita_bruta">Comercialização (1,50%)</SelectItem>
                          <SelectItem value="folha">Folha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="label-uppercase">Folha PF (Anual)</p>
                      <EditableCell value={state.folhaPagamentoPF} type="currency" onSave={(v) => dispatch({ type: "UPDATE_FOLHA_PAGAMENTO_PF", payload: Number(v) })} className="text-sm font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Parceiros Table */}
      <div className="data-panel animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
        <div className="data-panel-header">
          <h3 className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Quadro Societário</h3>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={addParceiro}>
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="data-panel-body p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.parceiros.map((p, i) => (
              <div key={p.id} className="rounded-2xl border border-border/50 bg-background/60 p-4 transition-all hover:border-primary/20 hover:shadow-soft animate-fade-in" style={{ animationDelay: `${(i + 5) * 60}ms`, animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                    {p.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <EditableCell value={p.nome} type="text" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, nome: String(v) } })} className="font-semibold text-sm" />
                    <EditableCell value={p.cpf} type="cpf" onSave={(v) => dispatch({ type: "UPDATE_PARCEIRO", payload: { ...p, cpf: String(v) } })} className="text-[11px] text-muted-foreground font-mono block" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/40 hover:text-destructive shrink-0" onClick={() => dispatch({ type: "DELETE_PARCEIRO", payload: p.id })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-muted-foreground">Participação</span>
                  <EditableCell value={p.participacao} type="percent" onSave={(v) => saveParticipacao(p, v)} className="text-sm font-bold" />
                </div>
                <Progress value={p.participacao} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prejuízo do Ano Anterior */}
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
    </div>
  );
}
