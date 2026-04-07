import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useCalcir } from "@/contexts/CalcirContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Loader2, X, Replace, Plus, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ════════ Target table definitions ════════

interface TargetField {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "boolean" | "select";
  options?: string[];
}

interface ImportTarget {
  id: string;
  label: string;
  description: string;
  fields: TargetField[];
}

const IMPORT_TARGETS: ImportTarget[] = [
  {
    id: "receitas",
    label: "Receitas",
    description: "Projeções e realizações de receitas agro",
    fields: [
      { key: "produto", label: "Produto", required: true, type: "text" },
      { key: "entidade", label: "Entidade (PJ/PF)", type: "text" },
      { key: "mes", label: "Mês", type: "text" },
      { key: "tipo", label: "Tipo (projecao/realizacao)", type: "text" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "valorUnit", label: "Valor Unitário", type: "number" },
      { key: "total", label: "Total", required: true, type: "number" },
      { key: "pisCofins", label: "PIS/COFINS (sim/não)", type: "boolean" },
      { key: "obs", label: "Observação", type: "text" },
    ],
  },
  {
    id: "despesas",
    label: "Despesas",
    description: "Despesas gerais da operação agrícola",
    fields: [
      { key: "descricao", label: "Descrição", required: true, type: "text" },
      { key: "realizado", label: "Realizado", type: "number" },
      { key: "aRealizar", label: "A Realizar", type: "number" },
      { key: "total", label: "Total", required: true, type: "number" },
      { key: "obs", label: "Observação", type: "text" },
    ],
  },
  {
    id: "rendimentos",
    label: "Rendimentos Particulares",
    description: "Rendimentos não rurais por parceiro (dividendos, aluguéis, etc.)",
    fields: [
      { key: "parceiro", label: "Parceiro (nome)", required: true, type: "text" },
      { key: "tipo", label: "Tipo de Rendimento", required: true, type: "select", options: ["dividendos", "alugueis", "proLabore", "rendAplicacoes", "rendProtegidos", "doacoes", "ganhoCapital"] },
      { key: "jan", label: "Jan", type: "number" },
      { key: "fev", label: "Fev", type: "number" },
      { key: "mar", label: "Mar", type: "number" },
      { key: "abr", label: "Abr", type: "number" },
      { key: "mai", label: "Mai", type: "number" },
      { key: "jun", label: "Jun", type: "number" },
      { key: "jul", label: "Jul", type: "number" },
      { key: "ago", label: "Ago", type: "number" },
      { key: "set", label: "Set", type: "number" },
      { key: "out", label: "Out", type: "number" },
      { key: "nov", label: "Nov", type: "number" },
      { key: "dez", label: "Dez", type: "number" },
    ],
  },
  {
    id: "retencoes",
    label: "Retenções Particulares",
    description: "IRRF e retenções por parceiro",
    fields: [
      { key: "parceiro", label: "Parceiro (nome)", required: true, type: "text" },
      { key: "tipo", label: "Tipo de Retenção", required: true, type: "select", options: ["irrfDividendos", "irrfAlugueis", "irrfProLabore", "irrfRendAplicacoes", "irrfOperacoesBolsa"] },
      { key: "jan", label: "Jan", type: "number" },
      { key: "fev", label: "Fev", type: "number" },
      { key: "mar", label: "Mar", type: "number" },
      { key: "abr", label: "Abr", type: "number" },
      { key: "mai", label: "Mai", type: "number" },
      { key: "jun", label: "Jun", type: "number" },
      { key: "jul", label: "Jul", type: "number" },
      { key: "ago", label: "Ago", type: "number" },
      { key: "set", label: "Set", type: "number" },
      { key: "out", label: "Out", type: "number" },
      { key: "nov", label: "Nov", type: "number" },
      { key: "dez", label: "Dez", type: "number" },
    ],
  },
];

type ConflictMode = "replace" | "append";

