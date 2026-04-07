import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncAegroStart } from "@/services/supabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Loader2, RefreshCw, Clock, CheckCircle2, XCircle, Construction } from "lucide-react";

interface Props {
  clienteId: string;
  integrationId: string | null;
  token: string;
  lastSync: string | null;
  onTokenSaved: () => void;
}

export default function AegroSync({ clienteId, integrationId, token: initialToken, lastSync, onTokenSaved }: Props) {
  const { toast } = useToast();
  const [token, setToken] = useState(initialToken);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; records?: number } | null>(null);

  useEffect(() => { setToken(initialToken); }, [initialToken]);

  const handleSave = async () => {
    setSaving(true);
    if (integrationId) {
      await supabase.from("client_integrations").update({ source_token: token }).eq("id", integrationId);
    } else {
      await supabase.from("client_integrations")
        .upsert({ cliente_id: clienteId, source_token: token, source_system: "aegro", active: true }, { onConflict: "cliente_id" })
        .select().single();
    }
    toast({ title: "Token salvo!" });
    onTokenSaved();
    setSaving(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const data = await syncAegroStart(clienteId);
      setSyncResult({
        success: true,
        message: "Sincronização concluída!",
        records: data?.total_records || 0,
      });
      toast({ title: "Sincronização Aegro concluída!" });
      onTokenSaved();
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Erro na sincronização" });
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4 text-amber-800 dark:text-amber-300">
        <Construction className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Integração em desenvolvimento</p>
          <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">A conexão com o Aegro ainda está sendo desenvolvida. As funcionalidades abaixo podem não funcionar corretamente.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            Aegro
          </CardTitle>
          <CardDescription>Configure o token de acesso para sincronizar dados automaticamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Token de Acesso</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o token Aegro aqui" className="h-11 font-mono" />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sincronização</CardTitle>
          <CardDescription>Importa lançamentos financeiros (receitas e despesas) do Aegro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSync} disabled={syncing || !integrationId}
            className="w-full sm:w-auto h-12 gap-2 px-8 gradient-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-semibold">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar Agora
          </Button>

          {syncResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${syncResult.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
              {syncResult.success ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-destructive" />}
              <div>
                <p className="text-sm font-medium text-foreground">{syncResult.message}</p>
                {syncResult.records !== undefined && syncResult.success && (
                  <p className="text-xs text-muted-foreground">{syncResult.records} registros importados</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
