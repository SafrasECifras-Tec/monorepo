import { useMemo, useState } from "react";
import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCalcir, type DespesaItem, type CreditoIBSCBS } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";
import { ShieldCheck, ShieldOff, ShieldAlert, ArrowUp, Info, CheckCircle2, CreditCard, AlertTriangle, TrendingUp, Fuel, Store } from "lucide-react";
import EditableCell from "@/components/EditableCell";
import CreditoCellIBSCBS from "@/components/CreditoCellIBSCBS";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TableSearchPagination from "@/components/TableSearchPagination";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";


const CREDITO_CONFIG: Record<CreditoIBSCBS, { label: string; short: string; color: string; icon: typeof ShieldCheck; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
  cheia: { label: "Crédito Cheio", short: "Cheio", color: "hsl(var(--primary))", icon: ShieldCheck, badgeVariant: "default" },
  reducao60: { label: "Redução 60%", short: "Red. 60%", color: "hsl(var(--destructive))", icon: ShieldAlert, badgeVariant: "secondary" },
  diesel: { label: "Diesel", short: "Diesel", color: "hsl(38 70% 50%)", icon: Fuel, badgeVariant: "secondary" },
  simples_nacional: { label: "Simples Nacional", short: "Simples", color: "hsl(262 52% 55%)", icon: Store, badgeVariant: "outline" },
  sem_credito: { label: "Sem Crédito", short: "Sem Créd.", color: "hsl(var(--muted-foreground))", icon: ShieldOff, badgeVariant: "outline" },
};

const PIE_COLORS = [
  "hsl(var(--primary))",       // cheia
  "hsl(var(--destructive))",   // reducao60
  "hsl(38 70% 50%)",           // diesel (amber)
  "hsl(262 52% 55%)",          // simples_nacional (purple)
  "hsl(var(--muted-foreground))", // sem_credito
];

const FATOR_ACUMULADO_26_33 = 0.39;

