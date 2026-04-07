import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncConnectereStart, syncConnectereCheck } from "@/services/supabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Link2, Clock, Database, ShieldCheck, XCircle, RotateCw,
} from "lucide-react";

const MODULES = [
  { id: "Comercial", label: "Comercial", icon: Database, description: "Notas fiscais, vendas e movimentações comerciais" },
  { id: "Contabil", label: "Contábil", icon: ShieldCheck, description: "Lançamentos contábeis e balanço patrimonial" },
  { id: "Financeiro_Quitacoes", label: "Financeiro - Quitações", icon: CheckCircle2, description: "Pagamentos, quitações e baixas financeiras" },
  { id: "Financeiro_Emprestimos_e_Financiamentos", label: "Financeiro - Empréstimos", icon: Clock, description: "Empréstimos, financiamentos e parcelas" },
];

type ModuleStatus = "idle" | "queued" | "starting" | "waiting" | "processing" | "downloading" | "success" | "error" | "timeout" | "cancelled";

interface ModuleState {
  id: string;
  label: string;
  status: ModuleStatus;
  records?: number;
  error?: string;
  situacao?: string;
  attempt?: number;
}

const MAX_CHECK_ATTEMPTS = 120;
const CHECK_INTERVAL = 5000;

const statusLabels: Record<ModuleStatus, string> = {
  idle: "Aguardando", queued: "Na fila", starting: "Iniciando...",
  waiting: "Aguardando processamento", processing: "Em processamento",
  downloading: "Baixando dados...", success: "Concluído", error: "Erro", timeout: "Tempo esgotado", cancelled: "Cancelado",
};

const statusColors: Record<ModuleStatus, string> = {
  idle: "text-muted-foreground", queued: "text-muted-foreground", starting: "text-accent",
  waiting: "text-accent", processing: "text-accent", downloading: "text-primary",
  success: "text-green-600", error: "text-destructive", timeout: "text-orange-500", cancelled: "text-muted-foreground",
};

interface Props {
  clienteId: string;
  integrationId: string | null;
  token: string;
  lastSync: string | null;
  onTokenSaved: () => void;
}