const MESES_KEYS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// ════════ Component ════════

export default function ImportData() {
  const { state, dispatch, clienteId, analiseId, analiseBasePadraoId, setAnaliseId } = useCalcir();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0=target, 1=upload, 2=map, 3=preview, 4=confirm
  const [targetId, setTargetId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // targetKey -> sourceHeader
  const [conflictMode, setConflictMode] = useState<ConflictMode>("append");
  const [importing, setImporting] = useState(false);

  const target = IMPORT_TARGETS.find((t) => t.id === targetId);

  // ── Step 0: Select target
  const handleTargetSelect = (id: string) => {
    setTargetId(id);
    setStep(1);
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  // ── Step 1: Upload file
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        if (json.length === 0) {
          toast({ title: "Arquivo vazio", description: "O arquivo não contém dados.", variant: "destructive" });
          return;
        }

        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json);

        // Auto-map by fuzzy match
        if (target) {
          const autoMap: Record<string, string> = {};
          for (const field of target.fields) {
            const match = hdrs.find((h) => {
              const hLower = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const fLower = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const kLower = field.key.toLowerCase();
              return hLower === fLower || hLower === kLower || hLower.includes(kLower) || kLower.includes(hLower);
            });
            if (match) autoMap[field.key] = match;
          }
          setMapping(autoMap);
        }

        setStep(2);
      } catch {
        toast({ title: "Erro ao ler arquivo", description: "Verifique se o arquivo é um CSV ou XLSX válido.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [target, toast]);

  // ── Step 2→3: Validate mapping
  const handleConfirmMapping = () => {
    if (!target) return;
    const missingRequired = target.fields.filter((f) => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      toast({
        title: "Campos obrigatórios não mapeados",
        description: missingRequired.map((f) => f.label).join(", "),
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  };

  // ── Map raw row → target schema
  const mapRow = (raw: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    if (!target) return result;
    for (const field of target.fields) {
      const sourceCol = mapping[field.key];
      if (!sourceCol) continue;
      let val = raw[sourceCol];
      if (field.type === "number") {
        val = typeof val === "string" ? parseFloat(val.replace(/[^\d.,-]/g, "").replace(",", ".")) : Number(val);
        if (isNaN(val)) val = 0;
      } else if (field.type === "boolean") {
        val = typeof val === "string" ? ["sim", "s", "true", "1", "yes"].includes(val.toLowerCase().trim()) : !!val;
      } else {
        val = String(val ?? "").trim();
      }
      result[field.key] = val;
    }
    return result;
  };

  const mappedPreview = rows.slice(0, 10).map(mapRow);

  // ── Step 4: Import data
  const handleImport = async () => {
    if (!target || !clienteId) return;

    if (analiseBasePadraoId && analiseId !== analiseBasePadraoId) {
      setAnaliseId(analiseBasePadraoId);
      toast({
        title: "Importação na base padrão",
        description: "A análise ativa foi alterada para a Base Padrão. Revise e clique em importar novamente.",
      });
      return;
    }

    setImporting(true);

    try {
      const allMapped = rows.map(mapRow);

      if (targetId === "receitas") {
        const newReceitas = allMapped.map((r) => ({
          id: crypto.randomUUID(),
          produto: r.produto || "",
          obs: r.obs || "",
          entidade: (r.entidade === "PF" ? "PF" : "PJ") as "PJ" | "PF",
          pisCofins: !!r.pisCofins,
          funruralNaoIncidente: !!r.funruralNaoIncidente,
          estoque: r.estoque || 0,
          mes: r.mes || "Jan",
          quantidade: r.quantidade || 0,
          valorUnit: r.valorUnit || 0,
          total: r.total || 0,
        }));
        const tipo = allMapped[0]?.tipo?.toLowerCase?.()?.includes("realiz") ? "realizacao" : "projecao";
        if (conflictMode === "replace") {
          if (tipo === "realizacao") {
            dispatch({ type: "SET_STATE", payload: { receitasRealizacoes: newReceitas } });
          } else {
            dispatch({ type: "SET_STATE", payload: { receitasProjecoes: newReceitas } });
          }
        } else {
          for (const r of newReceitas) {
            dispatch({ type: tipo === "realizacao" ? "ADD_RECEITA_REALIZACAO" : "ADD_RECEITA_PROJECAO", payload: r });
          }
        }
      } else if (targetId === "despesas") {
        const newDespesas = allMapped.map((r) => ({
          id: crypto.randomUUID(),
          descricao: r.descricao || "",
          obs: r.obs || "",
          entidade: (r.entidade || "PJ") as "PF" | "PJ",
          totalAnoAnterior: r.totalAnoAnterior || 0,
          realizado: r.realizado || 0,
          aRealizar: r.aRealizar || 0,
          total: r.total || 0,
          estoque: r.estoque || 0,
          creditoIBSCBS: (r.creditoIBSCBS || "sem_credito") as "cheia" | "reducao60" | "diesel" | "simples_nacional" | "sem_credito",
        }));
        if (conflictMode === "replace") {
          dispatch({ type: "SET_STATE", payload: { despesas: newDespesas } });
        } else {
          for (const d of newDespesas) {
            dispatch({ type: "ADD_DESPESA", payload: d });
          }
        }
      } else if (targetId === "rendimentos") {
        importMonthlyData(allMapped, "rendimentos");
      } else if (targetId === "retencoes") {
        importMonthlyData(allMapped, "retencoes");
      }

      toast({ title: "Importação concluída!", description: `${rows.length} registro(s) importado(s) com sucesso.` });
      resetWizard();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    }
    setImporting(false);
  };

  const importMonthlyData = (allMapped: Record<string, any>[], type: "rendimentos" | "retencoes") => {
    // Group by parceiro
    const byParceiro: Record<string, Record<string, any>[]> = {};
    for (const row of allMapped) {
      const nome = row.parceiro || "";
      if (!byParceiro[nome]) byParceiro[nome] = [];
      byParceiro[nome].push(row);
    }

    for (const [parceiroNome, parceiroRows] of Object.entries(byParceiro)) {
      const parceiro = state.parceiros.find((p) => p.nome.toLowerCase() === parceiroNome.toLowerCase());
      if (!parceiro) {
        toast({
          title: `Parceiro "${parceiroNome}" não encontrado`,
          description: "Cadastre o parceiro no Quadro Societário antes de importar.",
          variant: "destructive",
        });
        continue;
      }

      if (type === "rendimentos") {
        const existing = state.rendimentosParticulares.find((r) => r.parceiroId === parceiro.id);
        if (!existing) continue;
        const updated = { ...existing };
        for (const row of parceiroRows) {
          const tipoField = row.tipo as string;
          if (tipoField && tipoField in updated) {
            const arr = [...(updated as any)[tipoField]];
            MESES_KEYS.forEach((m, i) => {
              if (row[m] !== undefined && row[m] !== 0) {
                arr[i] = conflictMode === "replace" ? row[m] : arr[i] + row[m];
              }
            });
            (updated as any)[tipoField] = arr;
          }
        }
        dispatch({ type: "UPDATE_RENDIMENTOS_PARTICULARES", payload: updated });
      } else {
        const existing = state.retencoesParticulares.find((r) => r.parceiroId === parceiro.id);
        if (!existing) continue;
        const updated = { ...existing };
        for (const row of parceiroRows) {
          const tipoField = row.tipo as string;
          if (tipoField && tipoField in updated) {
            const arr = [...(updated as any)[tipoField]];
            MESES_KEYS.forEach((m, i) => {
              if (row[m] !== undefined && row[m] !== 0) {
                arr[i] = conflictMode === "replace" ? row[m] : arr[i] + row[m];
              }
            });
            (updated as any)[tipoField] = arr;
          }
        }
        dispatch({ type: "UPDATE_RETENCOES_PARTICULARES", payload: updated });
      }
    }
  };

  const resetWizard = () => {
    setStep(0);
    setTargetId(null);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  // ════════ Render ════════

  const steps = ["Destino", "Arquivo", "Mapear Colunas", "Prévia", "Importar"];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-1 text-xs overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all font-medium",
                i === step
                  ? "bg-primary text-primary-foreground border-primary"
                  : i < step
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : null}
              {s}
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select target */}
      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {IMPORT_TARGETS.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              onClick={() => handleTargetSelect(t.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {t.label}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
                <CardDescription className="text-xs">{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {t.fields.slice(0, 5).map((f) => (
                    <Badge key={f.key} variant={f.required ? "default" : "outline"} className="text-[10px]">
                      {f.label}
                    </Badge>
                  ))}
                  {t.fields.length > 5 && (
                    <Badge variant="outline" className="text-[10px]">+{t.fields.length - 5}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 1: Upload file */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload de Arquivo — {target?.label}
            </CardTitle>
            <CardDescription>Selecione um arquivo CSV ou XLSX para importar</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, XLSX ou XLS (máx. 20MB)</p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <div className="flex justify-start mt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(0)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map columns */}
      {step === 2 && target && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapear Colunas</CardTitle>
            <CardDescription>
              Arquivo: <strong>{fileName}</strong> — {rows.length} linhas, {headers.length} colunas detectadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {target.fields.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-1/3 min-w-[140px]">
                    <Label className="text-sm flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={mapping[field.key] || "_none_"}
                      onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v === "_none_" ? "" : v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="— Não mapear —" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="_none_">— Não mapear —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {mapping[field.key] && mapping[field.key] !== "" && (
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/5 text-primary border-primary/30">
                      Mapeado
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button size="sm" onClick={handleConfirmMapping} className="gap-1.5">
                Prévia <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 3 && target && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prévia dos Dados</CardTitle>
            <CardDescription>
              Mostrando {Math.min(10, rows.length)} de {rows.length} registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    {target.fields
                      .filter((f) => mapping[f.key])
                      .map((f) => (
                        <TableHead key={f.key} className="text-xs font-semibold whitespace-nowrap">{f.label}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedPreview.map((row, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      {target.fields
                        .filter((f) => mapping[f.key])
                        .map((f) => (
                          <TableCell key={f.key} className="text-xs tabular-nums whitespace-nowrap">
                            {f.type === "boolean" ? (row[f.key] ? "Sim" : "Não") :
                             f.type === "number" ? Number(row[f.key]).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) :
                             String(row[f.key] || "—")}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-4 border-t mt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button size="sm" onClick={() => setStep(4)} className="gap-1.5">
                Continuar <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Conflict mode + Confirm */}
      {step === 4 && target && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmar Importação</CardTitle>
            <CardDescription>
              {rows.length} registro(s) serão importados para <strong>{target.label}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Como lidar com dados existentes?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setConflictMode("replace")}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                    conflictMode === "replace"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Replace className={cn("h-5 w-5 mt-0.5 shrink-0", conflictMode === "replace" ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-sm">Substituir tudo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Remove os dados existentes e insere os novos</p>
                  </div>
                </button>
                <button
                  onClick={() => setConflictMode("append")}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                    conflictMode === "append"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Plus className={cn("h-5 w-5 mt-0.5 shrink-0", conflictMode === "append" ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-sm">Adicionar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Mantém os dados existentes e adiciona os novos</p>
                  </div>
                </button>
              </div>
            </div>

            {conflictMode === "replace" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Atenção: esta ação irá <strong>remover todos os dados atuais</strong> de {target.label} e substituir pelos dados do arquivo.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setStep(3)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                className="gap-1.5 gradient-primary text-primary-foreground"
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {importing ? "Importando..." : `Importar ${rows.length} registros`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
