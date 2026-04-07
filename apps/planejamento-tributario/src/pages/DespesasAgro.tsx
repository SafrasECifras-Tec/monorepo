import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toolbarGrid = (open: boolean): React.CSSProperties => ({
  display: "grid",
  gridTemplateRows: open ? "1fr" : "0fr",
  transition: "grid-template-rows 200ms cubic-bezier(0.32,0.72,0,1)",
});
const toolbarInner: React.CSSProperties = { minHeight: 0, overflow: "hidden" };
const toolbarVisible = (open: boolean): React.CSSProperties => ({
  paddingTop: "12px",
  opacity: open ? 1 : 0,
  transform: open ? "none" : "translateY(-5px)",
  transition: "opacity 150ms cubic-bezier(0.32,0.72,0,1), transform 150ms cubic-bezier(0.32,0.72,0,1)",
  pointerEvents: open ? undefined : "none",
  willChange: "opacity, transform",
});
import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useCalcir, type DespesaItem, type CreditoIBSCBS, type ImobilizadoAquisicao } from "@/contexts/CalcirContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { TrendingDown, CheckCircle, Clock, Package, Trash2, Pencil, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableCell from "@/components/EditableCell";
import CreditoCellIBSCBS from "@/components/CreditoCellIBSCBS";
import EditableSelect from "@/components/EditableSelect";
import TableSearchPagination from "@/components/TableSearchPagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const entidadeOptions = [{ label: "PJ", value: "PJ" }, { label: "PF", value: "PF" }];