export default function ConnectereSync({ clienteId, integrationId, token: initialToken, lastSync, onTokenSaved }: Props) {
  const { toast } = useToast();
  const [token, setToken] = useState(initialToken);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(MODULES.map((m) => m.id));
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [moduleStates, setModuleStates] = useState<ModuleState[]>([]);
  const cancelRequestedRef = useRef(false);

  useEffect(() => { setToken(initialToken); }, [initialToken]);

  const handleSave = async () => {
    setSaving(true);
    if (integrationId) {
      await supabase.from("client_integrations").update({ source_token: token }).eq("id", integrationId);
    } else {
      await supabase.from("client_integrations")
        .upsert({ cliente_id: clienteId, source_token: token, source_system: "connectere", active: true }, { onConflict: "cliente_id" })
        .select().single();
    }
    toast({ title: "Token salvo!" });
    onTokenSaved();
    setSaving(false);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleCancelSync = () => {
    cancelRequestedRef.current = true;
    toast({ title: "Cancelando sincronização..." });
  };

  const handleSync = async () => {
    if (selectedModules.length === 0) {
      toast({ title: "Selecione ao menos um módulo", variant: "destructive" });
      return;
    }

    cancelRequestedRef.current = false;
    setSyncing(true);
    const initial: ModuleState[] = selectedModules.map((id) => ({
      id, label: MODULES.find((m) => m.id === id)?.label || id, status: "queued",
    }));
    setModuleStates(initial);
    const results = [...initial];
    const update = (idx: number, patch: Partial<ModuleState>) => {
      Object.assign(results[idx], patch);
      setModuleStates([...results]);
    };

    for (let i = 0; i < results.length; i++) {
      if (cancelRequestedRef.current) {
        for (let j = i; j < results.length; j++) {
          if (!["success", "error", "timeout", "cancelled"].includes(results[j].status)) {
            update(j, { status: "cancelled", error: "Sincronização cancelada pelo usuário" });
          }
        }
        break;
      }

      update(i, { status: "starting" });
      try {
        const startData = await syncConnectereStart(clienteId, results[i].id, {
          data_inicio: dataInicio || undefined, data_fim: dataFim || undefined,
        });
        if (!startData.url_situacao || !startData.url_download) {
          update(i, { status: "error", error: "Resposta inválida da API" });
          continue;
        }

        update(i, { status: "waiting", attempt: 0 });
        let done = false;
        for (let attempt = 0; attempt < MAX_CHECK_ATTEMPTS; attempt++) {
          if (cancelRequestedRef.current) {
            update(i, { status: "cancelled", error: "Sincronização cancelada pelo usuário" });
            done = true;
            break;
          }

          await sleep(CHECK_INTERVAL);
          update(i, { attempt: attempt + 1 });

          if (cancelRequestedRef.current) {
            update(i, { status: "cancelled", error: "Sincronização cancelada pelo usuário" });
            done = true;
            break;
          }

          try {
            const checkData = await syncConnectereCheck(clienteId, results[i].id, startData.url_situacao, startData.url_download);
            const sit = checkData.situacao || "";
            if (sit.includes("Processamento") || sit.includes("processamento")) update(i, { status: "processing", situacao: sit });
            else update(i, { situacao: sit });
            if (checkData.ready) {
              update(i, { status: "success", records: checkData.records });
              done = true;
              break;
            }
          } catch (err: any) {
            update(i, { status: "error", error: err.message });
            done = true;
            break;
          }
        }
        if (!done) update(i, { status: "timeout", error: `Tempo esgotado após ${MAX_CHECK_ATTEMPTS} tentativas` });
      } catch (err: any) {
        update(i, { status: "error", error: err.message });
      }
    }

    const successCount = results.filter((m) => m.status === "success").length;
    const errorCount = results.filter((m) => m.status === "error" || m.status === "timeout").length;
    const cancelledCount = results.filter((m) => m.status === "cancelled").length;
    toast({
      title: cancelledCount > 0
        ? "Sincronização cancelada"
        : errorCount === 0
          ? "Sincronização concluída!"
          : "Sincronização parcial",
      description: `${successCount} sucesso(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ""}${cancelledCount > 0 ? `, ${cancelledCount} cancelado(s)` : ""}`,
      variant: errorCount > 0 ? "destructive" : undefined,
    });
    onTokenSaved();
    cancelRequestedRef.current = false;
    setSyncing(false);
  };

  const retryModule = async (moduleId: string) => {
    const idx = moduleStates.findIndex((m) => m.id === moduleId);
    if (idx === -1) return;
    const results = [...moduleStates];
    const update = (patch: Partial<ModuleState>) => { Object.assign(results[idx], patch); setModuleStates([...results]); };
    cancelRequestedRef.current = false;
    setSyncing(true);
    update({ status: "starting", error: undefined, records: undefined });
    try {
      const startData = await syncConnectereStart(clienteId, moduleId, { data_inicio: dataInicio || undefined, data_fim: dataFim || undefined });
      if (!startData.url_situacao || !startData.url_download) { update({ status: "error", error: "Resposta inválida" }); setSyncing(false); return; }
      update({ status: "waiting", attempt: 0 });
      for (let attempt = 0; attempt < MAX_CHECK_ATTEMPTS; attempt++) {
        if (cancelRequestedRef.current) {
          update({ status: "cancelled", error: "Sincronização cancelada pelo usuário" });
          setSyncing(false);
          return;
        }
        await sleep(CHECK_INTERVAL);
        update({ attempt: attempt + 1 });
        try {
          const checkData = await syncConnectereCheck(clienteId, moduleId, startData.url_situacao, startData.url_download);
          const sit = checkData.situacao || "";
          if (sit.includes("Processamento")) update({ status: "processing", situacao: sit }); else update({ situacao: sit });
          if (checkData.ready) { update({ status: "success", records: checkData.records }); toast({ title: `${results[idx].label} sincronizado!` }); onTokenSaved(); setSyncing(false); return; }
        } catch (err: any) { update({ status: "error", error: err.message }); setSyncing(false); return; }
      }
      update({ status: "timeout", error: `Tempo esgotado após ${MAX_CHECK_ATTEMPTS} tentativas` });
    } catch (err: any) { update({ status: "error", error: err.message }); }
    setSyncing(false);
  };

  const toggleModule = (id: string) => setSelectedModules((p) => p.includes(id) ? p.filter((m) => m !== id) : [...p, id]);

  const totalModules = moduleStates.length;
  const completedModules = moduleStates.filter((m) => ["success", "error", "timeout", "cancelled"].includes(m.status)).length;
  const syncProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Connectere (+Gestão)
          </CardTitle>
          <CardDescription>Configure o token de acesso para sincronizar dados automaticamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Token de Acesso</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o token Connectere aqui" className="h-11 font-mono" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Token
            </Button>
            {lastSync && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última sync: {new Date(lastSync).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Módulos</CardTitle>
              <CardDescription>Selecione os módulos que deseja sincronizar</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setSelectedModules(MODULES.map((m) => m.id))} disabled={syncing}>Selecionar todos</Button>
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setSelectedModules([])} disabled={syncing}>Limpar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map((mod) => {
              const selected = selectedModules.includes(mod.id);
              const Icon = mod.icon;
              return (
                <button key={mod.id} type="button" disabled={syncing} onClick={() => toggleModule(mod.id)}
                  className={cn(
                    "relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-card hover:border-border",
                    syncing && "opacity-60 cursor-not-allowed"
                  )}>
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>{mod.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                  </div>
                  <div className={cn("absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", selected ? "border-primary bg-primary" : "border-border")}>
                    {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período</CardTitle>
          <CardDescription>Defina o intervalo de datas para a sincronização</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Data Início</Label>
              <Input value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} placeholder="01/01/2025" disabled={syncing} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Data Fim</Label>
              <Input value={dataFim} onChange={(e) => setDataFim(e.target.value)} placeholder="31/12/2025" disabled={syncing} className="h-11" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync button */}
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button onClick={handleSync} disabled={syncing || !integrationId || selectedModules.length === 0}
          className="w-full sm:w-auto h-12 gap-2 px-8 gradient-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-semibold">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sincronizar Agora
        </Button>
        {syncing && (
          <Button variant="outline" onClick={handleCancelSync} className="w-full sm:w-auto h-12">
            Cancelar sincronização
          </Button>
        )}
      </div>

      {/* Progress */}
      {moduleStates.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{syncing ? "Sincronização em andamento" : "Resultado da Sincronização"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedModules}/{totalModules} concluídos</span>
                <span className="font-semibold text-foreground">{syncProgress}%</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all duration-700 ease-out",
                  syncProgress === 100 ? (moduleStates.every((m) => m.status === "success") ? "bg-green-500" : "bg-orange-500") : "gradient-primary"
                )} style={{ width: `${syncing ? Math.max(syncProgress, 5) : syncProgress}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              {moduleStates.map((mod) => (
                <div key={mod.id} className={cn("flex items-center gap-3 p-3 rounded-lg transition-colors",
                  mod.status === "success" && "bg-green-50 dark:bg-green-950/20",
                  mod.status === "error" && "bg-red-50 dark:bg-red-950/20",
                  mod.status === "timeout" && "bg-orange-50 dark:bg-orange-950/20",
                  mod.status === "cancelled" && "bg-muted/60",
                  ["waiting", "processing", "downloading", "starting"].includes(mod.status) && "bg-accent/5",
                )}>
                  <div className="shrink-0">
                    {mod.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {mod.status === "error" && <XCircle className="h-5 w-5 text-destructive" />}
                    {mod.status === "timeout" && <Clock className="h-5 w-5 text-orange-500" />}
                    {mod.status === "cancelled" && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
                    {["waiting", "processing", "downloading", "starting"].includes(mod.status) && <Loader2 className="h-5 w-5 animate-spin text-accent" />}
                    {["idle", "queued"].includes(mod.status) && <div className="h-5 w-5 rounded-full border-2 border-border" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{mod.label}</span>
                      <span className={cn("text-xs", statusColors[mod.status])}>{statusLabels[mod.status]}</span>
                    </div>
                    {mod.status === "success" && mod.records !== undefined && <p className="text-xs text-muted-foreground mt-0.5">{mod.records.toLocaleString("pt-BR")} registros</p>}
                    {["waiting", "processing"].includes(mod.status) && mod.attempt !== undefined && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tentativa {mod.attempt}/{MAX_CHECK_ATTEMPTS}{mod.situacao ? ` · API: ${mod.situacao}` : ""}
                      </p>
                    )}
                    {(mod.status === "error" || mod.status === "timeout" || mod.status === "cancelled") && mod.error && <p className={cn("text-xs mt-0.5 truncate", mod.status === "cancelled" ? "text-muted-foreground" : "text-destructive")}>{mod.error}</p>}
                  </div>
                  {(mod.status === "error" || mod.status === "timeout") && !syncing && (
                    <Button size="sm" variant="ghost" className="shrink-0 gap-1 text-xs h-8" onClick={() => retryModule(mod.id)}>
                      <RotateCw className="h-3.5 w-3.5" /> Tentar novamente
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
