import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCalcir } from "@/contexts/CalcirContext";
import { removeIntegration } from "@/services/supabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Loader2, UserPlus, Users, Link2, User, FileUp, Trash2, Construction } from "lucide-react";
import ImportData from "@/components/ImportData";
import IntegrationSelector, { type SourceSystem } from "@/components/configuracoes/IntegrationSelector";
import ConnectereSync from "@/components/configuracoes/ConnectereSync";
import AegroSync from "@/components/configuracoes/AegroSync";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClienteUser {
  id: string;
  user_id: string;
  profiles: { nome: string; email: string | null } | null;
}

export default function Configuracoes() {
  const { clienteId } = useCalcir();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "usuarios";
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clienteUsers, setClienteUsers] = useState<ClienteUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNome, setNewNome] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<ClienteUser | null>(null);

  const setTab = (tab: string) => setSearchParams({ tab });

  const loadIntegration = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    const { data } = await supabase.from("client_integrations").select("*").eq("cliente_id", clienteId).maybeSingle();
    setIntegration(data);
    setLoading(false);
  }, [clienteId]);

  const loadClienteUsers = useCallback(async () => {
    if (!clienteId) return;
    setLoadingUsers(true);
    const { data: links } = await supabase.from("cliente_users").select("id, user_id").eq("cliente_id", clienteId);
    if (!links || links.length === 0) {
      setClienteUsers([]);
      setLoadingUsers(false);
      return;
    }
    const userIds = links.map((l) => l.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, nome, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    setClienteUsers(links.map((l) => ({ id: l.id, user_id: l.user_id, profiles: profileMap.get(l.user_id) || null })));
    setLoadingUsers(false);
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) {
      setLoading(false);
      return;
    }
    loadIntegration();
    loadClienteUsers();
  }, [clienteId, loadIntegration, loadClienteUsers]);

  const handleSelectSystem = async (system: SourceSystem) => {
    if (!clienteId) return;
    if (integration && integration.source_system !== system) await removeIntegration(clienteId);
    const { data } = await supabase
      .from("client_integrations")
      .upsert({ cliente_id: clienteId, source_system: system, source_token: "", active: true }, { onConflict: "cliente_id" })
      .select()
      .single();
    setIntegration(data);
  };

  const handleDisconnect = async () => {
    if (!clienteId) return;
    await removeIntegration(clienteId);
    setIntegration(null);
    toast({ title: "Integração removida" });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;

    // Bloquear e-mails corporativos Safras & Cifras
    const emailNorm = newEmail.trim().toLowerCase();
    if (emailNorm.endsWith("@safrasecifras.com.br")) {
      toast({
        title: "E-mail não permitido",
        description: "Colaboradores Safras & Cifras não podem ser cadastrados como clientes. Eles acessam o sistema como consultores.",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client-user", {
        body: { email: newEmail, password: newPassword, nome: newNome, cliente_id: clienteId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário criado!", description: `Acesso criado para ${newEmail}` });
      setNewEmail("");
      setNewPassword("");
      setNewNome("");
      setDialogOpen(false);
      loadClienteUsers();
    } catch (err: any) {
      let description = err?.message || "Falha ao criar usuário";

      if (err?.context instanceof Response) {
        try {
          const payload = await err.context.json();
          if (typeof payload?.error === "string" && payload.error) {
            description = payload.error;
          }
        } catch {
          // Mantem a mensagem padrao quando a resposta nao vem em JSON.
        }
      }

      toast({ title: "Erro ao criar usuário", description, variant: "destructive" });
    }
    setCreatingUser(false);
  };

  const handleDeleteUserAccess = async () => {
    if (!clienteId || !userToDelete) return;

    setDeletingUserId(userToDelete.id);
    try {
      const { error } = await supabase
        .from("cliente_users")
        .delete()
        .eq("id", userToDelete.id)
        .eq("cliente_id", clienteId);

      if (error) throw error;

      toast({
        title: "Acesso removido",
        description: `O acesso de ${userToDelete.profiles?.email || "usuário"} foi removido deste cliente.`,
      });
      setUserToDelete(null);
      loadClienteUsers();
    } catch (err: any) {
      toast({
        title: "Erro ao remover acesso",
        description: err?.message || "Nao foi possivel remover o acesso deste usuario.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clienteId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Settings className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-lg font-semibold">Nenhum cliente selecionado</p>
          <p className="text-sm text-muted-foreground mt-1">Selecione um cliente na tela inicial.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/clientes"} className="gap-2 rounded-xl">
          <Users className="h-4 w-4" />
          Selecionar Cliente
        </Button>
      </div>
    );
  }

  const currentSystem = integration?.source_system as SourceSystem | null;

  return (
    <div className="space-y-5">
      <div className="section-header animate-fade-in">
        <div className="section-icon">
          <Settings />
        </div>
        <div>
          <h1>Configurações</h1>
          <p>Gerencie usuários e integrações</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-5">
        <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 p-1.5 bg-muted/50 rounded-2xl border border-border/50">
          <TabsTrigger value="usuarios" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-card transition-all text-sm font-semibold gap-2">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="importacao" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-card transition-all text-sm font-semibold gap-2">
            <FileUp className="h-4 w-4" /> Importação
          </TabsTrigger>
          <TabsTrigger value="integracao" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-card transition-all text-sm font-semibold gap-2">
            <Link2 className="h-4 w-4" /> Integração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="metric-pill animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="metric-label">Usuários Vinculados</span>
                <Users className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <span className="metric-value">{clienteUsers.length}</span>
              <span className="metric-sub">Com acesso a este cliente</span>
            </div>

            <div className="metric-pill animate-fade-in flex items-center justify-center !min-h-0" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full gradient-primary text-primary-foreground hover:opacity-90 rounded-xl h-12">
                    <UserPlus className="h-5 w-5" /> Criar Novo Acesso
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" /> Criar Acesso para Cliente
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nome</Label>
                      <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Nome do usuário" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Senha</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="h-11 rounded-xl" />
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground rounded-xl" disabled={creatingUser}>
                      {creatingUser && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Criar Usuário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="data-panel animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
            <div className="data-panel-header">
              <h3>Usuários com Acesso</h3>
            </div>
            <div className="p-4">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : clienteUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Users className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-semibold">Nenhum usuário vinculado</p>
                  <p className="text-xs text-muted-foreground mt-1">Crie um acesso para o cliente visualizar dados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clienteUsers.map((cu) => (
                    <div key={cu.id} className="flex items-center gap-3 p-3 rounded-2xl bg-background/60 border border-border/40 hover:bg-muted/30 transition-colors">
                      <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                        {(cu.profiles?.nome || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{cu.profiles?.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground truncate">{cu.profiles?.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 rounded-full">
                        <User className="h-3 w-3 mr-1" /> Cliente
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setUserToDelete(cu)}
                        disabled={deletingUserId === cu.id}
                      >
                        {deletingUserId === cu.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="importacao" className="space-y-5">
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
              <Construction className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">Importação em desenvolvimento</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Esta funcionalidade ainda está sendo desenvolvida e estará disponível em breve.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integracao" className="space-y-5">
          <IntegrationSelector currentSystem={currentSystem || null} onSelect={handleSelectSystem} onDisconnect={handleDisconnect} />
          {currentSystem === "connectere" && (
            <ConnectereSync
              clienteId={clienteId}
              integrationId={integration?.id || null}
              token={integration?.source_token || ""}
              lastSync={integration?.last_sync_at || null}
              onTokenSaved={loadIntegration}
            />
          )}
          {currentSystem === "aegro" && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Construction className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-semibold">Integração Aegro em desenvolvimento</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">A conexão com o Aegro ainda está sendo desenvolvida e estará disponível em breve.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !deletingUserId && setUserToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir acesso do usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Isso remove o vínculo de ${userToDelete?.profiles?.email || "este usuário"} com este cliente. A conta continuará existindo se estiver vinculada a outras fazendas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingUserId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUserAccess}
              disabled={!!deletingUserId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUserId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