export default function GestaoCreditos() {
  const { state, derived, dispatch } = useCalcir();
  const { despesas } = state;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterCategoria, setFilterCategoria] = useState<CreditoIBSCBS | "todas">("todas");
  const [simularOtimizacao, setSimularOtimizacao] = useState(false);

  const totalDesp = derived.totalDespesas;
  const cheia = derived.totalDespesasCreditoCheia;
  const red60 = derived.totalDespesasCreditoReducao60;
  const sem = derived.totalDespesasSemCredito;
  const diesel = derived.totalDespesasDiesel;
  const simplesNac = derived.totalDespesasSimplesNacional;
  const countCheia = despesas.filter(d => d.creditoIBSCBS === "cheia").length;
  const countRed60 = despesas.filter(d => d.creditoIBSCBS === "reducao60").length;
  const countSem = despesas.filter(d => !d.creditoIBSCBS || d.creditoIBSCBS === "sem_credito").length;
  const countDiesel = despesas.filter(d => d.creditoIBSCBS === "diesel").length;
  const countSN = despesas.filter(d => d.creditoIBSCBS === "simples_nacional").length;

  const aliquotaRef = 10.8;

  const creditoDiesel = derived.totalCreditoDiesel;
  const creditoSN = derived.totalCreditoSimplesNacional;
  const recuperadoAtual = cheia * (aliquotaRef / 100) + red60 * (aliquotaRef / 100) * 0.6 + creditoDiesel + creditoSN;
  const perdidoAtual = sem * (aliquotaRef / 100);
  const perdaAcumuladaAtual = sem * FATOR_ACUMULADO_26_33;
  const recuperadoSimulado = (cheia + sem) * (aliquotaRef / 100) + red60 * (aliquotaRef / 100) * 0.6 + creditoDiesel + creditoSN;
  const ganhoRecuperacao = recuperadoSimulado - recuperadoAtual;

  const chartCheia = simularOtimizacao ? cheia + sem : cheia;
  const chartSem = simularOtimizacao ? 0 : sem;
  const countChartCheia = simularOtimizacao ? countCheia + countSem : countCheia;
  const countChartSem = simularOtimizacao ? 0 : countSem;

  const efetivoChartCheia = simularOtimizacao ? recuperadoSimulado - (red60 * (aliquotaRef / 100) * 0.6) - creditoDiesel - creditoSN : cheia * (aliquotaRef / 100);
  const efetivoChartRed60 = red60 * (aliquotaRef / 100) * 0.6;

  const filtered = useMemo(() => {
    let list = despesas;
    if (filterCategoria !== "todas") {
      if (filterCategoria === "sem_credito") {
        list = list.filter(d => !d.creditoIBSCBS || d.creditoIBSCBS === "sem_credito");
      } else {
        list = list.filter(d => d.creditoIBSCBS === filterCategoria);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.descricao.toLowerCase().includes(q) || d.obs.toLowerCase().includes(q));
    }
    return list;
  }, [despesas, filterCategoria, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateDespesa = (item: DespesaItem, field: keyof DespesaItem, value: any) => {
    const updated = { ...item, [field]: value };
    dispatch({ type: "UPDATE_DESPESA", payload: updated });
  };

  const pieData = useMemo(() => {
    return [
      { name: "Crédito Cheio", value: chartCheia, count: countChartCheia, color: PIE_COLORS[0] },
      { name: "Redução 60%", value: red60, count: countRed60, color: PIE_COLORS[1] },
      { name: "Diesel", value: diesel, count: countDiesel, color: PIE_COLORS[2] },
      { name: "Simples Nacional", value: simplesNac, count: countSN, color: PIE_COLORS[3] },
      { name: "Sem Crédito", value: chartSem, count: countChartSem, color: PIE_COLORS[4] },
    ].filter(d => d.value > 0);
  }, [chartCheia, red60, diesel, simplesNac, chartSem, countChartCheia, countRed60, countDiesel, countSN, countChartSem]);

  const barData = useMemo(() => [
    { name: "Crédito Cheio", despesa: chartCheia, credito: efetivoChartCheia, color: PIE_COLORS[0] },
    { name: "Redução 60%", despesa: red60, credito: efetivoChartRed60, color: PIE_COLORS[1] },
    { name: "Diesel", despesa: diesel, credito: creditoDiesel, color: PIE_COLORS[2] },
    { name: "Simples Nac.", despesa: simplesNac, credito: creditoSN, color: PIE_COLORS[3] },
    { name: "Sem Crédito", despesa: chartSem, credito: 0, color: PIE_COLORS[4] },
  ], [chartCheia, red60, diesel, simplesNac, chartSem, efetivoChartCheia, efetivoChartRed60, creditoDiesel, creditoSN]);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
        <div className="section-header mb-0">
          <div className="section-icon"><CreditCard /></div>
          <div>
            <h1>Gestão de Créditos</h1>
            <p>Classifique despesas e simule a formalização total para ver o impacto nos créditos IBS/CBS.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Categorias de Crédito IBS/CBS</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded-2xl border border-primary/20 p-3 bg-primary/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-bold text-primary">Crédito Cheio</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Insumos com crédito integral. Ex: sementes, fertilizantes, defensivos.</p>
                </div>
                <div className="rounded-2xl border border-destructive/20 p-3 bg-destructive/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive/70" />
                    <span className="text-[11px] font-bold text-destructive/80">Redução 60%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Crédito reduzido (60% da alíquota). Cesta básica agro com redução legal.</p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: "hsl(38 70% 50% / 0.3)", background: "hsl(38 70% 50% / 0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Fuel className="h-3.5 w-3.5" style={{ color: "hsl(38 70% 45%)" }} />
                    <span className="text-[11px] font-bold" style={{ color: "hsl(38 70% 40%)" }}>Diesel</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Crédito apurado por <strong>quantidade (litros)</strong> × alíquota R$/litro do IBS/CBS. Informe os litros na linha da despesa.</p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: "hsl(262 52% 55% / 0.3)", background: "hsl(262 52% 55% / 0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Store className="h-3.5 w-3.5" style={{ color: "hsl(262 52% 50%)" }} />
                    <span className="text-[11px] font-bold" style={{ color: "hsl(262 52% 45%)" }}>Simples Nacional</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Crédito proporcional ao IBS/CBS embutido no DAS do fornecedor. O <strong>% de crédito consta na NF</strong> emitida pelo fornecedor. Aplica-se a partir de 2027.</p>
                </div>
                <div className="rounded-2xl border border-border p-3 bg-muted/30 sm:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold">Sem Crédito</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Despesas sem nenhum crédito IBS/CBS. Ex: financeiras, pessoal, administrativas, fornecedores não contribuintes.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-3 shadow-soft">
            <Switch id="simular-otimizacao" checked={simularOtimizacao} onCheckedChange={setSimularOtimizacao} />
            <div className="flex flex-col">
              <Label htmlFor="simular-otimizacao" className="text-xs font-bold cursor-pointer">Simular Formalização (100% NF)</Label>
              <span className="text-[10px] text-muted-foreground">Transforma "Sem Crédito" em "Crédito Cheio"</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso alíquota diesel */}
      {countDiesel > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border p-3 animate-fade-in" style={{ borderColor: "hsl(38 70% 50% / 0.3)", background: "hsl(38 70% 50% / 0.06)" }}>
          <Fuel className="h-4 w-4 shrink-0" style={{ color: "hsl(38 70% 45%)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "hsl(38 70% 35%)" }}>Alíquota de IBS/CBS por litro (Diesel)</p>
            <p className="text-[10px] text-muted-foreground">Valor em R$/litro conforme publicação do Comitê Gestor do IBS. Zero = não publicado ainda.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">R$</span>
            <EditableCell
              value={state.aliquotaDieselPorLitro}
              type="number"
              onSave={(v) => dispatch({ type: "UPDATE_ALIQUOTA_DIESEL_POR_LITRO", payload: Number(v) })}
              showEditIcon
              className="text-sm font-bold"
            />
            <span className="text-xs text-muted-foreground">/L</span>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="metric-pill">
          <div className="flex items-center justify-between">
            <span className="metric-label">Crédito Recuperado (por ano)</span>
            <ShieldCheck className="h-3.5 w-3.5 text-primary/40" />
          </div>
          <span className="metric-value">{formatCurrency(simularOtimizacao ? recuperadoSimulado : recuperadoAtual)}</span>
          {simularOtimizacao ? (
            <span className="metric-sub !text-success flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />+{formatCurrency(ganhoRecuperacao)} extra
            </span>
          ) : (
            <span className="metric-sub">Alíquota cheia (10.8%)</span>
          )}
        </div>

        <div className={`metric-pill transition-all duration-300 ${!simularOtimizacao && perdidoAtual > 0 ? "!border-destructive/25 !bg-destructive/5" : ""}`}>
          <div className="flex items-center justify-between">
            <span className={`metric-label ${!simularOtimizacao && perdidoAtual > 0 ? "!text-destructive/65" : ""}`}>Sem Nota (Perda/Ano)</span>
            <ShieldOff className={`h-3.5 w-3.5 ${!simularOtimizacao && perdidoAtual > 0 ? "text-destructive/40" : "text-muted-foreground/40"}`} />
          </div>
          <span className={`metric-value ${simularOtimizacao ? "!text-muted-foreground opacity-50" : perdidoAtual > 0 ? "!text-destructive" : ""}`}>
            {simularOtimizacao ? "R$ 0,00" : formatCurrency(perdidoAtual)}
          </span>
          <span className="metric-sub">
            {simularOtimizacao ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> Perda eliminada</span> : "Sem nota, sem abatimento"}
          </span>
        </div>

        <div className={`metric-pill transition-all duration-500 ${simularOtimizacao ? "!border-primary/30 !bg-primary/5" : "!border-destructive/25 !bg-destructive/5"}`}>
          <div className="flex items-center justify-between">
            <span className={`metric-label ${simularOtimizacao ? "!text-primary" : "!text-destructive/65"}`}>{simularOtimizacao ? "Ganho Acumulado" : "Perda Acumulada"}</span>
            <AlertTriangle className={`h-3.5 w-3.5 ${simularOtimizacao ? "text-primary/40" : "text-destructive/40"}`} />
          </div>
          <span className={`metric-value ${simularOtimizacao ? "!text-primary" : "!text-destructive"}`}>{formatCurrency(perdaAcumuladaAtual)}</span>
          <span className={`metric-sub ${simularOtimizacao ? "!text-primary/60" : "!text-destructive/55"}`}>2026 a 2033</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="data-panel">
          <div className="data-panel-header !py-3">
            <h3 className="text-sm">Perfil das Despesas</h3>
            <span className="text-[10px] text-muted-foreground">{simularOtimizacao ? "Simulação 100% NF" : "Distribuição atual"}</span>
          </div>
          <div className="p-4">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-xl shadow-card p-2.5 text-xs">
                            <p className="font-medium text-foreground">{d.name}</p>
                            <p className="text-muted-foreground">{formatCurrency(d.value)} · {d.count} itens</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend formatter={(value) => <span className="text-[10px]">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">Nenhuma despesa</div>
            )}
          </div>
        </div>

        <div className="data-panel">
          <div className="data-panel-header !py-3">
            <h3 className="text-sm">Conversão em Créditos</h3>
            <span className="text-[10px] text-muted-foreground">Alíq. {aliquotaRef}% — {simularOtimizacao ? "simulada" : "atual"}</span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-xl shadow-card p-2.5 text-xs">
                          <p className="font-medium text-foreground mb-1">{label}</p>
                          {payload.map((p: any, i: number) => (
                            <p key={i} className="text-muted-foreground">{p.name}: {formatCurrency(p.value)}</p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} opacity={0.3} />
                <Bar dataKey="credito" name="Crédito" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="data-panel animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <div className="data-panel-header !py-3 flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 w-full">
            <div>
              <h3 className="text-sm">
                {filterCategoria === "todas" ? "Detalhamento das Despesas" : `Despesas — ${CREDITO_CONFIG[filterCategoria].label}`}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Classifique cada linha para ver o impacto.</p>
            </div>
            {filterCategoria !== "todas" && (
              <Badge variant="outline" className="cursor-pointer hover:bg-accent/20 px-2 py-1 text-[10px]" onClick={() => setFilterCategoria("todas")}>
                Limpar filtro ×
              </Badge>
            )}
          </div>
          <div className="w-full">
            <TableSearchPagination
              search={search}
              onSearchChange={setSearch}
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
        <div className="p-4">
          <div className="table-modern">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground text-xs py-2.5">Descrição</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs py-2.5">Obs</TableHead>
                  <TableHead className="text-right font-semibold text-foreground text-xs py-2.5">Total</TableHead>
                  <TableHead className="font-semibold text-foreground text-center w-[140px] text-xs py-2.5">Créd. IBS/CBS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-xs">
                      {despesas.length === 0 ? "Nenhuma despesa registrada" : "Nenhuma despesa encontrada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((d, i) => (
                    <TableRow key={d.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell className="font-medium text-xs py-2">{d.descricao}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate py-2">{d.obs}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-xs py-2">{formatCurrency(d.total)}</TableCell>
                      <TableCell className="text-center py-2">
                        <CreditoCellIBSCBS
                          creditoIBSCBS={d.creditoIBSCBS || "sem_credito"}
                          quantidadeLitros={d.quantidadeLitros ?? 0}
                          percentualCreditoSN={d.percentualCreditoSN ?? 0}
                          onChangeCreditoType={(v) => updateDespesa(d, "creditoIBSCBS", v)}
                          onChangeLitros={(v) => updateDespesa(d, "quantidadeLitros", v)}
                          onChangeSN={(v) => updateDespesa(d, "percentualCreditoSN", v)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

    </div>
  );
}
