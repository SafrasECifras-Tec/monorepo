import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";
import { Tractor, Building2, PiggyBank, TrendingUp, CheckCircle2, SlidersHorizontal, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import EditableCell from "@/components/EditableCell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ConfigPanel from "@/components/ConfigPanel";
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, ResponsiveContainer, Line } from "recharts";

const TRANSICAO: Record<number, { cbs: number; ibs: number; total: number }> = {
  2025: { cbs: 0, ibs: 0, total: 0 },
  2026: { cbs: 0.4, ibs: 0, total: 0.4 },
  2027: { cbs: 1.7, ibs: 1.7, total: 3.4 },
  2028: { cbs: 1.7, ibs: 1.7, total: 3.4 },
  2029: { cbs: 2.07, ibs: 2.07, total: 4.14 },
  2030: { cbs: 2.44, ibs: 2.44, total: 4.88 },
  2031: { cbs: 2.81, ibs: 2.81, total: 5.62 },
  2032: { cbs: 3.18, ibs: 3.18, total: 6.36 },
  2033: { cbs: 5.4, ibs: 5.4, total: 10.8 },
};

const anosDisponiveis = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

export default function SimulacaoIBSCBS() {
  const { derived } = useCalcir();
  const [anoSelecionado, setAnoSelecionado] = useState(2027);
  const [aliquotaBase, setAliquotaBase] = useState(27);
  const [pfContribuinte, setPfContribuinte] = useState(false);
  const [simularFornecedoresContribuintes, setSimularFornecedoresContribuintes] = useState(false);
  const reducaoAgro = 60;

  const transicao = TRANSICAO[anoSelecionado] || TRANSICAO[2033];
  const aliquotaEfetivaTotal = aliquotaBase * (1 - reducaoAgro / 100) * (transicao.total / 10.8);
  const aliquotaCheia = aliquotaBase * (1 - reducaoAgro / 100);
  const aliquotaUsada = aliquotaEfetivaTotal;

  const extraCreditoFornecedores = simularFornecedoresContribuintes ? derived.totalDespesasSemCredito * (aliquotaUsada / 100) * 0.6 : 0;

  const pfDebitos = derived.totalReceitasGeral * (aliquotaUsada / 100);
  const pfCreditosCheia = pfContribuinte ? derived.totalDespesasCreditoCheia * (aliquotaUsada / 100) : 0;
  const pfCreditosReducao = pfContribuinte ? derived.totalDespesasCreditoReducao60 * (aliquotaUsada / 100) * 0.6 : 0;
  const pfCreditosDiesel = pfContribuinte ? derived.totalCreditoDiesel : 0;
  const pfCreditosSN = pfContribuinte ? derived.totalCreditoSimplesNacional : 0;
  const pfExtraCredito = pfContribuinte ? extraCreditoFornecedores : 0;
  const pfCreditos = pfCreditosCheia + pfCreditosReducao + pfCreditosDiesel + pfCreditosSN + pfExtraCredito;
  const pfSaldo = Math.max(0, pfDebitos - pfCreditos);
  const pfSaldoOriginal = Math.max(0, pfDebitos);

  const pjDebitos = derived.totalReceitasPJ * (aliquotaUsada / 100);
  const pjCreditosCheia = derived.totalDespesasCreditoCheia * (aliquotaUsada / 100);
  const pjCreditosReducao = derived.totalDespesasCreditoReducao60 * (aliquotaUsada / 100) * 0.6;
  const pjCreditos = pjCreditosCheia + pjCreditosReducao + derived.totalCreditoDiesel + derived.totalCreditoSimplesNacional + extraCreditoFornecedores;
  const pjSaldo = Math.max(0, pjDebitos - pjCreditos);
  const parceriaPFDebitos = derived.totalReceitasPF * (aliquotaUsada / 100);
  const parceriaPFSaldo = Math.max(0, parceriaPFDebitos);
  const parceriaTotal = pjSaldo + parceriaPFSaldo;

  const economiaAcumulada = useMemo(() => {
    let totalEconomia = 0;
    for (let ano = 2026; ano <= 2033; ano++) {
      const t = TRANSICAO[ano];
      const alq = aliquotaBase * (1 - reducaoAgro / 100) * (t.total / 10.8);
      const pfDebOriginal = derived.totalReceitasGeral * (alq / 100);
      const pfSalOriginal = Math.max(0, pfDebOriginal);
      const pjDeb = derived.totalReceitasPJ * (alq / 100);
      const pjCred = (derived.totalDespesasCreditoCheia * (alq / 100)) +
                     (derived.totalDespesasCreditoReducao60 * (alq / 100) * 0.6) +
                     derived.totalCreditoDiesel +
                     derived.totalCreditoSimplesNacional +
                     (simularFornecedoresContribuintes ? derived.totalDespesasSemCredito * (alq / 100) * 0.6 : 0);
      const pjSal = Math.max(0, pjDeb - pjCred);
      const parcPFDeb = derived.totalReceitasPF * (alq / 100);
      const parcPFSal = Math.max(0, parcPFDeb);
      const parcTotal = pjSal + parcPFSal;
      totalEconomia += (pfSalOriginal - parcTotal);
    }
    return Math.abs(totalEconomia) < 0.01 ? 0 : totalEconomia;
  }, [aliquotaBase, reducaoAgro, derived, simularFornecedoresContribuintes]);

  let vantagemParceria = pfSaldoOriginal - parceriaTotal;
  if (Math.abs(vantagemParceria) < 0.01) vantagemParceria = 0;

  const chartData = useMemo(() => anosDisponiveis.map(ano => {
    const t = TRANSICAO[ano];
    const efTotal = aliquotaBase * (1 - reducaoAgro / 100) * (t.total / 10.8);
    return {
      ano: ano === 2025 ? "Até 2025" : String(ano),
      "Alíquota Efetiva": +(efTotal).toFixed(2),
    };
  }), [aliquotaBase, reducaoAgro]);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="section-header animate-fade-in">
        <div className="section-icon"><Scale /></div>
        <div>
          <h1>Impacto da Reforma Tributária</h1>
          <p>Compare sua situação atual como PF com as vantagens da Parceria (Holding) no IBS/CBS.</p>
        </div>
      </div>

      {/* Timeline + Aliquota */}
      <div className="data-panel animate-fade-in">
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ArrowRight className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Linha do Tempo da Reforma</h3>
                <p className="text-[11px] text-muted-foreground">Selecione o ano para ver o impacto.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 pl-3 pr-1 py-1.5 rounded-2xl border border-border/50 self-start sm:self-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Alíquota Base:</span>
              <div className="flex items-center bg-background rounded-xl border border-border/60 px-2 py-1">
                <EditableCell value={aliquotaBase} type="number" onSave={(v) => setAliquotaBase(Number(v))} className="font-bold text-foreground text-sm w-8 text-center" />
                <span className="text-xs text-muted-foreground ml-0.5">%</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <div className="grid grid-cols-9 gap-2 min-w-[520px]">
              {anosDisponiveis.map((ano) => {
                const t = TRANSICAO[ano];
                const isSelected = anoSelecionado === ano;
                return (
                  <button
                    key={ano}
                    onClick={() => setAnoSelecionado(ano)}
                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 border ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-soft ring-1 ring-primary/20"
                        : "border-border/40 bg-muted/20 hover:bg-muted/50 hover:border-primary/30"
                    }`}
                  >
                    <span className={`font-bold leading-none ${isSelected ? "text-primary text-sm" : "text-foreground text-xs"}`}>
                      {ano === 2025 ? "Hoje" : ano}
                    </span>
                    <span className={`text-[10px] mt-1 leading-none ${isSelected ? "text-primary/80 font-medium" : "text-muted-foreground"}`}>
                      {t.total.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* PF Pura */}
        <div className="data-panel flex flex-col">
          <div className="data-panel-header !py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center border border-border/50">
                <Tractor className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm">Pessoa Física</h3>
                <p className="text-[10px] text-muted-foreground">Como você atua hoje</p>
              </div>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <p className="label-uppercase mb-1">Imposto IBS/CBS em {anoSelecionado}</p>
            <p className="text-2xl font-black text-destructive tracking-tight">{formatCurrency(pfSaldo)}</p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Débitos sobre Vendas:</span>
                <span className="font-medium tabular-nums">{formatCurrency(pfDebitos)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Créditos de Insumos:</span>
                <span className="font-medium text-success tabular-nums">–{formatCurrency(pfCreditos)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parceria */}
        <div className="data-panel flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -z-10" />
          <div className="data-panel-header !py-3 !border-primary/10 !bg-primary/[0.03]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm">Parceria (Holding)</h3>
                <p className="text-[10px] text-muted-foreground">Estrutura sugerida</p>
              </div>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <p className="label-uppercase mb-1">Imposto IBS/CBS em {anoSelecionado}</p>
            <p className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(parceriaTotal)}</p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Débitos (PJ + PF):</span>
                <span className="font-medium tabular-nums">{formatCurrency(pjDebitos + parceriaPFDebitos)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Créditos de Insumos:</span>
                <span className="font-medium text-success tabular-nums">–{formatCurrency(pjCreditos)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vantagem */}
        <div className={`rounded-2xl border-2 shadow-card flex flex-col text-white overflow-hidden ${
          vantagemParceria > 0 ? "bg-gradient-to-br from-primary to-primary/80 border-primary/60"
            : vantagemParceria < 0 ? "bg-gradient-to-br from-destructive to-destructive/80 border-destructive/60"
            : "bg-gradient-to-br from-muted-foreground to-muted-foreground/80 border-muted-foreground/60"
        }`}>
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-5 w-5" />
              <div>
                <h3 className="text-sm font-bold">Sua Vantagem</h3>
                <p className="text-[10px] text-white/70">Economia da Parceria vs PF sem créditos</p>
              </div>
            </div>
            <p className="label-uppercase !text-white/60 mb-1">Economia em {anoSelecionado}</p>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(vantagemParceria)}</p>
            <p className="text-[11px] mt-1.5 text-white/80">
              {vantagemParceria > 0 ? "A Parceria reduz o seu imposto neste ano." : vantagemParceria < 0 ? "A Parceria é mais cara neste ano." : "Impacto equivalente neste ano."}
            </p>
            <div className="mt-auto bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <p className="label-uppercase !text-white/60 mb-0.5">Economia Acumulada (2026–2033)</p>
              <p className="text-lg font-bold">{formatCurrency(economiaAcumulada)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation toggles */}
      <ConfigPanel
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="Simule Cenários para Reduzir seu Imposto"
        summary={`${pfContribuinte ? "PF Contribuinte" : "PF não contribuinte"} · ${simularFornecedoresContribuintes ? "NF exigida" : "Sem exigência NF"}`}
        defaultOpen
      >
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/40">
            <Switch id="pf-contribuinte" checked={pfContribuinte} onCheckedChange={setPfContribuinte} className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="pf-contribuinte" className="text-xs font-bold cursor-pointer block mb-0.5">PF como Contribuinte</Label>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Transforma a PF em contribuinte do IBS/CBS, ganhando direito a <strong>créditos</strong>.
              </p>
              <Badge variant={pfContribuinte ? "default" : "outline"} className="mt-2 text-[9px]">
                {pfContribuinte ? "Toma Créditos" : "Não Toma Créditos"}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/40">
            <Switch id="simular-fornecedores" checked={simularFornecedoresContribuintes} onCheckedChange={setSimularFornecedoresContribuintes} className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="simular-fornecedores" className="text-xs font-bold cursor-pointer block mb-0.5">Organizar Compras (Exigir NF)</Label>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Comprar de contribuintes transforma "Sem Crédito" em <strong>60% de crédito</strong>.
              </p>
              {simularFornecedoresContribuintes && (
                <p className="mt-1.5 text-[10px] font-medium text-success flex items-center gap-1 bg-success/10 w-fit px-2 py-0.5 rounded-lg">
                  <CheckCircle2 className="h-2.5 w-2.5" /> + {formatCurrency(extraCreditoFornecedores)}
                </p>
              )}
            </div>
          </div>
        </div>
      </ConfigPanel>

      {/* Chart */}
      <div className="data-panel animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="data-panel-header !py-3">
          <h3 className="text-sm">Projeção da Alíquota Efetiva até 2033</h3>
        </div>
        <div className="p-4">
          <p className="text-[11px] text-muted-foreground mb-3">
            Alíquota cheia: {aliquotaCheia.toFixed(2)}% (redução de {reducaoAgro}%). Cobrança progressiva por ano.
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="ano"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  dy={5}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v}%`}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-xl shadow-card p-2.5 text-xs">
                          <p className="text-muted-foreground mb-0.5 font-medium">{label}</p>
                          <p className="font-bold text-foreground">
                            Alíquota: {Number(payload[0].value).toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Alíquota Efetiva"
                  fill="hsl(38 70% 50%)"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                  activeBar={{ fill: "hsl(38 70% 42%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="Alíquota Efetiva"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--foreground))", stroke: "white", strokeWidth: 1.5 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--foreground))" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
