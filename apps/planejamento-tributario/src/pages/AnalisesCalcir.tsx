import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import ExpandableValue from "@/components/ExpandableValue";
import {
  useCalcir, computeDerived,
  type CalcirState, type CalcirDerived,
} from "@/contexts/CalcirContext";
import {
  loadCalcirAnalisePayload, loadClientData, type CalcirAnalise,
} from "@/services/supabaseData";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  Layers, Plus, Copy, Trash2, Pencil, Crown,
  TrendingUp, TrendingDown, Percent, Leaf, Building2,
  Info, Loader2, GitCompare, Eye, Check, Archive,
  ArrowUpRight, ArrowDownRight, Search, Heart, Filter, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell as RCell, Legend,
  LineChart, Line,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

/* ====================================================================
   CONSTANTS
   ==================================================================== */

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Check }> = {
  rascunho: { label: "Rascunho", variant: "secondary", icon: Pencil },
  fechada: { label: "Fechada", variant: "default", icon: Check },
  arquivada: { label: "Arquivada", variant: "outline", icon: Archive },
};

const COMPARE_COLORS = [
  "hsl(152 50% 30%)",
  "hsl(200 60% 50%)",
  "hsl(240 45% 55%)",
  "hsl(260 40% 50%)",
  "hsl(180 50% 40%)",
  "hsl(170 50% 35%)",
];

/* ====================================================================
   PAGE COMPONENT
   ==================================================================== */

