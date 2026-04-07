import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCalcir } from "@/contexts/CalcirContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, Plus, Loader2, LogOut, Search, MapPin, Filter, X,
  Pencil, Trash2, ImagePlus, MoreVertical, Share2, DoorOpen,
  ChevronRight, ChevronLeft, Building2, Map, ExternalLink, Newspaper, FlaskConical
} from "lucide-react";
import logoSafras from "@/assets/logo-safras-cifras.png";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const ITEMS_PER_PAGE = 6;

const SUPABASE_URL = "https://wuzdnvbwceykibwgjusj.supabase.co";

interface NoticiaItem {
  titulo: string;
  resumo: string;
  fonte: string;
  tag: string;
  data: string;
  url: string;
}

const NOTICIAS_AGRO: NoticiaItem[] = [
  {
    titulo: "Reforma Tributária: novas regras para o agronegócio em 2026",
    resumo: "Entenda as principais mudanças com a regulamentação do IBS e CBS para produtores rurais.",
    fonte: "Canal Rural",
    tag: "Tributário",
    data: "10 Mar 2026",
    url: "https://www.canalrural.com.br",
  },
  {
    titulo: "Safra recorde de soja impulsiona PIB do agro",
    resumo: "Produção brasileira atinge 170 milhões de toneladas na safra 2025/26.",
    fonte: "Globo Rural",
    tag: "Mercado",
    data: "08 Mar 2026",
    url: "https://www.globorural.com.br",
  },
  {
    titulo: "Funrural: alíquotas atualizadas para pessoa física e jurídica",
    resumo: "Receita Federal publica instrução normativa com novos percentuais de contribuição.",
    fonte: "Agrolink",
    tag: "Tributário",
    data: "05 Mar 2026",
    url: "https://www.agrolink.com.br",
  },
];

interface Cliente {
  id: string;
  nome: string;
  documento: string | null;
  estado: string | null;
  regional: string | null;
  foto_url: string | null;
  farmRole?: "owner" | "editor";
}

function getFotoPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/fazenda-fotos/${path}`;
}

function getUserDisplayName(email: string | undefined): string {
  if (!email) return "Consultor";
  const name = email.split("@")[0];
  return name
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HomePage() {
  const { user, signOut, role } = useAuth();
  const { setClienteId } = useCalcir();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionais, setRegionais] = useState<string[]>([]);

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formDoc, setFormDoc] = useState("");
  const [formEstado, setFormEstado] = useState("");
  const [formRegional, setFormRegional] = useState("");
  const [formFoto, setFormFoto] = useState<File | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editFoto, setEditFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCliente, setDeleteCliente] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search & filters
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [page, setPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const fetchClientes = async () => {
    if (!user || !role) return;
    setLoading(true);

    let data: any[] | null = null;
    let error: any = null;

    if (role === "cliente") {
      ({ data, error } = await supabase
        .from("cliente_users")
        .select("cliente_id, clientes(id, nome, documento, estado, regional, foto_url)")
        .eq("user_id", user.id));
    } else {
      ({ data, error } = await supabase
        .from("consultor_clientes")
        .select("cliente_id, role, clientes(id, nome, documento, estado, regional, foto_url)")
        .eq("consultor_id", user.id));
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setClientes(
        (data || []).map((r: any) => {
          const c = r.clientes as Cliente;
          if (c && r.role) c.farmRole = r.role;
          return c;
        }).filter(Boolean)
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, [user, role]);

  useEffect(() => {
    supabase.from("regionais").select("nome").order("nome").then(({ data }) => {
      if (data) setRegionais(data.map((r: any) => r.nome));
    });
  }, []);

  const filteredClientes = useMemo(() => {
    setPage(0);
    return clientes.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.nome.toLowerCase().includes(q) ||
        (c.documento && c.documento.includes(q)) ||
        (c.regional && c.regional.toLowerCase().includes(q));
      return (
        matchSearch &&
        (filterEstado === "all" || c.estado === filterEstado)
      );
    });
  }, [clientes, search, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / ITEMS_PER_PAGE));
  const paginatedClientes = filteredClientes.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const hasActiveFilters = filterEstado !== "all";

  // --- Stats ---
  const stats = useMemo(() => {
    const estadoCount: Record<string, number> = {};
    clientes.forEach((c) => {
      if (c.estado) estadoCount[c.estado] = (estadoCount[c.estado] || 0) + 1;
    });
    const topEstados = Object.entries(estadoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { estadoCount, topEstados };
  }, [clientes]);

  // --- Upload helper ---
  const uploadFoto = async (file: File, clienteId: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${clienteId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("fazenda-fotos")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  // --- Create ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    try {
      // Generate ID client-side so we can skip .select() on insert.
      // The SELECT RLS policy requires consultor_clientes to exist,
      // but we can only create that after the insert — so .select()
      // would fail with an RLS violation.
      const newId = crypto.randomUUID();

      const { error: err } = await supabase
        .from("clientes")
        .insert({
          id: newId,
          nome: formNome,
          documento: formDoc || null,
          estado: formEstado || null,
          regional: formRegional || null,
        });
      if (err) throw err;

      // Create junction FIRST so subsequent queries pass SELECT RLS
      await supabase
        .from("consultor_clientes")
        .insert({ consultor_id: user.id, cliente_id: newId });

      const { error: configErr } = await supabase
        .from("config_cliente")
        .upsert(
          {
            cliente_id: newId,
            calcir_cow_enabled: true,
          },
          { onConflict: "cliente_id" },
        );
      if (configErr) throw configErr;

      // Upload photo if provided
      if (formFoto) {
        const path = await uploadFoto(formFoto, newId);
        await supabase.from("clientes").update({ foto_url: path }).eq("id", newId);
      }

      toast({ title: "Fazenda criada!" });
      resetCreateForm();
      setDialogOpen(false);
      fetchClientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const resetCreateForm = () => {
    setFormNome(""); setFormDoc(""); setFormEstado(""); setFormRegional(""); setFormFoto(null);
  };

  // --- Edit ---
  const openEdit = (c: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCliente({ ...c });
    setEditFoto(null);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCliente) return;
    setSaving(true);

    try {
      let foto_url = editCliente.foto_url;
      if (editFoto) {
        const path = await uploadFoto(editFoto, editCliente.id);
        foto_url = path;
      }

      const { error } = await supabase
        .from("clientes")
        .update({
          nome: editCliente.nome,
          documento: editCliente.documento,
          estado: editCliente.estado,
          regional: editCliente.regional,
          foto_url,
        })
        .eq("id", editCliente.id);
      if (error) throw error;

      toast({ title: "Fazenda atualizada!" });
      setEditOpen(false);
      fetchClientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // --- Delete ---
  const openDelete = (c: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCliente(c);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCliente || !user) return;
    setDeleting(true);
    try {
      await supabase.from("consultor_clientes").delete()
        .eq("consultor_id", user.id).eq("cliente_id", deleteCliente.id);
      await supabase.from("clientes").delete().eq("id", deleteCliente.id);
      toast({ title: "Fazenda excluída" });
      setDeleteOpen(false);
      fetchClientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
    setDeleting(false);
  };

  // --- Leave shared farm (editor only) ---
  const handleLeaveFarm = async (c: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await supabase.from("consultor_clientes").delete()
        .eq("consultor_id", user.id).eq("cliente_id", c.id);
      toast({ title: "Você saiu da fazenda", description: `Acesso a "${c.nome}" foi removido.` });
      fetchClientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const handleSelect = (c: Cliente) => {
    setClienteId(c.id);
    navigate("/");
  };

  const placeholderBg = "bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5";
  const displayName = getUserDisplayName(user?.email);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src={logoSafras} alt="Safras & Cifras" className="h-11 w-11 object-contain" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground leading-none">Safras & Cifras</p>
              <p className="text-[11px] text-muted-foreground">Planejamento Tributário</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Title + Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Minhas Fazendas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? "Carregando..." : `${clientes.length} fazenda${clientes.length !== 1 ? "s" : ""} cadastrada${clientes.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-card"
              />
            </div>

            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 relative h-9">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filtros</span>
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {(filterEstado !== "all" ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-4" align="end">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Filtros</p>
                  {hasActiveFilters && (
                    <button onClick={() => { setFilterEstado("all"); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <X className="h-3 w-3" /> Limpar
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estado</Label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>

            {/* New Farm — only for consultors */}
            {role !== "cliente" && <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetCreateForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-9">
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Fazenda</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Fazenda</DialogTitle>
                  <DialogDescription>Preencha os dados da propriedade</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div
                    className={`relative h-32 rounded-xl overflow-hidden cursor-pointer group ${formFoto ? "" : placeholderBg} border-2 border-dashed border-border hover:border-primary/50 transition-colors`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formFoto && (
                      <img src={URL.createObjectURL(formFoto)} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus className="h-6 w-6 text-foreground" />
                    </div>
                    {!formFoto && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Adicionar foto (opcional)</span>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFormFoto(e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Fazenda</Label>
                    <Input value={formNome} onChange={(e) => setFormNome(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input value={formDoc} onChange={(e) => setFormDoc(e.target.value)} placeholder="Opcional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={formEstado} onValueChange={setFormEstado}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Regional</Label>
                    <Select value={formRegional} onValueChange={setFormRegional}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{regionais.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar Fazenda
                  </Button>
                </form>
              </DialogContent>
            </Dialog>}
          </div>
        </div>

        {/* Quick Stats Bar */}
        {clientes.length > 0 && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
              <Leaf className="h-3 w-3" /> {clientes.length} fazenda{clientes.length !== 1 ? "s" : ""}
            </div>
            {Object.keys(stats.estadoCount).length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
                <Map className="h-3 w-3" /> {Object.keys(stats.estadoCount).length} estado{Object.keys(stats.estadoCount).length !== 1 ? "s" : ""}
              </div>
            )}
            {stats.topEstados.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Principal: {stats.topEstados[0][0]}
              </div>
            )}
          </div>
        )}

        {/* Farm Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Leaf className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {clientes.length === 0
                ? "Nenhuma fazenda cadastrada. Comece adicionando sua primeira fazenda!"
                : "Nenhum resultado para os filtros aplicados."}
            </p>
            {clientes.length === 0 && (
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Criar Fazenda
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedClientes.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="group relative bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-lg cursor-pointer transition-all duration-200 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                >
                  {/* Cover Photo */}
                  <div className="h-28 w-full bg-muted relative overflow-hidden">
                    {c.foto_url ? (
                      <img
                        src={getFotoPublicUrl(c.foto_url)}
                        alt={c.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/5 to-muted flex items-center justify-center">
                        <Leaf className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {/* Shared badge overlay */}
                    {c.farmRole === "editor" && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-[10px] gap-1 bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-sm">
                          <Share2 className="h-2.5 w-2.5" /> Compartilhada
                        </Badge>
                      </div>
                    )}
                    {/* Actions overlay — only for consultors */}
                    {role !== "cliente" && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.farmRole !== "editor" && (
                            <>
                              <DropdownMenuItem onClick={(e) => openEdit(c, e as any)} className="gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => openDelete(c, e as any)} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                          {c.farmRole === "editor" && (
                            <DropdownMenuItem onClick={(e) => handleLeaveFarm(c, e as any)} className="gap-2 text-destructive focus:text-destructive">
                              <DoorOpen className="h-3.5 w-3.5" /> Sair da fazenda
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>}
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-foreground truncate">{c.nome}</h3>
                    {c.documento && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.documento}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {c.estado && (
                        <Badge variant="secondary" className="text-[10px] gap-1 font-medium h-5">
                          <MapPin className="h-2.5 w-2.5" /> {c.estado}
                        </Badge>
                      )}
                      {c.regional && (
                        <Badge variant="outline" className="text-[10px] font-medium h-5 text-muted-foreground">
                          {c.regional}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, filteredClientes.length)} de {filteredClientes.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={page === i ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {/* News Section — Experimental (hidden for now)
        <section className="mt-8 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Notícias do Agro</h2>
            <Badge variant="outline" className="text-[9px] font-medium gap-1 h-4 px-1.5 text-muted-foreground border-dashed">
              <FlaskConical className="h-2.5 w-2.5" /> Experimental
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {NOTICIAS_AGRO.map((n, idx) => (
              <a
                key={idx}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/news bg-card rounded-lg border border-border hover:border-primary/30 p-3.5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[9px] font-medium h-4 px-1.5">
                    {n.tag}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{n.data}</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover/news:text-primary transition-colors line-clamp-2 leading-relaxed">
                  {n.titulo}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {n.resumo}
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
                  {n.fonte}
                  <ExternalLink className="h-2.5 w-2.5" />
                </div>
              </a>
            ))}
          </div>
        </section>
        */}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Fazenda</DialogTitle>
          </DialogHeader>
          {editCliente && (
            <form onSubmit={handleEdit} className="space-y-4">
              {/* Photo */}
              <div
                className={`relative h-32 rounded-xl overflow-hidden cursor-pointer group/edit ${editFoto || editCliente.foto_url ? "" : placeholderBg} border-2 border-dashed border-border hover:border-primary/50 transition-colors`}
                onClick={() => editFileRef.current?.click()}
              >
                {editFoto ? (
                  <img src={URL.createObjectURL(editFoto)} alt="" className="w-full h-full object-cover" />
                ) : editCliente.foto_url ? (
                  <img src={getFotoPublicUrl(editCliente.foto_url)} alt="" className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover/edit:opacity-100 transition-opacity">
                  <ImagePlus className="h-6 w-6 text-foreground" />
                </div>
                {!editFoto && !editCliente.foto_url && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-6 w-6 mb-1" />
                    <span className="text-xs">Adicionar foto</span>
                  </div>
                )}
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setEditFoto(e.target.files?.[0] || null)} />
              </div>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editCliente.nome} onChange={(e) => setEditCliente({ ...editCliente, nome: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={editCliente.documento || ""} onChange={(e) => setEditCliente({ ...editCliente, documento: e.target.value || null })} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={editCliente.estado || ""} onValueChange={(v) => setEditCliente({ ...editCliente, estado: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Regional</Label>
                  <Select value={editCliente.regional || ""} onValueChange={(v) => setEditCliente({ ...editCliente, regional: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{regionais.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fazenda?</AlertDialogTitle>
            <AlertDialogDescription>
              A fazenda <strong>{deleteCliente?.nome}</strong> e todos os dados associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