export default function DespesasAgro() {
  const { state, derived, dispatch } = useCalcir();
  const { despesas, imobilizadoAquisicao } = state;

  // ── Despesas Operacionais ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!highlightedId) return;
    const t = window.setTimeout(() => setHighlightedId(null), 2200);
    return () => window.clearTimeout(t);
  }, [highlightedId]);
  useEffect(() => {
    if (!highlightedId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`row-${highlightedId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [highlightedId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { kind, id } = (e as CustomEvent).detail;
      if (kind !== "despesa-operacional") return;
      setPage(Math.max(1, Math.ceil((despesas.length + 1) / pageSize)));
      setHighlightedId(id);
    };
    window.addEventListener("plt-item-added", handler);
    return () => window.removeEventListener("plt-item-added", handler);
  }, [despesas.length, pageSize]);

  const filtered = useMemo(() => {
    if (!search.trim()) return despesas;
    const q = search.toLowerCase();
    return despesas.filter(d => d.descricao.toLowerCase().includes(q) || d.obs.toLowerCase().includes(q));
  }, [despesas, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setSelected(prev => {
      const dataIds = new Set(despesas.map(d => d.id));
      const cleaned = new Set([...prev].filter(id => dataIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [despesas]);

  const pageIds = paged.map(d => d.id);
  const filteredIds = filtered.map(d => d.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));

  const toggleRow = useCallback((id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);
  const togglePage = useCallback(() => {
    setSelected(prev => { const n = new Set(prev); if (allPageSelected) pageIds.forEach(id => n.delete(id)); else pageIds.forEach(id => n.add(id)); return n; });
  }, [allPageSelected, pageIds]);
  const selectAllFiltered = useCallback(() => setSelected(new Set(filteredIds)), [filteredIds]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const handleBulkDelete = () => { dispatch({ type: "BULK_DELETE_DESPESA", payload: [...selected] }); setSelected(new Set()); };
  const handleBulkUpdate = (fields: Partial<DespesaItem>) => dispatch({ type: "BULK_UPDATE_DESPESA", payload: { ids: [...selected], fields } });

  const updateDespesa = (item: DespesaItem, field: keyof DespesaItem, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === "realizado" || field === "aRealizar") updated.total = updated.realizado + updated.aRealizar;
    dispatch({ type: "UPDATE_DESPESA", payload: updated });
  };

  // ── Imobilizado Aquisição ─────────────────────────────────────────────────
  const [imSearch, setImSearch] = useState("");
  const [imPage, setImPage] = useState(1);
  const [imPageSize, setImPageSize] = useState(25);
  const [highlightedAquisicaoId, setHighlightedAquisicaoId] = useState<string | null>(null);
  const [imSelected, setImSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!highlightedAquisicaoId) return;
    const t = window.setTimeout(() => setHighlightedAquisicaoId(null), 2200);
    return () => window.clearTimeout(t);
  }, [highlightedAquisicaoId]);
  useEffect(() => {
    if (!highlightedAquisicaoId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`row-${highlightedAquisicaoId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [highlightedAquisicaoId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { kind, id } = (e as CustomEvent).detail;
      if (kind !== "despesa-imobilizado") return;
      setImPage(Math.max(1, Math.ceil((imobilizadoAquisicao.length + 1) / imPageSize)));
      setHighlightedAquisicaoId(id);
    };
    window.addEventListener("plt-item-added", handler);
    return () => window.removeEventListener("plt-item-added", handler);
  }, [imobilizadoAquisicao.length, imPageSize]);

  const imFiltered = useMemo(() => {
    if (!imSearch.trim()) return imobilizadoAquisicao;
    const q = imSearch.toLowerCase();
    return imobilizadoAquisicao.filter(im => im.descricao.toLowerCase().includes(q) || im.entidade.toLowerCase().includes(q));
  }, [imobilizadoAquisicao, imSearch]);

  const imTotalPages = Math.max(1, Math.ceil(imFiltered.length / imPageSize));
  const imPaged = imFiltered.slice((imPage - 1) * imPageSize, imPage * imPageSize);

  useEffect(() => {
    setImSelected(prev => {
      const dataIds = new Set(imobilizadoAquisicao.map(i => i.id));
      const cleaned = new Set([...prev].filter(id => dataIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [imobilizadoAquisicao]);

  const imPageIds = imPaged.map(im => im.id);
  const imFilteredIds = imFiltered.map(im => im.id);
  const imAllPageSelected = imPageIds.length > 0 && imPageIds.every(id => imSelected.has(id));
  const imSomePageSelected = imPageIds.some(id => imSelected.has(id));
  const imAllFilteredSelected = imFilteredIds.length > 0 && imFilteredIds.every(id => imSelected.has(id));

  const imToggleRow = useCallback((id: string) => {
    setImSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);
  const imTogglePage = useCallback(() => {
    setImSelected(prev => { const n = new Set(prev); if (imAllPageSelected) imPageIds.forEach(id => n.delete(id)); else imPageIds.forEach(id => n.add(id)); return n; });
  }, [imAllPageSelected, imPageIds]);
  const imSelectAllFiltered = useCallback(() => setImSelected(new Set(imFilteredIds)), [imFilteredIds]);
  const imClearSelection = useCallback(() => setImSelected(new Set()), []);
  const imHandleBulkDelete = () => { dispatch({ type: "BULK_DELETE_IMOBILIZADO_AQUISICAO", payload: [...imSelected] }); setImSelected(new Set()); };
  const imHandleBulkUpdate = (fields: Partial<ImobilizadoAquisicao>) => dispatch({ type: "BULK_UPDATE_IMOBILIZADO_AQUISICAO", payload: { ids: [...imSelected], fields } });

  const updateAquisicao = (item: ImobilizadoAquisicao, field: keyof ImobilizadoAquisicao, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === "realizado" || field === "aRealizar") {
      updated.total = updated.realizado + updated.aRealizar;
    }
    if (field === "total") {
      const totalValue = Number(value) || 0;
      const base = (Number(item.realizado) || 0) + (Number(item.aRealizar) || 0);
      if (base > 0) {
        const prop = (Number(item.realizado) || 0) / base;
        updated.realizado = Number((totalValue * prop).toFixed(2));
        updated.aRealizar = Number((totalValue - updated.realizado).toFixed(2));
      } else {
        updated.realizado = 0;
        updated.aRealizar = totalValue;
      }
      updated.total = totalValue;
    }
    dispatch({ type: "UPDATE_IMOBILIZADO_AQUISICAO", payload: updated });
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalDespesasOperacionaisRealizadas = despesas.reduce((s, d) => s + d.realizado, 0);
  const totalDespesasOperacionaisARealizar = despesas.reduce((s, d) => s + d.aRealizar, 0);
  const totalDespesasOperacionais = totalDespesasOperacionaisRealizadas + totalDespesasOperacionaisARealizar;
  const percExecutado = totalDespesasOperacionais > 0 ? (totalDespesasOperacionaisRealizadas / totalDespesasOperacionais) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div className="section-icon !bg-destructive/10 !text-destructive"><TrendingDown /></div>
        <div>
          <h1>Despesas Agro</h1>
          <p>Controle de despesas operacionais e aquisição de imobilizado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: "Total Despesas", value: derived.totalDespesas, icon: Receipt, negative: true, sub: `${despesas.length} despesas + ${imobilizadoAquisicao.length} aquisições` },
          { title: "Realizadas", value: totalDespesasOperacionaisRealizadas, icon: CheckCircle, negative: false, sub: `${formatPercent(percExecutado)} executado` },
          { title: "Projeção", value: totalDespesasOperacionaisARealizar, icon: Clock, negative: false, sub: `${formatPercent(100 - percExecutado)} pendente` },
          { title: "Imobilizado", value: derived.totalImobilizadoAquisicao, icon: Package, negative: false, sub: `${imobilizadoAquisicao.length} aquisições` },
        ].map((c, i) => (
          <div key={c.title} className="animate-fade-in metric-pill" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.negative ? "text-destructive/50" : "text-muted-foreground/50"}`} />
            </div>
            <span className={`metric-value ${c.negative ? "text-destructive" : ""}`}><ExpandableValue>{formatCurrency(c.value)}</ExpandableValue></span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Despesas Operacionais ── */}
      <Card className="animate-fade-in rounded-2xl border-border/60" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
        <CardHeader className="flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Despesas Operacionais</CardTitle>
          </div>
          <div className="mt-3">
            <TableSearchPagination search={search} onSearchChange={setSearch} page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
          <div style={toolbarGrid(selected.size > 0)}>
            <div style={toolbarInner}>
              <div style={toolbarVisible(selected.size > 0)}>
                <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-2xl px-3 py-2">
                  <span className="text-xs font-semibold">{selected.size} selecionado{selected.size > 1 ? "s" : ""}</span>
                  {!allFilteredSelected && filtered.length > selected.size && (
                    <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={selectAllFiltered}>Selecionar todos ({filtered.length})</Button>
                  )}
                  <div className="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Pencil className="h-3 w-3" /> Créd. IBS/CBS</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkUpdate({ creditoIBSCBS: "cheia" })}>Crédito Cheio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate({ creditoIBSCBS: "reducao60" })}>Redução 60%</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate({ creditoIBSCBS: "diesel" })}>Diesel</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate({ creditoIBSCBS: "simples_nacional" })}>Simples Nacional</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate({ creditoIBSCBS: "sem_credito" })}>Sem Crédito</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Trash2 className="h-3 w-3" /> Excluir ({selected.size})</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {selected.size} despesa{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-modern">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10 px-2">
                    <Checkbox checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false} onCheckedChange={togglePage} />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Descrição</TableHead>
                  <TableHead className="font-semibold text-foreground">Observações</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Entidade</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Realizado</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Projeção</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Total 2026</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Total Ano Anterior</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Estoque</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Créd. IBS/CBS</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((d, i) => (
                  <TableRow
                    id={`row-${d.id}`}
                    key={d.id}
                    className={`transition-colors duration-700 ${
                      highlightedId === d.id ? "bg-primary/15"
                      : selected.has(d.id) ? "bg-primary/8"
                      : i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <TableCell className="px-2"><Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleRow(d.id)} /></TableCell>
                    <TableCell><EditableCell value={d.descricao} type="text" onSave={(v) => updateDespesa(d, "descricao", v)} className="block w-full min-h-8 px-2" /></TableCell>
                    <TableCell><EditableCell value={d.obs} type="text" onSave={(v) => updateDespesa(d, "obs", v)} className="text-muted-foreground block w-full min-h-8 px-2" /></TableCell>
                    <TableCell className="text-center">
                      <EditableSelect value={d.entidade || "PF"} options={[{ value: "PF", label: "PF" }, { value: "PJ", label: "PJ" }]} onSave={(v) => updateDespesa(d, "entidade", v as "PF" | "PJ")} variant="badge" badgeVariant={d.entidade === "PF" ? "outline" : "default"} />
                    </TableCell>
                    <TableCell className="text-right"><EditableCell value={d.realizado} type="currency" onSave={(v) => updateDespesa(d, "realizado", v)} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={d.aRealizar} type="currency" onSave={(v) => updateDespesa(d, "aRealizar", v)} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={d.total} type="currency" onSave={(v) => updateDespesa(d, "total", v)} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={d.totalAnoAnterior || 0} type="currency" onSave={(v) => updateDespesa(d, "totalAnoAnterior", Number(v))} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={d.estoque ?? 0} type="number" onSave={(v) => updateDespesa(d, "estoque", Number(v))} /></TableCell>
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
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => dispatch({ type: "DELETE_DESPESA", payload: d.id })}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/5 border-t-2 border-primary/20 hover:bg-primary/10">
                  <TableCell />
                  <TableCell className="font-bold" colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{formatCurrency(totalDespesasOperacionaisRealizadas)}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{formatCurrency(totalDespesasOperacionaisARealizar)}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold text-lg">{formatCurrency(totalDespesasOperacionais)}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{formatCurrency(despesas.reduce((s, d) => s + (d.totalAnoAnterior || 0), 0))}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{(despesas.reduce((s, d) => s + (d.estoque ?? 0), 0)).toLocaleString("pt-BR")}</TableCell>
                  <TableCell /><TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Investimentos / Imobilizado ── */}
      <Card className="animate-fade-in rounded-2xl border-border/60" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
        <CardHeader className="flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" /> Investimentos / Compra de Imobilizado
            </CardTitle>
          </div>
          <div className="mt-3">
            <TableSearchPagination search={imSearch} onSearchChange={setImSearch} page={imPage} totalPages={imTotalPages} totalItems={imFiltered.length} onPageChange={setImPage} pageSize={imPageSize} onPageSizeChange={setImPageSize} />
          </div>
          <div style={toolbarGrid(imSelected.size > 0)}>
            <div style={toolbarInner}>
              <div style={toolbarVisible(imSelected.size > 0)}>
                <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-2xl px-3 py-2">
                  <span className="text-xs font-semibold">{imSelected.size} selecionado{imSelected.size > 1 ? "s" : ""}</span>
                  {!imAllFilteredSelected && imFiltered.length > imSelected.size && (
                    <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={imSelectAllFiltered}>Selecionar todos ({imFiltered.length})</Button>
                  )}
                  <div className="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Pencil className="h-3 w-3" /> Entidade</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => imHandleBulkUpdate({ entidade: "PJ" })}>Entidade → PJ</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => imHandleBulkUpdate({ entidade: "PF" })}>Entidade → PF</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Trash2 className="h-3 w-3" /> Excluir ({imSelected.size})</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {imSelected.size} investimento{imSelected.size > 1 ? "s" : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={imHandleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={imClearSelection}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-modern">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10 px-2">
                    <Checkbox checked={imAllPageSelected ? true : imSomePageSelected ? "indeterminate" : false} onCheckedChange={imTogglePage} />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Descrição</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Entidade</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Realizado</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">A Realizar</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Total</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {imPaged.map((im, i) => (
                  <TableRow
                    id={`row-${im.id}`}
                    key={im.id}
                    className={`transition-colors duration-700 ${
                      highlightedAquisicaoId === im.id ? "bg-primary/15"
                      : imSelected.has(im.id) ? "bg-primary/8"
                      : i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <TableCell className="px-2"><Checkbox checked={imSelected.has(im.id)} onCheckedChange={() => imToggleRow(im.id)} /></TableCell>
                    <TableCell><EditableCell value={im.descricao} type="text" onSave={(v) => updateAquisicao(im, "descricao", v)} className="block w-full min-h-8 px-2" /></TableCell>
                    <TableCell className="text-center">
                      <EditableSelect value={im.entidade} options={entidadeOptions} onSave={(v) => updateAquisicao(im, "entidade", v)} variant="badge" badgeVariant={im.entidade === "PJ" ? "default" : "secondary"} />
                    </TableCell>
                    <TableCell className="text-right"><EditableCell value={im.realizado} type="currency" onSave={(v) => updateAquisicao(im, "realizado", Number(v))} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={im.aRealizar} type="currency" onSave={(v) => updateAquisicao(im, "aRealizar", Number(v))} /></TableCell>
                    <TableCell className="text-right"><EditableCell value={im.total} type="currency" onSave={(v) => updateAquisicao(im, "total", Number(v))} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => dispatch({ type: "DELETE_IMOBILIZADO_AQUISICAO", payload: im.id })}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/5 border-t-2 border-primary/20 hover:bg-primary/10">
                  <TableCell />
                  <TableCell className="font-bold" colSpan={4}>TOTAL</TableCell>
                  <TableCell className="text-right tabular-nums font-bold text-lg">{formatCurrency(imobilizadoAquisicao.reduce((s, im) => s + im.total, 0))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
