import { useEffect, useMemo, useState, useCallback } from "react";
import ExpandableValue from "@/components/ExpandableValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useCalcir, type ReceitaItem, type VendaImobilizado } from "@/contexts/CalcirContext";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, BarChart3, CheckCircle, Truck, Plus, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableCell from "@/components/EditableCell";
import EditableSelect from "@/components/EditableSelect";
import ProductCombobox from "@/components/ProductCombobox";
import TableSearchPagination from "@/components/TableSearchPagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MESES } from "@/lib/calcirEngine";

// grid-template-rows: 0fr→1fr is a pure CSS transition (no JS rAF) so it never drops
// frames due to React renders. opacity+transform run on compositor (GPU).
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

const mesOptions = MESES.map(m => ({ label: m, value: m }));
const entidadeOptions = [{ label: "PJ", value: "PJ" }, { label: "PF", value: "PF" }];

// ─── ReceitaTable fora do componente pai para evitar remount a cada render ───

function ReceitaTable({ data, title, updateType, addType, deleteType, bulkDeleteType, bulkUpdateType }: {
  data: ReceitaItem[]; title: string;
  updateType: "UPDATE_RECEITA_PROJECAO" | "UPDATE_RECEITA_REALIZACAO";
  addType: "ADD_RECEITA_PROJECAO" | "ADD_RECEITA_REALIZACAO";
  deleteType: "DELETE_RECEITA_PROJECAO" | "DELETE_RECEITA_REALIZACAO";
  bulkDeleteType: "BULK_DELETE_RECEITA_PROJECAO" | "BULK_DELETE_RECEITA_REALIZACAO";
  bulkUpdateType: "BULK_UPDATE_RECEITA_PROJECAO" | "BULK_UPDATE_RECEITA_REALIZACAO";
}) {
  const { dispatch } = useCalcir();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Limpa o highlight após 2.2s
  useEffect(() => {
    if (!highlightedId) return;
    const timer = window.setTimeout(() => setHighlightedId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedId]);

  // Scroll suave até a linha recém-adicionada
  useEffect(() => {
    if (!highlightedId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`row-${highlightedId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [highlightedId]);

  // Escuta eventos do TopBar para scroll + highlight
  useEffect(() => {
    const kind = addType === "ADD_RECEITA_REALIZACAO" ? "receita-realizacao" : "receita-projecao";
    const handler = (e: Event) => {
      const { kind: k, id } = (e as CustomEvent).detail;
      if (k !== kind) return;
      setPage(prev => Math.max(1, Math.ceil((data.length + 1) / pageSize)));
      setHighlightedId(id);
    };
    window.addEventListener("plt-item-added", handler);
    return () => window.removeEventListener("plt-item-added", handler);
  }, [addType, data.length, pageSize]);

  const updateReceita = (item: ReceitaItem, field: keyof ReceitaItem, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === "quantidade" || field === "valorUnit") updated.total = updated.quantidade * updated.valorUnit;
    dispatch({ type: updateType, payload: updated });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(r => r.produto.toLowerCase().includes(q) || r.obs.toLowerCase().includes(q) || r.entidade.toLowerCase().includes(q) || r.mes.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setSelected(prev => {
      const dataIds = new Set(data.map(d => d.id));
      const cleaned = new Set([...prev].filter(id => dataIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [data]);

  const pageIds = paged.map(r => r.id);
  const filteredIds = filtered.map(r => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));

  const toggleRow = useCallback((id: string) => { setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }, []);
  const togglePage = useCallback(() => { setSelected(prev => { const next = new Set(prev); if (allPageSelected) pageIds.forEach(id => next.delete(id)); else pageIds.forEach(id => next.add(id)); return next; }); }, [allPageSelected, pageIds]);
  const selectAllFiltered = useCallback(() => { setSelected(new Set(filteredIds)); }, [filteredIds]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const handleBulkDelete = () => { dispatch({ type: bulkDeleteType, payload: [...selected] }); setSelected(new Set()); };
  const handleBulkUpdate = (fields: Partial<ReceitaItem>) => { dispatch({ type: bulkUpdateType, payload: { ids: [...selected], fields } }); };

  return (
    <div className="data-panel animate-fade-in">
      <div className="data-panel-header flex-col !items-stretch">
        <div className="flex items-center justify-between">
          <h3>{title}</h3>
        </div>
        <div className="mt-3">
          <TableSearchPagination search={search} onSearchChange={setSearch} page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
        <div style={toolbarGrid(selected.size > 0)}>
          <div style={toolbarInner}>
            <div style={toolbarVisible(selected.size > 0)}>
              <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-2xl px-3 py-2">
                <span className="text-xs font-semibold">{selected.size} selecionado{selected.size > 1 ? "s" : ""}</span>
                {!allFilteredSelected && filtered.length > selected.size && <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={selectAllFiltered}>Selecionar todos ({filtered.length})</Button>}
                <div className="flex-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Pencil className="h-3 w-3" /> Editar</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ entidade: "PJ" })}>Entidade → PJ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ entidade: "PF" })}>Entidade → PF</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ pisCofins: true })}>PIS/COFINS → Sim</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ pisCofins: false })}>PIS/COFINS → Não</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {MESES.map(m => <DropdownMenuItem key={m} onClick={() => handleBulkUpdate({ mes: m })}>Mês → {m}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Trash2 className="h-3 w-3" /> Excluir ({selected.size})</Button></AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Excluir {selected.size} receita{selected.size > 1 ? "s" : ""}?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="data-panel-body p-3">
        <div className="table-modern">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2"><Checkbox checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false} onCheckedChange={togglePage} /></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Obs.</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>PIS/COFINS</TableHead>
                <TableHead>F.Rural N.I.</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">V. Unit.</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r) => (
                <TableRow
                  id={`row-${r.id}`}
                  key={r.id}
                  className={`transition-colors duration-700 ${highlightedId === r.id ? "bg-primary/15" : selected.has(r.id) ? "bg-primary/8" : ""}`}
                >
                  <TableCell className="px-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleRow(r.id)} /></TableCell>
                  <TableCell><ProductCombobox value={r.produto} onSave={(v) => updateReceita(r, "produto", v)} /></TableCell>
                  <TableCell><EditableCell value={r.obs} type="text" onSave={(v) => updateReceita(r, "obs", v)} className="text-muted-foreground block w-full min-h-8 px-2" /></TableCell>
                  <TableCell><EditableSelect value={r.entidade} options={entidadeOptions} onSave={(v) => updateReceita(r, "entidade", v)} variant="badge" badgeVariant={r.entidade === "PJ" ? "default" : "secondary"} /></TableCell>
                  <TableCell><Checkbox checked={r.pisCofins} onCheckedChange={(checked) => updateReceita(r, "pisCofins", !!checked)} /></TableCell>
                  <TableCell><Checkbox checked={r.funruralNaoIncidente} onCheckedChange={(checked) => updateReceita(r, "funruralNaoIncidente", !!checked)} className={r.funruralNaoIncidente ? "border-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning" : ""} /></TableCell>
                  <TableCell><EditableSelect value={r.mes} options={mesOptions} onSave={(v) => updateReceita(r, "mes", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={r.quantidade} type="number" onSave={(v) => updateReceita(r, "quantidade", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={r.valorUnit} type="currency" onSave={(v) => updateReceita(r, "valorUnit", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={r.estoque} type="number" onSave={(v) => updateReceita(r, "estoque", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={r.total} type="currency" onSave={(v) => updateReceita(r, "total", v)} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => dispatch({ type: deleteType, payload: r.id })}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="row-total">
                <TableCell /><TableCell className="font-bold" colSpan={9}>TOTAL</TableCell>
                <TableCell className="text-right tabular-nums font-bold text-base">{formatCurrency(data.reduce((s, r) => s + r.total, 0))}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function ReceitasAgro() {
  const { state, derived } = useCalcir();

  const kpiCards = [
    { title: "Receita Total Anual", value: derived.totalReceitasGeral, icon: TrendingUp, sub: `PF: ${formatCurrency(derived.totalReceitasPF)} · PJ: ${formatCurrency(derived.totalReceitasPJ)}`, accent: true },
    { title: "Realizações", value: derived.receitasRealizadas, icon: CheckCircle, sub: `${state.receitasRealizacoes.length} lançamentos realizados` },
    { title: "Projeções", value: derived.receitasProjetadas, icon: BarChart3, sub: `${state.receitasProjecoes.length} lançamentos projetados` },
    { title: "Imobilizado", value: derived.totalVendasImobilizadoPF + derived.totalVendasImobilizadoPJ, icon: Truck, sub: `${state.vendasImobilizado.length} vendas registradas` },
  ];

  return (
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon"><TrendingUp /></div>
        <div><h1>Receitas Agro</h1><p>Projeções, realizações e vendas de imobilizado</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((c, i) => (
          <div key={c.title} className={`animate-fade-in ${c.accent ? "metric-pill-accent" : "metric-pill"}`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <span className="metric-label">{c.title}</span>
              <c.icon className={`h-4 w-4 ${c.accent ? "text-white/50" : "text-muted-foreground/40"}`} />
            </div>
            <span className="metric-value"><ExpandableValue>{formatCurrency(c.value)}</ExpandableValue></span>
            <span className="metric-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      <ReceitaTable data={state.receitasRealizacoes} title="Realização das Receitas" updateType="UPDATE_RECEITA_REALIZACAO" addType="ADD_RECEITA_REALIZACAO" deleteType="DELETE_RECEITA_REALIZACAO" bulkDeleteType="BULK_DELETE_RECEITA_REALIZACAO" bulkUpdateType="BULK_UPDATE_RECEITA_REALIZACAO" />
      <ReceitaTable data={state.receitasProjecoes} title="Projeções de Receitas" updateType="UPDATE_RECEITA_PROJECAO" addType="ADD_RECEITA_PROJECAO" deleteType="DELETE_RECEITA_PROJECAO" bulkDeleteType="BULK_DELETE_RECEITA_PROJECAO" bulkUpdateType="BULK_UPDATE_RECEITA_PROJECAO" />
      <ImobilizadoTable data={state.vendasImobilizado} />
    </div>
  );
}

// ─── ImobilizadoTable ────────────────────────────────────────────────────────

function ImobilizadoTable({ data }: { data: VendaImobilizado[] }) {
  const { dispatch } = useCalcir();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!highlightedId) return;
    const timer = window.setTimeout(() => setHighlightedId(null), 2200);
    return () => window.clearTimeout(timer);
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
      if (kind !== "venda-imobilizado") return;
      setPage(Math.max(1, Math.ceil((data.length + 1) / pageSize)));
      setHighlightedId(id);
    };
    window.addEventListener("plt-item-added", handler);
    return () => window.removeEventListener("plt-item-added", handler);
  }, [data.length, pageSize]);

  // Limpa seleção quando itens são removidos
  useEffect(() => {
    setSelected(prev => {
      const dataIds = new Set(data.map(d => d.id));
      const cleaned = new Set([...prev].filter(id => dataIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(d => d.descricao.toLowerCase().includes(q) || d.entidade.toLowerCase().includes(q) || d.mes.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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

  const handleBulkDelete = () => { dispatch({ type: "BULK_DELETE_VENDA_IMOBILIZADO", payload: [...selected] }); setSelected(new Set()); };
  const handleBulkUpdate = (fields: Partial<VendaImobilizado>) => dispatch({ type: "BULK_UPDATE_VENDA_IMOBILIZADO", payload: { ids: [...selected], fields } });

  const updateVenda = (item: VendaImobilizado, field: keyof VendaImobilizado, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === "realizado" || field === "projetado") updated.total = updated.realizado + updated.projetado;
    dispatch({ type: "UPDATE_VENDA_IMOBILIZADO", payload: updated });
  };

  const localEntidadeOptions = [{ label: "PJ", value: "PJ" }, { label: "PF", value: "PF" }];
  const localMesOptions = MESES.map(m => ({ label: m, value: m }));

  return (
    <div className="data-panel animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
      <div className="data-panel-header flex-col !items-stretch">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Vendas de Imobilizado</h3>
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
                    <Button variant="outline" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Pencil className="h-3 w-3" /> Editar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ entidade: "PJ" })}>Entidade → PJ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate({ entidade: "PF" })}>Entidade → PF</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {MESES.map(m => (
                      <DropdownMenuItem key={m} onClick={() => handleBulkUpdate({ mes: m })}>Mês → {m}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1 text-[10px] h-7 rounded-lg"><Trash2 className="h-3 w-3" /> Excluir ({selected.size})</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {selected.size} venda{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
                      <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
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
      </div>
      <div className="data-panel-body p-3">
        <div className="table-modern">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2">
                  <Checkbox checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false} onCheckedChange={togglePage} />
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Projetado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((d) => (
                <TableRow
                  id={`row-${d.id}`}
                  key={d.id}
                  className={`transition-colors duration-700 ${highlightedId === d.id ? "bg-primary/15" : selected.has(d.id) ? "bg-primary/8" : ""}`}
                >
                  <TableCell className="px-2"><Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleRow(d.id)} /></TableCell>
                  <TableCell><EditableCell value={d.descricao} type="text" onSave={(v) => updateVenda(d, "descricao", v)} className="block w-full min-h-8 px-2" /></TableCell>
                  <TableCell><EditableSelect value={d.entidade} options={localEntidadeOptions} onSave={(v) => updateVenda(d, "entidade", v)} variant="badge" badgeVariant={d.entidade === "PJ" ? "default" : "secondary"} /></TableCell>
                  <TableCell><EditableSelect value={d.mes} options={localMesOptions} onSave={(v) => updateVenda(d, "mes", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={d.realizado} type="currency" onSave={(v) => updateVenda(d, "realizado", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={d.projetado} type="currency" onSave={(v) => updateVenda(d, "projetado", v)} /></TableCell>
                  <TableCell className="text-right"><EditableCell value={d.total} type="currency" onSave={(v) => updateVenda(d, "total", v)} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => dispatch({ type: "DELETE_VENDA_IMOBILIZADO", payload: d.id })}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="row-total">
                <TableCell /><TableCell className="font-bold" colSpan={5}>TOTAL</TableCell>
                <TableCell className="text-right tabular-nums font-bold">{formatCurrency(data.reduce((s, d) => s + d.total, 0))}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
