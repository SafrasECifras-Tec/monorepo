import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCalcir } from "@/contexts/CalcirContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatPercent } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, Sparkles, RotateCcw, Bot, TrendingUp,
  Calculator, Scale, Leaf, ArrowRight
} from "lucide-react";

// ── Build context string from CalcirContext ──

function buildClientContext(state: ReturnType<typeof useCalcir>["state"], derived: ReturnType<typeof useCalcir>["derived"]): string {
  const lines: string[] = [];

  lines.push("=== RESUMO FINANCEIRO ===");
  lines.push(`Receita Total: ${formatCurrency(derived.totalReceitasGeral)}`);
  lines.push(`  - Receitas PF: ${formatCurrency(derived.totalReceitasPF)}`);
  lines.push(`  - Receitas PJ: ${formatCurrency(derived.totalReceitasPJ)}`);
  lines.push(`  - Realizadas: ${formatCurrency(derived.receitasRealizadas)}`);
  lines.push(`  - Projetadas: ${formatCurrency(derived.receitasProjetadas)}`);
  lines.push(`Despesas Totais: ${formatCurrency(derived.totalDespesas)}`);
  lines.push(`  - Realizadas: ${formatCurrency(derived.totalDespesasRealizadas)}`);
  lines.push(`  - A Realizar: ${formatCurrency(derived.totalDespesasARealizar)}`);
  lines.push(`Resultado PF: ${formatCurrency(derived.resultadoPF)}`);
  lines.push(`Imobilizado Aquisição: ${formatCurrency(derived.totalImobilizadoAquisicao)}`);

  lines.push("\n=== PARCEIROS E PERCENTUAIS DA PARCERIA ===");
  if (state.parceiros.length === 0) {
    lines.push("Nenhum sócio cadastrado.");
  } else {
    state.parceiros.forEach((p) => {
      lines.push(`- ${p.nome} (CPF: ${p.cpf}): ${formatPercent(p.participacao)}%`);
    });
  }

  lines.push("\n=== IMPOSTOS PESSOA FÍSICA ===");
  lines.push(`IRPF (PF puro): ${formatCurrency(derived.irpfExclusivoPF)}`);
  lines.push(`Funrural PF: ${formatCurrency(derived.funruralPF)}`);
  lines.push(`Total Impostos PF: ${formatCurrency(derived.totalImpostosPFExclusivo)}`);

  lines.push("\n=== IMPOSTOS HOLDING (PJ) ===");
  const pj = derived.impostosPJ;
  lines.push(`IRPJ (15%): ${formatCurrency(pj.ir15)}`);
  lines.push(`IRPJ Adicional (10%): ${formatCurrency(pj.irAdicional10)}`);
  lines.push(`CSLL (9%): ${formatCurrency(pj.csll9)}`);
  lines.push(`PIS: ${formatCurrency(pj.pis)}`);
  lines.push(`COFINS: ${formatCurrency(pj.cofins)}`);
  lines.push(`Funrural PJ: ${formatCurrency(pj.funrural)}`);
  lines.push(`Total IRPF Sócios: ${formatCurrency(derived.totalIRPF)}`);

  const totalIRPFM = derived.irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
  lines.push(`Total IRPFM: ${formatCurrency(totalIRPFM)}`);
  lines.push(`Total Impostos Holding: ${formatCurrency(derived.totalImpostosHoldingCompleto)}`);

  lines.push("\n=== COMPARATIVO E ECONOMIA ===");
  lines.push(`Carga PF: ${formatCurrency(derived.economia.antes)}`);
  lines.push(`Carga Holding: ${formatCurrency(derived.economia.depois)}`);
  lines.push(`Economia: ${formatCurrency(derived.economia.economia)} (${formatPercent(derived.economia.percentual)})`);

  lines.push("\n=== CRÉDITOS IBS/CBS ===");
  lines.push(`Despesas c/ Crédito Cheio: ${formatCurrency(derived.totalDespesasCreditoCheia)}`);
  lines.push(`Despesas c/ Redução 60%: ${formatCurrency(derived.totalDespesasCreditoReducao60)}`);
  lines.push(`Despesas Sem Crédito: ${formatCurrency(derived.totalDespesasSemCredito)}`);

  if (derived.irpfmParceiros.length > 0) {
    lines.push("\n=== IRPFM POR SÓCIO ===");
    derived.irpfmParceiros.forEach((p) => {
      lines.push(`- ${p.parceiro}: base ${formatCurrency(p.baseIRPFM)}, aliq ${formatPercent(p.aliquota)}, devido ${formatCurrency(p.irpfmDevido)}`);
    });
  }

  if (derived.trimestresPJ.length > 0) {
    lines.push("\n=== APURAÇÃO TRIMESTRAL PJ ===");
    derived.trimestresPJ.forEach((t) => {
      lines.push(`Q${t.trimestre}: Faturamento ${formatCurrency(t.faturamento)}, IRPJ ${formatCurrency(t.ir15)}, CSLL ${formatCurrency(t.csll9)}`);
    });
  }

  lines.push(`\nRegime Funrural PJ: ${state.funruralPJRegime}`);
  lines.push(`Alíquota Funrural PJ: ${formatPercent(state.funruralPJAliquota * 100)}`);
  lines.push(`Folha de Pagamento PJ: ${formatCurrency(state.folhaPagamentoPJ)}`);
  lines.push(`Lucro Acumulado PJ: ${formatCurrency(state.lucroAcumuladoPJ)}`);

  if (state.receitasProjecoes.length > 0 || state.receitasRealizacoes.length > 0) {
    lines.push(`\n=== RECEITAS DETALHADAS ===`);
    lines.push(`Projeções: ${state.receitasProjecoes.length} itens`);
    state.receitasProjecoes.slice(0, 15).forEach((r) => {
      lines.push(`  - ${r.produto} (${r.entidade}, ${r.mes}): ${formatCurrency(r.total)}`);
    });
    if (state.receitasProjecoes.length > 15) lines.push(`  ... e mais ${state.receitasProjecoes.length - 15} itens`);

    lines.push(`Realizações: ${state.receitasRealizacoes.length} itens`);
    state.receitasRealizacoes.slice(0, 15).forEach((r) => {
      lines.push(`  - ${r.produto} (${r.entidade}, ${r.mes}): ${formatCurrency(r.total)}`);
    });
    if (state.receitasRealizacoes.length > 15) lines.push(`  ... e mais ${state.receitasRealizacoes.length - 15} itens`);
  }

  if (state.despesas.length > 0) {
    lines.push(`\n=== DESPESAS DETALHADAS ===`);
    lines.push(`${state.despesas.length} despesas cadastradas`);
    state.despesas.slice(0, 15).forEach((d) => {
      lines.push(`  - ${d.descricao}: ${formatCurrency(d.total)} (crédito: ${d.creditoIBSCBS || "sem_credito"})`);
    });
    if (state.despesas.length > 15) lines.push(`  ... e mais ${state.despesas.length - 15} itens`);
  }

  return lines.join("\n");
}

