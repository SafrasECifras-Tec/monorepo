import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, Trash2, Crown, Pencil, Users } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  searchConsultorProfiles,
  getFarmCollaborators,
  addFarmCollaborator,
  removeFarmCollaborator,
  type FarmCollaborator,
} from "@/services/supabaseData";

interface ShareFarmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  isOwner: boolean;
}

export default function ShareFarmModal({ open, onOpenChange, clienteId, isOwner }: ShareFarmModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [collaborators, setCollaborators] = useState<FarmCollaborator[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; nome: string; email: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [collabToRemove, setCollabToRemove] = useState<FarmCollaborator | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCollaborators = useCallback(async () => {
    if (!clienteId) return;
    setLoadingCollabs(true);
    try {
      const data = await getFarmCollaborators(clienteId);
      setCollaborators(data);
    } catch {
      toast({ title: "Erro ao carregar colaboradores", variant: "destructive" });
    }
    setLoadingCollabs(false);
  }, [clienteId, toast]);

  useEffect(() => {
    if (open) {
      loadCollaborators();
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, loadCollaborators]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.trim().length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchConsultorProfiles(query.trim());
          const collabIds = new Set(collaborators.map((c) => c.consultor_id));
          setSearchResults(
            results.filter((r) => r.id !== user?.id && !collabIds.has(r.id)),
          );
        } catch {
          setSearchResults([]);
        }
        setSearching(false);
      }, 300);
    },
    [collaborators, user?.id],
  );

  const handleAdd = async (consultorId: string) => {
    setAddingId(consultorId);
    try {
      await addFarmCollaborator(clienteId, consultorId);
      const added = searchResults.find((r) => r.id === consultorId);
      toast({ title: "Colaborador adicionado!", description: `${added?.email || "Consultor"} agora tem acesso.` });
      setSearchResults((prev) => prev.filter((r) => r.id !== consultorId));
      await loadCollaborators();
    } catch (err: any) {
      toast({ title: "Erro ao adicionar", description: err?.message, variant: "destructive" });
    }
    setAddingId(null);
  };

  const handleRemove = async () => {
    if (!collabToRemove) return;
    setRemovingId(collabToRemove.id);
    try {
      await removeFarmCollaborator(collabToRemove.id);
      toast({
        title: "Acesso removido",
        description: `${collabToRemove.email || "Consultor"} não tem mais acesso.`,
      });
      setCollabToRemove(null);
      await loadCollaborators();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err?.message, variant: "destructive" });
    }
    setRemovingId(null);
  };

  // Sort: owner first, then alphabetically
  const sortedCollabs = [...collaborators].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;
    return (a.nome || a.email || "").localeCompare(b.nome || b.email || "");
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Compartilhar Fazenda
            </DialogTitle>
          </DialogHeader>

          {/* Search — only for owners */}
          {isOwner && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar consultor por email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              {/* Search results */}
              {searching && (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/40"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {(r.nome || r.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{r.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 rounded-xl gap-1.5 gradient-primary text-primary-foreground"
                        onClick={() => handleAdd(r.id)}
                        disabled={addingId === r.id}
                      >
                        {addingId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum consultor encontrado
                </p>
              )}
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-2 mt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
              Consultores com acesso
            </p>

            {loadingCollabs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sortedCollabs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum colaborador</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {sortedCollabs.map((c) => {
                  const isMe = c.consultor_id === user?.id;
                  const isCollabOwner = c.role === "owner";
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background/60 border border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0">
                        {(c.nome || c.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {c.nome || "Sem nome"}
                          {isMe && <span className="text-muted-foreground font-normal"> (Você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <Badge
                        variant={isCollabOwner ? "default" : "secondary"}
                        className="text-[10px] shrink-0 rounded-full gap-1"
                      >
                        {isCollabOwner ? (
                          <><Crown className="h-3 w-3" /> Dono</>
                        ) : (
                          <><Pencil className="h-3 w-3" /> Editor</>
                        )}
                      </Badge>
                      {isOwner && !isCollabOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setCollabToRemove(c)}
                          disabled={removingId === c.id}
                        >
                          {removingId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!collabToRemove} onOpenChange={(o) => !o && !removingId && setCollabToRemove(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${collabToRemove?.email || "Este consultor"} perderá o acesso a esta fazenda. Esta ação pode ser desfeita adicionando novamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={!!removingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
