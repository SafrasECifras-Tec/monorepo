import ExpandableValue from "@/components/ExpandableValue";
import { useCalcir } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ShieldCheck, Info, AlertCircle, CheckCircle, Banknote, RefreshCw, SlidersHorizontal } from "lucide-react";
import EditableCell from "@/components/EditableCell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ConfigPanel from "@/components/ConfigPanel";

export default function SimulacaoIRPFM() {
  const { state, derived, dispatch } = useCalcir();
  const { irpfmParceiros } = derived;

  const totalDevido = irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
  const totalRestituir = irpfmParceiros.reduce((s, p) => s + p.irRestituir, 0);
  const totalBase = irpfmParceiros.reduce((s, p) => s + p.baseIRPFM, 0);
  const totalRetido = irpfmParceiros.reduce((s, p) => s + p.irPagoRetido, 0);
  const totalLucrosIsentos = irpfmParceiros.reduce((s, p) => s + p.lucrosIsentos, 0);
  const lcdprObrigatorio = !state.contabilidadeRegular && derived.totalReceitasPF > state.lcdprLimite;

  return (
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon"><ShieldCheck /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1>Simulação IRPFM</h1>
            <Dialog>
              <DialogTrigger asChild>
                <button className="h-7 w-7 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4 text-primary" />
                    Fórmula da Alíquota (Rampa)
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Fórmula contínua entre R$ 600k e R$ 1,2M — sobre Renda Global menos Lucros Isentos
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-success/80">Até R$ 600k</p>
                      <p className="text-2xl font-black text-success mt-1">0%</p>
                      <p className="text-[10px] text-success/70 mt-0.5">Isento</p>
                    </div>
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/4 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/65">600k – 1,2M</p>
                      <p className="text-2xl font-black text-destructive/80 mt-1">0% → 10%</p>
                      <p className="text-[10px] text-destructive/55 mt-0.5">Rampa</p>
                    </div>
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/80">Acima 1,2M</p>
                      <p className="text-2xl font-black text-destructive mt-1">10%</p>
                      <p className="text-[10px] text-destructive/70 mt-0.5">Teto</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A alíquota mínima (Lei 15.270/2025) incide progressivamente sobre rendas globais acima de R$ 600.000. 
                    O imposto devido é o <strong>maior</strong> entre a tabela progressiva tradicional e a rampa do IRPFM.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p>Lei 15.270/2025 — Alíquota Mínima para rendas acima de R$ 600.000</p>
        </div>
      </div>

      {/* Config panel — starts collapsed */}
      <ConfigPanel
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="Parâmetros de Simulação"
        summary={`Contab. ${state.contabilidadeRegular ? "Regular" : "Irregular"} · LCDPR ${formatCurrency(state.lcdprLimite)}${lcdprObrigatorio ? " · ⚠ Obrigatório" : ""}`}
      >
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Switch checked={state.contabilidadeRegular} onCheckedChange={(value) => dispatch({ type: "UPDATE_CONTABILIDADE_REGULAR", payload: value })} id="contabilidade-regular" />
            <Label htmlFor="contabilidade-regular" className="text-sm cursor-pointer font-medium">Contabilidade regular</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Limite LCDPR</span>
            <EditableCell value={state.lcdprLimite} type="currency" onSave={(v) => dispatch({ type: "UPDATE_LCDPR_LIMITE", payload: Number(v) })} className="text-sm font-semibold max-w-[140px]" />
          </div>
          {lcdprObrigatorio && (
            <span className="stat-chip-warning"><AlertCircle className="h-3 w-3" /> LCDPR obrigatório</span>
          )}
        </div>
      </ConfigPanel>

      {/* KPIs */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${totalRestituir > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {[
          { title: "Base Total IRPFM", value: totalBase, icon: ShieldCheck, sub: `${irpfmParceiros.length} parceiros` },
          { title: "Lucros Isentos", value: totalLucrosIsentos, icon: Banknote, sub: "Acumulados até 2024" },
          { title: "Retenções", value: totalRetido, icon: CheckCircle, sub: "IRRF + 10% dividendos" },
          { title: "Imposto a Recolher", value: totalDevido, icon: AlertCircle, sub: "Maior entre Tabela e Rampa", accent: true },
        ].map((c, i) => (
          <div key={c.title} className={`animate-fade-in ${c.accent ? "metric-pill-accent" : "metric-pill"}`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-3.5 w-3.5 ${c.accent ? "text-white/50" : "text-muted-foreground/40"}`} />
            </div>
            <span className="metric-value">{formatCurrency(c.value)}</span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
        {totalRestituir > 0 && (
          <div className="metric-pill animate-fade-in !border-success/30" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label !text-success">IR a Restituir</span>
              <RefreshCw className="h-3.5 w-3.5 text-success/50" />
            </div>
            <span className="metric-value !text-success">{formatCurrency(totalRestituir)}</span>
            <span className="metric-sub">Retenções excedem imposto</span>
          </div>
        )}
      </div>

      {/* Partner Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Apuração por Parceiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {irpfmParceiros.map((p, i) => (
            <div key={p.parceiroId} className="data-panel animate-fade-in" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: "both" }}>
              <div className="data-panel-header !py-3">
                <h3>{p.parceiro}</h3>
                <span className="stat-chip text-[9px] bg-primary/10 text-primary border-primary/20">{p.regraVencedora === "tabela_progressiva" ? "Tab. Progressiva" : "Rampa IRPFM"}</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <div className="flex items-center gap-1">
                      <p className="label-uppercase">Renda Global</p>
                      <Tooltip><TooltipTrigger asChild><Info className="h-2.5 w-2.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent className="text-[11px]">Base Rural + Dividendos PJ + Rendimentos Particulares.</TooltipContent></Tooltip>
                    </div>
                    <p className="text-xs font-bold mt-1">{formatCurrency(p.baseIRPFM)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <p className="label-uppercase">Alíquota</p>
                    <p className="text-xs font-bold mt-1">{formatPercent(p.aliquota)}</p>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  {[
                    { label: "Lucros Isentos", value: state.lucrosIsentosAcumulados[p.parceiroId] || 0, editable: true, color: "text-primary" },
                    ...(p.lucrosIsentos > 0 ? [{ label: "Base Líquida", value: p.rendaGlobalLiquida }] : []),
                    { label: "Imp. Mínimo (rampa)", value: p.impostoBruto },
                    { label: "Imp. Tab. Progressiva", value: p.impostoTabelaProgressiva },
                    { label: "(-) Ret. 10% Dividendos", value: p.retencaoDividendos10, color: "text-success" },
                    { label: "(-) IRRF Particulares", value: p.irrfParticulares, color: "text-success" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                      <span className="text-[11px] text-muted-foreground">{item.label}</span>
                      {item.editable ? (
                        <EditableCell
                          value={item.value}
                          type="currency"
                          onSave={(v) => dispatch({ type: "UPDATE_LUCROS_ISENTOS", payload: { parceiroId: p.parceiroId, valor: Number(v) } })}
                          className={`text-xs font-medium ${item.color || ""} max-w-[100px]`}
                        />
                      ) : (
                        <span className={`text-xs font-medium tabular-nums ${item.color || ""}`}>{formatCurrency(item.value)}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-primary/15">
                  <span className="text-[11px] font-bold">Imposto a Recolher</span>
                  <span className={`text-base font-bold ${p.irpfmDevido > 0 ? "text-destructive" : "text-muted-foreground"}`}>{formatCurrency(p.irpfmDevido)}</span>
                </div>
                {p.irRestituir > 0 && (
                  <div className="flex justify-between items-center pt-1.5 rounded-xl bg-success/5 border border-success/20 px-3 py-2">
                    <span className="text-[11px] font-bold text-success flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5" /> Restituir</span>
                    <span className="text-base font-bold text-success">{formatCurrency(p.irRestituir)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