// ── Types ──

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ADVISOR_PHOTO = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face";

const SUGGESTIONS = [
  { text: "Qual a economia tributária com a Holding Rural?", icon: Leaf },
  { text: "Me explique a composição dos impostos PJ", icon: Calculator },
  { text: "Como está a distribuição de créditos IBS/CBS?", icon: Scale },
  { text: "Resuma a situação fiscal do cliente", icon: TrendingUp },
];

export default function Conselheiro() {
  const { state, derived } = useCalcir();
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    try {
      const context = buildClientContext(state, derived);
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("conselheiro-chat", {
        body: { messages: apiMessages, context },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "Não consegui processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Verifique sua conexão e tente novamente.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full" style={{ height: "calc(100vh - 3.5rem - 3rem)" }}>

      {/* ── Empty state ── */}
      {!hasMessages && (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 animate-fade-in overflow-y-auto">
          {/* Avatar + Greeting */}
          <div className="relative mb-6">
            <Avatar className="h-24 w-24 shadow-xl ring-4 ring-background">
              <AvatarImage src={ADVISOR_PHOTO} alt="Conselheiro" className="object-cover" />
              <AvatarFallback><Bot className="h-10 w-10" /></AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 border-[3px] border-background flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Conselheiro Tributário</h1>
          <p className="text-muted-foreground mt-2 text-center max-w-md leading-relaxed">
            Assistente inteligente com acesso total aos dados do planejamento.
            Pergunte sobre impostos, economia, simulações ou qualquer cálculo.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Receita: {formatCurrency(derived.totalReceitasGeral)}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
              <Calculator className="h-3 w-3" />
              Impostos: {formatCurrency(derived.totalImpostosHoldingCompleto)}
            </div>
            {derived.economia.economia > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-700 font-medium">
                <Leaf className="h-3 w-3" />
                Economia: {formatCurrency(derived.economia.economia)}
              </div>
            )}
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => sendMessage(s.text)}
                className="group flex items-start gap-3 text-left p-4 rounded-2xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug pt-1">
                  {s.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat messages ── */}
      {hasMessages && (
        <>
          {/* Top bar */}
          <div className="flex items-center justify-between pb-3 mb-1">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 shadow-sm">
                <AvatarImage src={ADVISOR_PHOTO} alt="Conselheiro" className="object-cover" />
                <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">Conselheiro</p>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  Online
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Nova conversa
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 -mr-1">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isLast = i === messages.length - 1;
              const showAvatar = !isUser && (i === 0 || messages[i - 1].role === "user");

              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} ${isLast ? "animate-fade-in" : ""}`}>
                  <div className={`flex gap-2.5 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                    {/* Avatar column */}
                    {!isUser && (
                      <div className="w-7 shrink-0 pt-1">
                        {showAvatar && (
                          <Avatar className="h-7 w-7 shadow-sm">
                            <AvatarImage src={ADVISOR_PHOTO} alt="Conselheiro" className="object-cover" />
                            <AvatarFallback><Bot className="h-3.5 w-3.5" /></AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`px-4 py-2.5 text-[13.5px] leading-[1.65] ${
                        isUser
                          ? "gradient-card text-primary-foreground rounded-2xl rounded-br-lg shadow-sm"
                          : "bg-muted/50 text-foreground rounded-2xl rounded-bl-lg"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none break-words [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>li]:my-0.5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                      <p className={`text-[10px] mt-1 text-right ${isUser ? "text-primary-foreground/40" : "text-muted-foreground/40"}`}>
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-2.5 max-w-[80%]">
                  <div className="w-7 shrink-0 pt-1">
                    <Avatar className="h-7 w-7 shadow-sm">
                      <AvatarImage src={ADVISOR_PHOTO} alt="Conselheiro" className="object-cover" />
                      <AvatarFallback><Bot className="h-3.5 w-3.5" /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-bl-lg px-4 py-3.5">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-2" />
          </div>
        </>
      )}

      {/* ── Input bar ── */}
      <div className="pt-3 mt-auto">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border/80 bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre os dados do cliente..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50 py-1.5 max-h-[120px] leading-relaxed"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-xl shrink-0 mb-0.5 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center pb-1">
          O Conselheiro utiliza IA generativa e pode cometer erros. Verifique as informações.
        </p>
      </div>
    </div>
  );
}