export default function AnalisesCalcir() {
  const { user } = useAuth();
  const {
    state, derived, clienteId,
    analises, analiseId, analiseBasePadraoId, analisesLoading,
    setAnaliseId, createAnalise, updateAnalise, deleteAnalise,
    duplicateAnalise, setBasePadrao,
  } = useCalcir();

  // ── Dialog state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CalcirAnalise | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Comparison state ──
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("calcir_compare_ids");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });
  const [compareData, setCompareData] = useState<Map<string, CalcirDerived>>(new Map());
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareStep, setCompareStep] = useState<"select" | "loading" | "success">("select");
  const [compareChartMode, setCompareChartMode] = useState<"bar" | "line">("bar");
  const [compareActive, setCompareActive] = useState(() => {
    try {
      const stored = sessionStorage.getItem("calcir_compare_ids");
      const ids = stored ? (JSON.parse(stored) as string[]) : [];
      return ids.length >= 2;
    } catch { return false; }
  });

  // ── Persist comparison selection to sessionStorage ──
  useEffect(() => {
    if (compareSelected.size > 0) {
      sessionStorage.setItem("calcir_compare_ids", JSON.stringify([...compareSelected]));
    } else {
      sessionStorage.removeItem("calcir_compare_ids");
    }
  }, [compareSelected]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterFavoritos, setFilterFavoritos] = useState(false);

  // ── Favorites (Supabase) ──
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const favLoadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    favLoadedRef.current = false;
    supabase
      .from("calcir_analise_favoritos")
      .select("analise_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map((r) => r.analise_id)));
        favLoadedRef.current = true;
      });
  }, [user]);

  const toggleFavorite = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const isFav = favorites.has(id);
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(id); else next.add(id);
      return next;
    });
    if (isFav) {
      await supabase
        .from("calcir_analise_favoritos")
        .delete()
        .eq("user_id", user.id)
        .eq("analise_id", id);
    } else {
      await supabase
        .from("calcir_analise_favoritos")
        .insert({ user_id: user.id, analise_id: id });
    }
  }, [user, favorites]);

  // ── Sorted & filtered analyses ──
  const sorted = useMemo(() => {
    let list = [...analises];
    // Sort: base first, then favorites, then by date desc
    list.sort((a, b) => {
      if (a.isBasePadrao && !b.isBasePadrao) return -1;
      if (!a.isBasePadrao && b.isBasePadrao) return 1;
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // Filter by status
    if (filterStatus !== "todos") {
      list = list.filter(a => a.status === filterStatus);
    }
    // Filter favorites only
    if (filterFavoritos) {
      list = list.filter(a => favorites.has(a.id));
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.nome.toLowerCase().includes(q) ||
        new Date(a.createdAt).toLocaleDateString("pt-BR").includes(q)
      );
    }
    return list;
  }, [analises, searchQuery, filterStatus, filterFavoritos, favorites]);

  // ── Current analysis info ──
  const current = analises.find((a) => a.id === analiseId);
  const isBase = analiseId === analiseBasePadraoId;

  // ── Handlers ──
  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setActionLoading(true);
    try {
      await createAnalise({ nome: newName.trim(), tipo: "base" });
      setNewName("");
      setCreateOpen(false);
    } finally {
      setActionLoading(false);
    }
  }, [newName, createAnalise]);

  const handleRename = useCallback(async () => {
    if (!editingId || !editName.trim()) return;
    setActionLoading(true);
    try {
      await updateAnalise(editingId, { nome: editName.trim() });
      setEditingId(null);
    } finally {
      setActionLoading(false);
    }
  }, [editingId, editName, updateAnalise]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteAnalise(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, deleteAnalise]);

  const handleDuplicate = useCallback(async (a: CalcirAnalise) => {
    setActionLoading(true);
    try {
      await duplicateAnalise(a.id, `${a.nome} (cópia)`);
    } finally {
      setActionLoading(false);
    }
  }, [duplicateAnalise]);

  const handleStatusChange = useCallback(async (a: CalcirAnalise, status: "rascunho" | "fechada" | "arquivada") => {
    await updateAnalise(a.id, { status });
  }, [updateAnalise]);

  // ── Load comparison data for selected analyses ──
  const loadComparisonForIds = useCallback(async (selectedIds: Set<string>) => {
    if (!clienteId || selectedIds.size < 1) return new Map<string, CalcirDerived>();
    const map = new Map<string, CalcirDerived>();
    const selectedAnalyses = analises.filter(a => selectedIds.has(a.id));

    await Promise.all(
      selectedAnalyses.map(async (a) => {
        try {
          // Reuse already-computed derived for the active analysis
          if (a.id === analiseId) {
            map.set(a.id, derived);
            return;
          }
          let payload: Partial<CalcirState> | null;
          if (a.id === analiseBasePadraoId) {
            payload = await loadClientData(clienteId);
          } else {
            payload = await loadCalcirAnalisePayload(clienteId, a.id);
            // Fallback: if no saved payload, load base client data (COW copy)
            if (!payload) {
              payload = await loadClientData(clienteId);
            }
          }
          if (payload) {
            const fullState: CalcirState = {
              parceiros: [], receitasProjecoes: [], receitasRealizacoes: [],
              vendasImobilizado: [], despesas: [], imobilizadoAquisicao: [],
              atividadeRuralParticular: [], rendimentosParticulares: [],
              retencoesParticulares: [], demaisDespesasPJ: 0, lucroAcumuladoPJ: 0,
              funruralPJRegime: "receita_bruta", funruralPJAliquota: 0.0205,
              folhaPagamentoPJ: 0, funruralPFRegime: "receita_bruta" as const, funruralPFAliquota: 0.015,
              folhaPagamentoPF: 0, prejuizosAnteriores: {}, lucrosIsentosAcumulados: {},
              regimeApuracaoRural: {}, contabilidadeRegular: false, lcdprLimite: 4800000, simulacaoDespesasPFPerc: null,
              ...payload,
            };
            map.set(a.id, computeDerived(fullState));
          }
        } catch (err) {
          console.warn(`Failed to load analysis ${a.nome}:`, err);
        }
      }),
    );
    return map;
  }, [clienteId, analises, analiseId, analiseBasePadraoId, derived]);

  // ── Pre-load derived data for all analysis cards ──
  const [cardDerivedMap, setCardDerivedMap] = useState<Map<string, CalcirDerived>>(new Map());
  const cardDerivedLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!clienteId || analises.length === 0) return;
    const cacheKey = `${clienteId}_${analises.map(a => a.id).join(",")}`;
    if (cardDerivedLoadedRef.current === cacheKey) return;
    cardDerivedLoadedRef.current = cacheKey;

    const inactiveIds = analises.filter(a => a.id !== analiseId).map(a => a.id);
    if (inactiveIds.length === 0) return;

    loadComparisonForIds(new Set(inactiveIds)).then(map => {
      setCardDerivedMap(map);
    });
  }, [clienteId, analises, analiseId, loadComparisonForIds]);

  // ── Restore comparison data when analises load ──
  const compareRestoredRef = useRef(false);
  useEffect(() => {
    if (compareRestoredRef.current || !clienteId || analises.length === 0 || compareSelected.size < 2) return;
    if (compareData.size > 0) return;
    compareRestoredRef.current = true;
    const validIds = new Set([...compareSelected].filter(id => analises.some(a => a.id === id)));
    if (validIds.size < 2) {
      setCompareActive(false);
      setCompareSelected(new Set());
      return;
    }
    setCompareSelected(validIds);
    setCompareLoading(true);
    loadComparisonForIds(validIds).then(map => {
      setCompareData(map);
      setCompareActive(map.size >= 2);
    }).finally(() => setCompareLoading(false));
  }, [clienteId, analises, compareSelected, compareData.size, loadComparisonForIds]);

  const loadComparison = useCallback(async () => {
    if (!clienteId || compareSelected.size < 2) return;
    setCompareStep("loading");
    setCompareLoading(true);
    try {
      const map = await loadComparisonForIds(compareSelected);
      setCompareData(map);
      setCompareStep("success");
      setTimeout(() => {
        setCompareOpen(false);
        setCompareActive(true);
      }, 1800);
    } finally {
      setCompareLoading(false);
    }
  }, [clienteId, compareSelected, loadComparisonForIds]);

  const openCompareDialog = useCallback(() => {
    setCompareSelected(new Set());
    setCompareData(new Map());
    setCompareStep("select");
    setCompareOpen(true);
  }, []);

  // ── Dynamic add/remove from active comparison ──
  const removeFromComparison = useCallback((id: string) => {
    setCompareData(prev => {
      const next = new Map(prev);
      next.delete(id);
      if (next.size < 1) setCompareActive(false);
      return next;
    });
    setCompareSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const addToComparison = useCallback(async (id: string) => {
    const ids = new Set([id]);
    setCompareLoading(true);
    try {
      const newData = await loadComparisonForIds(ids);
      setCompareData(prev => {
        const merged = new Map(prev);
        newData.forEach((v, k) => merged.set(k, v));
        return merged;
      });
      setCompareSelected(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } finally {
      setCompareLoading(false);
    }
  }, [loadComparisonForIds]);

  const toggleCompareSelection = useCallback((id: string) => {
    setCompareSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 6) next.add(id);
      return next;
    });
  }, []);

  // ── Comparison metrics definition ──
  const comparisonMetrics = useMemo(() => [
    { key: "totalReceitasGeral", label: "Receita Total", icon: TrendingUp, higherBetter: true },
    { key: "totalDespesas", label: "Despesas Totais", icon: TrendingDown, higherBetter: false },
    { key: "totalImpostosPFExclusivo", label: "Impostos PF", icon: Percent, higherBetter: false },
    { key: "totalImpostosHoldingCompleto", label: "Impostos Holding", icon: Building2, higherBetter: false },
    { key: "economia_economia", label: "Economia Projetada", icon: Leaf, higherBetter: true },
  ] as const, []);

  const getMetricValue = (d: CalcirDerived, key: string): number => {
    if (key === "economia_economia") return d.economia.economia;
    return (d as any)[key] ?? 0;
  };

  // ── Current analysis KPIs ──
  const totalIRPFM = derived.irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
  const cargaTributaria = derived.totalReceitasGeral > 0
    ? (derived.totalImpostosHoldingCompleto / derived.totalReceitasGeral) * 100
    : 0;
  const resultadoLiquido = derived.totalReceitasGeral - derived.totalDespesas;

  /* ====================================================================
     RENDER
     ==================================================================== */

  if (analisesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
       <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="section-header mb-0">
              <div className="section-icon"><Layers /></div>
              <div>
                <h1>Central de Análises</h1>
                <p>Gerencie, compare e analise cenários tributários</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {compareActive && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-muted-foreground/30 text-muted-foreground hover:bg-muted/20"
                onClick={() => { setCompareActive(false); setCompareData(new Map()); setCompareSelected(new Set()); sessionStorage.removeItem("calcir_compare_ids"); }}
              >
                <GitCompare className="h-3.5 w-3.5" />
                Fechar Comparação
              </Button>
            )}
            <Button
              variant={compareActive ? "default" : "outline"}
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={openCompareDialog}
              disabled={analises.length < 2}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {compareActive ? "Nova Comparação" : "Comparar Cenários"}
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Novo Cenário
            </Button>
          </div>
        </div>


        {/* ── Analysis Cards Grid ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Cenários ({sorted.length}{(searchQuery || filterStatus !== "todos" || filterFavoritos) ? ` de ${analises.length}` : ""})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Filter className="h-3.5 w-3.5" />
                    Filtros
                    {(filterStatus !== "todos" || filterFavoritos) && (
                      <Badge variant="default" className="text-[9px] px-1 py-0 ml-1">
                        {(filterStatus !== "todos" ? 1 : 0) + (filterFavoritos ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuCheckboxItem checked={filterStatus === "todos"} onCheckedChange={() => setFilterStatus("todos")}>
                    Todos os status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filterStatus === "rascunho"} onCheckedChange={() => setFilterStatus(filterStatus === "rascunho" ? "todos" : "rascunho")}>
                    Rascunho
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filterStatus === "fechada"} onCheckedChange={() => setFilterStatus(filterStatus === "fechada" ? "todos" : "fechada")}>
                    Fechada
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filterStatus === "arquivada"} onCheckedChange={() => setFilterStatus(filterStatus === "arquivada" ? "todos" : "arquivada")}>
                    Arquivada
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filterFavoritos} onCheckedChange={(v) => setFilterFavoritos(!!v)}>
                    <Heart className="h-3 w-3 mr-1.5" /> Apenas favoritos
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((a, i) => {
              const isActive = a.id === analiseId;
              const statusConf = STATUS_CONFIG[a.status] || STATUS_CONFIG.rascunho;
              const StatusIcon = statusConf.icon;

              return (
                <Card
                  key={a.id}
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer group animate-fade-in
                    ${isActive ? "ring-2 ring-primary shadow-md" : "hover:ring-1 hover:ring-primary/30"}
                    ${a.isBasePadrao ? "border-primary/40" : ""}`}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                  onClick={() => setAnaliseId(a.id)}
                >
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.isBasePadrao ? (
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Crown className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{a.nome}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                            {a.anoReferencia ? ` · Ref: ${a.anoReferencia}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleFavorite(a.id, e)}
                          className="p-1 rounded-sm hover:bg-muted transition-colors"
                          title={favorites.has(a.id) ? "Remover dos favoritos" : "Favoritar"}
                        >
                          <Heart className={`h-3.5 w-3.5 transition-colors ${favorites.has(a.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </button>
                        <Badge variant={statusConf.variant} className="text-[10px] gap-0.5 px-1.5">
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusConf.label}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="text-[10px] px-1.5 bg-primary">
                            Ativa
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quick metrics - show for all analyses */}
                    {(() => {
                      const cardDerived = isActive ? derived : cardDerivedMap.get(a.id);
                      return (
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Receita</p>
                            <p className="text-xs font-semibold tabular-nums">
                              {cardDerived ? formatCurrency(cardDerived.totalReceitasGeral) : <span className="text-muted-foreground/50">—</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Impostos</p>
                            <p className="text-xs font-semibold tabular-nums">
                              {cardDerived ? formatCurrency(cardDerived.totalImpostosHoldingCompleto) : <span className="text-muted-foreground/50">—</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Economia</p>
                            <p className="text-xs font-semibold tabular-nums text-emerald-600">
                              {cardDerived ? formatCurrency(cardDerived.economia.economia) : <span className="text-muted-foreground/50">—</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setEditingId(a.id); setEditName(a.nome); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Renomear</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleDuplicate(a); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicar cenário</TooltipContent>
                      </Tooltip>

                      {!a.isBasePadrao && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setBasePadrao(a.id); }}>
                              <Crown className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Definir como base</TooltipContent>
                        </Tooltip>
                      )}

                      {a.status === "rascunho" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleStatusChange(a, "fechada"); }}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Fechar análise</TooltipContent>
                        </Tooltip>
                      )}

                      {a.status !== "arquivada" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleStatusChange(a, "arquivada"); }}>
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Arquivar</TooltipContent>
                        </Tooltip>
                      )}

                      {a.status === "arquivada" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleStatusChange(a, "rascunho"); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reabrir como rascunho</TooltipContent>
                        </Tooltip>
                      )}

                      {!a.isBasePadrao && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Create new scenario card */}
            <Card
              className="border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 cursor-pointer transition-all duration-200 hover:shadow-sm flex items-center justify-center min-h-[140px]"
              onClick={() => setCreateOpen(true)}
            >
              <CardContent className="flex flex-col items-center gap-2 py-6">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Novo Cenário</p>
                <p className="text-[10px] text-muted-foreground/70">Crie um cenário para testar mudanças</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Comparison Selection Dialog ── */}
        <Dialog open={compareOpen} onOpenChange={(open) => {
          if (!open && compareStep === "loading") return; // prevent closing during load
          setCompareOpen(open);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <GitCompare className="h-4 w-4 text-primary" />
                </div>
                {compareStep === "select" && "Selecionar Cenários"}
                {compareStep === "loading" && "Processando..."}
                {compareStep === "success" && "Comparação Pronta!"}
              </DialogTitle>
              <DialogDescription>
                {compareStep === "select" && "Escolha de 2 a 6 cenários para comparar lado a lado."}
                {compareStep === "loading" && "Calculando métricas de cada cenário..."}
                {compareStep === "success" && "Os resultados serão exibidos na página."}
              </DialogDescription>
            </DialogHeader>

            {/* Step: Select */}
            {compareStep === "select" && (
              <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
                {analises.map((a, i) => {
                  const isSelected = compareSelected.has(a.id);
                  const statusConf = STATUS_CONFIG[a.status] || STATUS_CONFIG.rascunho;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleCompareSelection(a.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 animate-fade-in
                        ${isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }
                        ${!isSelected && compareSelected.size >= 6 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                    >
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200
                        ${isSelected ? "border-primary bg-primary scale-110" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{a.nome}</span>
                          {a.isBasePadrao && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0 gap-0.5">
                              <Crown className="h-2.5 w-2.5" /> Base
                            </Badge>
                          )}
                          <Badge variant={statusConf.variant} className="text-[9px] px-1.5 py-0">
                            {statusConf.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                          {a.anoReferencia ? ` · Ref: ${a.anoReferencia}` : ""}
                        </p>
                      </div>
                      {favorites.has(a.id) && (
                        <Heart className="h-3.5 w-3.5 fill-destructive text-destructive shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step: Loading */}
            {compareStep === "loading" && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
                  <GitCompare className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">Calculando cenários...</p>
                  <p className="text-xs text-muted-foreground">{compareSelected.size} cenários selecionados</p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {compareStep === "success" && (
              <div className="flex flex-col items-center justify-center py-10 gap-4 animate-scale-in">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-foreground">Comparação concluída!</p>
                  <p className="text-sm text-muted-foreground">
                    {compareData.size} cenários analisados com sucesso
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  {analises.filter(a => compareData.has(a.id)).map((a) => (
                    <Badge key={a.id} variant="secondary" className="text-xs gap-1">
                      {a.isBasePadrao && <Crown className="h-2.5 w-2.5" />}
                      {a.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Footer for select step */}
            {compareStep === "select" && (
              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {compareSelected.size} selecionado{compareSelected.size !== 1 ? "s" : ""}
                </p>
                <Button
                  onClick={loadComparison}
                  disabled={compareSelected.size < 2 || compareLoading}
                  className="gap-1.5"
                >
                  <GitCompare className="h-4 w-4" />
                  Comparar ({compareSelected.size})
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Inline Comparison Results ── */}
        {compareActive && compareData.size > 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* Results header with interactive chips */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                Comparação ({compareData.size} cenário{compareData.size !== 1 ? "s" : ""})
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {analises.filter(a => compareData.has(a.id)).map((a, i) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-200 bg-background hover:bg-muted/50 animate-scale-in"
                    style={{
                      borderColor: COMPARE_COLORS[i % COMPARE_COLORS.length],
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }} />
                    {a.isBasePadrao && <Crown className="h-2.5 w-2.5 text-primary" />}
                    <span className="truncate max-w-[120px]">{a.nome}</span>
                    {compareData.size > 1 && (
                      <button
                        onClick={() => removeFromComparison(a.id)}
                        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors shrink-0"
                        title="Remover da comparação"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
                {/* Add more button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
                      disabled={compareLoading}
                    >
                      {compareLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Adicionar
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                    {analises.filter(a => !compareData.has(a.id)).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Todos os cenários já estão na comparação</p>
                    ) : (
                      analises.filter(a => !compareData.has(a.id)).map((a) => (
                        <DropdownMenuCheckboxItem
                          key={a.id}
                          checked={false}
                          onCheckedChange={() => addToComparison(a.id)}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            {a.isBasePadrao && <Crown className="h-3 w-3 text-primary" />}
                            <span className="truncate">{a.nome}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Comparison table card */}
            <Card className="border-primary/20 animate-fade-in rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="font-semibold text-foreground sticky left-0 bg-muted/40 min-w-[160px]">Métrica</TableHead>
                        {analises.filter(a => compareData.has(a.id)).map((a) => (
                          <TableHead key={a.id} className="text-center font-semibold text-foreground min-w-[130px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs">{a.nome}</span>
                              {a.isBasePadrao && <Badge variant="default" className="text-[8px] px-1 py-0">Base</Badge>}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonMetrics.map((metric, mi) => {
                        const analysesWithData = analises.filter(a => compareData.has(a.id));
                        const values = analysesWithData.map(a => ({
                          id: a.id,
                          value: getMetricValue(compareData.get(a.id)!, metric.key),
                        }));
                        const best = metric.higherBetter
                          ? Math.max(...values.map(v => v.value))
                          : Math.min(...values.map(v => v.value));

                        return (
                          <TableRow key={metric.key} className={mi % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <TableCell className="font-medium sticky left-0 bg-inherit">
                              <div className="flex items-center gap-2">
                                <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{metric.label}</span>
                              </div>
                            </TableCell>
                            {analysesWithData.map((a) => {
                              const val = getMetricValue(compareData.get(a.id)!, metric.key);
                              const isBest = Math.abs(val - best) < 0.01 && values.length > 1;
                              return (
                                <TableCell key={a.id} className="text-center">
                                  <span className={`text-sm tabular-nums font-medium ${isBest ? "text-primary font-bold" : ""}`}>
                                    {formatCurrency(val)}
                                  </span>
                                  {isBest && values.length > 1 && (
                                    <span className="ml-1 text-[10px] text-primary">★</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      {/* Carga tributária row */}
                      <TableRow className="bg-primary/5 border-t">
                        <TableCell className="font-medium sticky left-0 bg-primary/5">
                          <div className="flex items-center gap-2">
                            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-semibold">Carga Tributária</span>
                          </div>
                        </TableCell>
                        {analises.filter(a => compareData.has(a.id)).map((a) => {
                          const d = compareData.get(a.id)!;
                          const carga = d.totalReceitasGeral > 0
                            ? (d.totalImpostosHoldingCompleto / d.totalReceitasGeral) * 100
                            : 0;
                          return (
                            <TableCell key={a.id} className="text-center">
                              <span className="text-sm tabular-nums font-bold">{formatPercent(carga)}</span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Stacked / Line comparison chart card */}
            <Card className="border-primary/20 animate-fade-in rounded-xl" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
              <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Composição Tributária por Cenário
                </CardTitle>
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setCompareChartMode("bar")}
                    className={`p-1.5 rounded-md transition-all ${compareChartMode === "bar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    title="Gráfico de barras empilhadas"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCompareChartMode("line")}
                    className={`p-1.5 rounded-md transition-all ${compareChartMode === "line" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    title="Gráfico de linhas"
                  >
                    <LineChartIcon className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {(() => {
                  const TAX_SLICES = [
                    { key: "irpj", label: "IRPJ", color: "hsl(200 65% 45%)" },
                    { key: "csll", label: "CSLL", color: "hsl(220 55% 52%)" },
                    { key: "pis_cofins", label: "PIS/COFINS", color: "hsl(180 50% 40%)" },
                    { key: "funrural_pj", label: "Funrural PJ", color: "hsl(152 45% 38%)" },
                    { key: "irpf_pf", label: "IRPF PF", color: "hsl(240 45% 55%)" },
                    { key: "funrural_pf", label: "Funrural PF", color: "hsl(170 50% 35%)" },
                    { key: "irpfm", label: "IRPFM", color: "hsl(260 40% 50%)" },
                  ];

                  const chartAnalyses = analises.filter(a => compareData.has(a.id));
                  const chartData = chartAnalyses.map((a) => {
                    const d = compareData.get(a.id)!;
                    const irpfm = d.irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
                    return {
                      nome: a.nome.length > 20 ? a.nome.slice(0, 18) + "…" : a.nome,
                      irpj: d.impostosPJ.ir15 + d.impostosPJ.irAdicional10,
                      csll: d.impostosPJ.csll9,
                      pis_cofins: d.impostosPJ.pis + d.impostosPJ.cofins,
                      funrural_pj: d.impostosPJ.funrural,
                      irpf_pf: d.totalIRPF,
                      funrural_pf: d.funruralPF,
                      irpfm,
                    };
                  });

                  const CustomTooltipContent = ({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-xl text-xs space-y-1.5">
                        <p className="font-semibold text-foreground mb-1">{label}</p>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill || p.stroke }} />
                              <span className="text-muted-foreground">{p.name}</span>
                            </div>
                            <span className="font-medium tabular-nums text-foreground">{formatCurrency(p.value)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1.5 flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span className="tabular-nums">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    );
                  };

                  const yAxisFormatter = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v);

                  if (compareChartMode === "line") {
                    // Transpose data: one point per tax type, one line per scenario
                    const lineData = TAX_SLICES.map((slice) => {
                      const point: Record<string, any> = { imposto: slice.label };
                      chartAnalyses.forEach((a, i) => {
                        const row = chartData[i];
                        point[a.id] = row[slice.key as keyof typeof row];
                      });
                      return point;
                    });

                    const SCENARIO_COLORS = [
                      "hsl(152 50% 35%)",
                      "hsl(200 60% 50%)",
                      "hsl(240 45% 55%)",
                      "hsl(260 40% 50%)",
                      "hsl(180 50% 40%)",
                      "hsl(170 50% 35%)",
                    ];

                    return (
                      <ResponsiveContainer width="100%" height={340}>
                        <LineChart data={lineData} margin={{ top: 10, right: 20, bottom: 10, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                          <XAxis dataKey="imposto" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                          <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 10 }} />
                          <RTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-lg border bg-background px-3 py-2 shadow-xl text-xs space-y-1.5">
                                  <p className="font-semibold text-foreground mb-1">{label}</p>
                                  {payload.map((p: any) => {
                                    const a = chartAnalyses.find(x => x.id === p.dataKey);
                                    return (
                                      <div key={p.dataKey} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.stroke }} />
                                          <span className="text-muted-foreground">{a?.nome || p.dataKey}</span>
                                        </div>
                                        <span className="font-medium tabular-nums text-foreground">{formatCurrency(p.value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }}
                            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                            formatter={(value: string) => {
                              const a = chartAnalyses.find(x => x.id === value);
                              return <span className="text-muted-foreground">{a?.nome || value}</span>;
                            }}
                          />
                          {chartAnalyses.map((a, i) => (
                            <Line
                              key={a.id}
                              type="monotone"
                              dataKey={a.id}
                              name={a.id}
                              stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                              strokeWidth={2.5}
                              dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                              activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={chartData} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                        <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 10 }} />
                        <RTooltip content={<CustomTooltipContent />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                          formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
                        />
                        {TAX_SLICES.map((slice) => (
                          <Bar
                            key={slice.key}
                            dataKey={slice.key}
                            name={slice.label}
                            stackId="taxes"
                            fill={slice.color}
                            radius={slice.key === "irpfm" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}


        {/* ── Create Dialog ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cenário de Análise</DialogTitle>
              <DialogDescription>
                O novo cenário será criado como uma cópia da base principal. Você pode editar os dados depois.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Nome do cenário (ex: Cenário Otimista, Teste PJ 80%)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Criar Cenário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Help Modal ── */}
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                Como usar as Análises?
              </DialogTitle>
              <DialogDescription>
                Gerencie cenários tributários e compare estratégias para encontrar a melhor opção.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {[
                { step: "1", title: "Base Principal", desc: "Seus dados reais sincronizados das integrações (Connectere/Aegro). É o ponto de partida para todas as simulações." },
                { step: "2", title: "Criar Cenário", desc: "Duplique a base para testar mudanças: ajuste receitas, despesas ou parâmetros da PJ sem alterar os dados originais." },
                { step: "3", title: "Ajustar Dados", desc: "Selecione o cenário desejado no seletor do topo da página e edite receitas, despesas e configurações à vontade." },
                { step: "4", title: "Comparar", desc: "Use o botão 'Comparar Cenários' para visualizar lado a lado qual cenário gera mais economia tributária." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setHelpOpen(false)} className="w-full sm:w-auto">Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Rename Dialog ── */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear Análise</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button onClick={handleRename} disabled={!editName.trim() || actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation ── */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir análise?</AlertDialogTitle>
              <AlertDialogDescription>
                A análise <strong>{deleteTarget?.nome}</strong> será excluída permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
