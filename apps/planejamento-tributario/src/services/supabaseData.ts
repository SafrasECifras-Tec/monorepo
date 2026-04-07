import { supabase } from "@/integrations/supabase/client";
import type {
  CalcirState,
  Parceiro,
  ReceitaItem,
  DespesaItem,
  VendaImobilizado,
  ImobilizadoAquisicao,
  AtividadeRuralParticular,
  RendimentosParticulares,
  RetencoesParticulares,
} from "@/contexts/CalcirContext";

export type CalcirAnaliseTipo = "base" | "consolidada";

export interface CalcirAnalise {
  id: string;
  clienteId: string;
  nome: string;
  descricao: string | null;
  tipo: CalcirAnaliseTipo;
  status: "rascunho" | "fechada" | "arquivada";
  anoReferencia: number | null;
  regraDeduplicacao: "cpf_periodo_origem" | "cpf_global";
  isBasePadrao: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalcirAnaliseOrigem {
  analiseOrigemId: string;
  ordem: number;
  regraDeduplicacaoOverride: "cpf_periodo_origem" | "cpf_global" | null;
}

const BASE_PADRAO_NOME = "Base Principal";

const zeros12 = () => Array(12).fill(0) as number[];

function toNumArr(arr: unknown): number[] {
  if (!arr || !Array.isArray(arr)) return zeros12();
  return arr.map((v: unknown) => Number(v) || 0);
}

/** Fetch ALL ids from a table for a given client, paginating past Supabase's 1000-row default limit. */
async function fetchAllIds(table: string, clienteId: string, fkColumn = "cliente_id"): Promise<string[]> {
  const PAGE = 1000;
  const allIds: string[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("id")
      .eq(fkColumn, clienteId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) allIds.push(row.id);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return allIds;
}

export interface SaveClientDataOptions {
  persistVendasImobilizado?: boolean;
  persistImobilizadoAquisicao?: boolean;
}

/** Fetch all rows from a table, paginating past the 1000-row Supabase limit */
async function fetchAll(table: string, clienteId: string, fkColumn = "cliente_id") {

  const PAGE = 1000;
  let allRows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .eq(fkColumn, clienteId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return allRows;
}

function mapAnaliseRow(row: any): CalcirAnalise {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    nome: row.nome,
    descricao: row.descricao ?? null,
    tipo: row.tipo === "consolidada" ? "consolidada" : "base",
    status: row.status ?? "rascunho",
    anoReferencia: Number.isFinite(Number(row.ano_referencia)) ? Number(row.ano_referencia) : null,
    regraDeduplicacao: row.regra_deduplicacao === "cpf_global" ? "cpf_global" : "cpf_periodo_origem",
    isBasePadrao: !!row.is_base_padrao,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCalcirAnalises(clienteId: string): Promise<CalcirAnalise[]> {
  const { data, error } = await supabase
    .from("calcir_analises")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAnaliseRow);
}

export async function setAnaliseBasePadrao(clienteId: string, analiseId: string): Promise<void> {
  const { error: resetError } = await supabase
    .from("calcir_analises")
    .update({ is_base_padrao: false })
    .eq("cliente_id", clienteId);
  if (resetError) throw resetError;

  const { error: setError } = await supabase
    .from("calcir_analises")
    .update({ is_base_padrao: true })
    .eq("id", analiseId)
    .eq("cliente_id", clienteId);
  if (setError) throw setError;
}

export async function createCalcirAnalise(
  clienteId: string,
  input: {
    nome: string;
    tipo: CalcirAnaliseTipo;
    descricao?: string | null;
    anoReferencia?: number | null;
    regraDeduplicacao?: "cpf_periodo_origem" | "cpf_global";
    isBasePadrao?: boolean;
  },
): Promise<CalcirAnalise> {
  const payload = {
    cliente_id: clienteId,
    nome: input.nome,
    tipo: input.tipo,
    descricao: input.descricao ?? null,
    ano_referencia: input.anoReferencia ?? null,
    regra_deduplicacao: input.regraDeduplicacao ?? "cpf_periodo_origem",
    is_base_padrao: !!input.isBasePadrao,
  };

  const { data, error } = await supabase
    .from("calcir_analises")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  if (input.isBasePadrao) {
    await setAnaliseBasePadrao(clienteId, data.id);
    const { data: refreshed, error: refreshedError } = await supabase
      .from("calcir_analises")
      .select("*")
      .eq("id", data.id)
      .single();
    if (refreshedError) throw refreshedError;
    return mapAnaliseRow(refreshed);
  }

  return mapAnaliseRow(data);
}

export async function updateCalcirAnalise(
  clienteId: string,
  analiseId: string,
  updates: {
    nome?: string;
    descricao?: string | null;
    status?: "rascunho" | "fechada" | "arquivada";
    anoReferencia?: number | null;
    regraDeduplicacao?: "cpf_periodo_origem" | "cpf_global";
    isBasePadrao?: boolean;
  },
): Promise<CalcirAnalise> {
  const payload: any = {};
  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.descricao !== undefined) payload.descricao = updates.descricao;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.anoReferencia !== undefined) payload.ano_referencia = updates.anoReferencia;
  if (updates.regraDeduplicacao !== undefined) payload.regra_deduplicacao = updates.regraDeduplicacao;
  if (updates.isBasePadrao !== undefined) payload.is_base_padrao = updates.isBasePadrao;

  const { data, error } = await supabase
    .from("calcir_analises")
    .update(payload)
    .eq("id", analiseId)
    .eq("cliente_id", clienteId)
    .select("*")
    .single();
  if (error) throw error;

  if (updates.isBasePadrao) {
    await setAnaliseBasePadrao(clienteId, analiseId);
    const { data: refreshed, error: refreshedError } = await supabase
      .from("calcir_analises")
      .select("*")
      .eq("id", analiseId)
      .single();
    if (refreshedError) throw refreshedError;
    return mapAnaliseRow(refreshed);
  }

  return mapAnaliseRow(data);
}

export async function deleteCalcirAnalise(clienteId: string, analiseId: string): Promise<void> {
  const { error } = await supabase
    .from("calcir_analises")
    .delete()
    .eq("id", analiseId)
    .eq("cliente_id", clienteId);
  if (error) throw error;
}

export async function duplicateCalcirAnalise(
  clienteId: string,
  analiseId: string,
  options?: { nome?: string },
): Promise<CalcirAnalise> {
  const { data: source, error: sourceError } = await supabase
    .from("calcir_analises")
    .select("*")
    .eq("id", analiseId)
    .eq("cliente_id", clienteId)
    .single();
  if (sourceError) throw sourceError;

  const cloneName = options?.nome?.trim() || `${source.nome} (Cópia)`;

  const cloned = await createCalcirAnalise(clienteId, {
    nome: cloneName,
    tipo: source.tipo === "consolidada" ? "consolidada" : "base",
    descricao: source.descricao,
    anoReferencia: source.ano_referencia,
    regraDeduplicacao: source.regra_deduplicacao === "cpf_global" ? "cpf_global" : "cpf_periodo_origem",
    isBasePadrao: false,
  });

  const sourcePayload = await loadCalcirAnalisePayload(clienteId, analiseId);
  if (sourcePayload) {
    await saveCalcirAnalisePayload(clienteId, cloned.id, sourcePayload);
  }

  if (source.tipo === "consolidada") {
    const sourceOrigens = await listCalcirAnaliseOrigens(analiseId);
    if (sourceOrigens.length > 0) {
      await saveCalcirAnaliseOrigens(cloned.id, sourceOrigens);
    }
  }

  return cloned;
}

export async function ensureCalcirBasePadrao(clienteId: string): Promise<{ analises: CalcirAnalise[]; basePadraoId: string }> {
  let analises = await listCalcirAnalises(clienteId);

  if (analises.length === 0) {
    const created = await createCalcirAnalise(clienteId, {
      nome: BASE_PADRAO_NOME,
      tipo: "base",
      isBasePadrao: true,
    });
    return { analises: [created], basePadraoId: created.id };
  }

  const basePadrao = analises.find((a) => a.isBasePadrao);
  if (basePadrao) {
    return { analises, basePadraoId: basePadrao.id };
  }

  const firstBase = analises.find((a) => a.tipo === "base") ?? analises[0];
  await setAnaliseBasePadrao(clienteId, firstBase.id);
  analises = await listCalcirAnalises(clienteId);
  return { analises, basePadraoId: firstBase.id };
}

export async function listCalcirAnaliseOrigens(analiseConsolidadaId: string): Promise<CalcirAnaliseOrigem[]> {
  const { data, error } = await supabase
    .from("calcir_analise_origens")
    .select("analise_origem_id, ordem, regra_deduplicacao_override")
    .eq("analise_consolidada_id", analiseConsolidadaId)
    .order("ordem", { ascending: true });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    analiseOrigemId: row.analise_origem_id,
    ordem: Number(row.ordem) || 1,
    regraDeduplicacaoOverride: row.regra_deduplicacao_override ?? null,
  }));
}

export async function saveCalcirAnaliseOrigens(
  analiseConsolidadaId: string,
  origens: CalcirAnaliseOrigem[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("calcir_analise_origens")
    .delete()
    .eq("analise_consolidada_id", analiseConsolidadaId);
  if (deleteError) throw deleteError;

  if (origens.length === 0) return;

  const payload = origens.map((origem, index) => ({
    analise_consolidada_id: analiseConsolidadaId,
    analise_origem_id: origem.analiseOrigemId,
    ordem: origem.ordem || index + 1,
    regra_deduplicacao_override: origem.regraDeduplicacaoOverride ?? null,
  }));

  const { error: insertError } = await supabase.from("calcir_analise_origens").insert(payload);
  if (insertError) throw insertError;
}

export async function loadCalcirAnalisePayload(
  clienteId: string,
  analiseId: string,
): Promise<CalcirState | null> {
  const { data, error } = await supabase
    .from("calcir_analise_payloads")
    .select("payload")
    .eq("cliente_id", clienteId)
    .eq("analise_id", analiseId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload || typeof data.payload !== "object") return null;
  return data.payload as unknown as CalcirState;
}

export async function saveCalcirAnalisePayload(
  clienteId: string,
  analiseId: string,
  state: CalcirState,
): Promise<void> {
  const { error } = await supabase
    .from("calcir_analise_payloads")
    .upsert(
      [{
        cliente_id: clienteId,
        analise_id: analiseId,
        payload: state as any,
      }],
      { onConflict: "analise_id" },
    );
  if (error) throw error;
}

export interface CalcirReceitaEfetiva {
  source_id: string;
  is_override: boolean;
  row_version: number;
  id: string;
  cliente_id: string;
  tipo: string;
  produto: string;
  obs: string | null;
  entidade: string;
  pis_cofins: boolean;
  mes: string;
  quantidade: number;
  valor_unit: number;
  total: number;
  estoque: number | null;
  created_at: string;
  source_system: string | null;
  source_modulo: string | null;
  source_documento: string | null;
  source_row_hash: string | null;
}

export interface CalcirDespesaEfetiva {
  source_id: string;
  is_override: boolean;
  row_version: number;
  id: string;
  cliente_id: string;
  descricao: string;
  obs: string | null;
  total_ano_anterior: number;
  realizado: number;
  a_realizar: number;
  total: number;
  credito_ibs_cbs: string;
  estoque: number | null;
  created_at: string;
  source_system: string | null;
  source_modulo: string | null;
  source_documento: string | null;
  source_row_hash: string | null;
}

function normalizeCowError(error: any): never {
  const message = String(error?.message || "Erro no fluxo COW");
  if (message.includes("CALCIR_COW_VERSION_CONFLICT")) {
    const conflict = new Error("Conflito de versão no item. Recarregue os dados e tente novamente.");
    (conflict as any).code = "COW_VERSION_CONFLICT";
    throw conflict;
  }
  throw error;
}

export async function isCalcirCowEnabled(clienteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("config_cliente")
    .select("calcir_cow_enabled")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) throw error;
  return !!(data as any)?.calcir_cow_enabled;
}

export async function loadCalcirReceitasEfetivas(
  clienteId: string,
  analiseId: string,
): Promise<CalcirReceitaEfetiva[]> {
  const { data, error } = await (supabase as any).rpc("calcir_get_receitas_efetivas", {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
  });

  if (error) throw error;
  return (data || []) as CalcirReceitaEfetiva[];
}

export async function loadCalcirDespesasEfetivas(
  clienteId: string,
  analiseId: string,
): Promise<CalcirDespesaEfetiva[]> {
  const { data, error } = await (supabase as any).rpc("calcir_get_despesas_efetivas", {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
  });

  if (error) throw error;
  return (data || []) as CalcirDespesaEfetiva[];
}

export async function updateReceitaCOW(
  clienteId: string,
  analiseId: string,
  sourceId: string,
  patch: Partial<ReceitaItem>,
  expectedVersion?: number,
): Promise<{ source_id: string; row_version: number; is_override: boolean }> {
  const normalizedPatch: any = { ...patch };
  if ("pisCofins" in normalizedPatch && !("pis_cofins" in normalizedPatch)) {
    normalizedPatch.pis_cofins = normalizedPatch.pisCofins;
  }
  if ("funruralNaoIncidente" in normalizedPatch && !("funrural_nao_incidente" in normalizedPatch)) {
    normalizedPatch.funrural_nao_incidente = normalizedPatch.funruralNaoIncidente;
  }

  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_source_receita_id: sourceId,
    p_patch: normalizedPatch,
  };
  if (expectedVersion !== undefined) payload.p_expected_version = expectedVersion;

  const { data, error } = await (supabase as any).rpc("calcir_upsert_receita_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao atualizar override de receita.");
  }
  return row;
}

export async function createReceitaCOW(
  clienteId: string,
  analiseId: string,
  item: ReceitaItem,
  tipo: "projecao" | "realizado" = "projecao",
): Promise<{ source_id: string; row_version: number; is_override: boolean }> {
  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_item: {
      id: item.id,
      tipo,
      produto: item.produto,
      obs: item.obs,
      entidade: item.entidade,
      pisCofins: item.pisCofins,
      pis_cofins: item.pisCofins,
      funruralNaoIncidente: item.funruralNaoIncidente ?? false,
      funrural_nao_incidente: item.funruralNaoIncidente ?? false,
      mes: item.mes,
      quantidade: item.quantidade,
      valorUnit: item.valorUnit,
      total: item.total,
      estoque: item.estoque ?? 0,
    },
  };

  const { data, error } = await (supabase as any).rpc("calcir_create_receita_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao criar receita no cenário.");
  }
  return row;
}

export async function updateDespesaCOW(
  clienteId: string,
  analiseId: string,
  sourceId: string,
  patch: Partial<DespesaItem>,
  expectedVersion?: number,
): Promise<{ source_id: string; row_version: number; is_override: boolean }> {
  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_source_despesa_id: sourceId,
    p_patch: patch,
  };
  if (expectedVersion !== undefined) payload.p_expected_version = expectedVersion;

  const { data, error } = await (supabase as any).rpc("calcir_upsert_despesa_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao atualizar override de despesa.");
  }
  return row;
}

export async function createDespesaCOW(
  clienteId: string,
  analiseId: string,
  item: DespesaItem,
): Promise<{ source_id: string; row_version: number; is_override: boolean }> {
  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_item: {
      id: item.id,
      descricao: item.descricao,
      obs: item.obs,
      totalAnoAnterior: item.totalAnoAnterior,
      realizado: item.realizado,
      aRealizar: item.aRealizar,
      total: item.total,
      creditoIBSCBS: item.creditoIBSCBS,
      estoque: item.estoque ?? 0,
    },
  };

  const { data, error } = await (supabase as any).rpc("calcir_create_despesa_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao criar despesa no cenário.");
  }
  return row;
}

export async function softDeleteReceitaCOW(
  clienteId: string,
  analiseId: string,
  sourceId: string,
  expectedVersion?: number,
): Promise<{ source_id: string; row_version: number; is_deleted: boolean }> {
  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_source_receita_id: sourceId,
  };
  if (expectedVersion !== undefined) payload.p_expected_version = expectedVersion;

  const { data, error } = await (supabase as any).rpc("calcir_soft_delete_receita_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao excluir receita no cenário.");
  }
  return row;
}

export async function softDeleteDespesaCOW(
  clienteId: string,
  analiseId: string,
  sourceId: string,
  expectedVersion?: number,
): Promise<{ source_id: string; row_version: number; is_deleted: boolean }> {
  const payload: any = {
    p_cliente_id: clienteId,
    p_analise_id: analiseId,
    p_source_despesa_id: sourceId,
  };
  if (expectedVersion !== undefined) payload.p_expected_version = expectedVersion;

  const { data, error } = await (supabase as any).rpc("calcir_soft_delete_despesa_override", payload);
  if (error) normalizeCowError(error);

  const row = (data || [])[0];
  if (!row) {
    throw new Error("Falha ao excluir despesa no cenário.");
  }
  return row;
}

// ─── LOAD ───

export async function loadClientData(clienteId: string): Promise<CalcirState | null> {
  const [
    parceirosDb,
    receitasDb,
    despesasDb,
    vendasDb,
    imobDb,
    { data: configDb },
  ] = await Promise.all([
    fetchAll("parceiros", clienteId),
    fetchAll("receitas", clienteId),
    fetchAll("despesas", clienteId),
    fetchAll("vendas_imobilizado", clienteId),
    fetchAll("imobilizado_aquisicao", clienteId),
    supabase.from("config_cliente").select("*").eq("cliente_id", clienteId).maybeSingle(),
  ]);

  if (!parceirosDb) return null;

  const parceiroIds = parceirosDb.map((p: any) => p.id);

  const [
    { data: atividadeDb },
    { data: rendDb },
    { data: retDb },
  ] = await Promise.all([
    supabase.from("atividade_rural_particular").select("*").in("parceiro_id", parceiroIds),
    supabase.from("rendimentos_particulares").select("*").in("parceiro_id", parceiroIds),
    supabase.from("retencoes_particulares").select("*").in("parceiro_id", parceiroIds),
  ]);

  // Use Supabase UUIDs directly as IDs
  const parceiros: Parceiro[] = parceirosDb.map((p: any) => ({
    id: p.id,
    nome: p.nome,
    cpf: p.cpf || "",
    participacao: Number(p.perc_receitas) || 0,
  }));

  const mapReceita = (r: any): ReceitaItem => ({
    id: r.id,
    produto: r.produto || "",
    obs: r.obs || "",
    entidade: r.entidade === "PF" ? "PF" : "PJ",
    pisCofins: r.pis_cofins || false,
    funruralNaoIncidente: r.funrural_nao_incidente ?? false,
    mes: r.mes || "Jan",
    quantidade: Number(r.quantidade) || 0,
    valorUnit: Number(r.valor_unit) || 0,
    total: Number.isFinite(Number(r.total))
      ? Number(r.total)
      : (Number(r.quantidade) || 0) * (Number(r.valor_unit) || 0),
    estoque: Number(r.estoque) || 0,
  });

  const receitasProjecoes = (receitasDb || []).filter((r: any) => r.tipo === "projecao").map(mapReceita);
  const receitasRealizacoes = (receitasDb || []).filter((r: any) => r.tipo === "realizacao").map(mapReceita);

  const despesas: DespesaItem[] = (despesasDb || []).map((d: any) => ({
    id: d.id,
    descricao: d.descricao || "",
    obs: d.obs || "",
    entidade: d.entidade === "PF" ? "PF" : "PJ",
    totalAnoAnterior: Number(d.total_ano_anterior) || 0,
    realizado: Number(d.realizado) || 0,
    aRealizar: Number(d.a_realizar) || 0,
    total: (Number(d.realizado) || 0) + (Number(d.a_realizar) || 0),
    creditoIBSCBS: (["cheia", "reducao60", "diesel", "simples_nacional", "sem_credito"].includes(d.credito_ibs_cbs) ? d.credito_ibs_cbs : "sem_credito") as DespesaItem["creditoIBSCBS"],
    estoque: Number(d.estoque) || 0,
    quantidadeLitros: d.quantidade_litros != null ? Number(d.quantidade_litros) : undefined,
    percentualCreditoSN: d.percentual_credito_sn != null ? Number(d.percentual_credito_sn) : undefined,
  }));

  const vendasImobilizado: VendaImobilizado[] = (vendasDb || []).map((v: any) => ({
    id: v.id,
    descricao: v.descricao || "",
    entidade: v.entidade === "PF" ? "PF" as const : "PJ" as const,
    mes: v.mes || "Jan",
    realizado: Number(v.realizado) || 0,
    projetado: Number(v.projetado) || 0,
    total: Number(v.total) || 0,
  }));

  const imobilizadoAquisicao: ImobilizadoAquisicao[] = (imobDb || []).map((i: any) => ({
    id: i.id,
    descricao: i.descricao || "",
    entidade: i.entidade === "PF" ? "PF" as const : "PJ" as const,
    realizado: Number(i.realizado) || 0,
    aRealizar: Number(i.a_realizar) || 0,
    total: Number(i.total) || 0,
  }));

  const atividadeRuralParticular: AtividadeRuralParticular[] = parceiros.map(p => {
    const dbRow = (atividadeDb || []).find((a: any) => a.parceiro_id === p.id);
    return {
      parceiroId: p.id,
      receitas: dbRow ? toNumArr(dbRow.receitas) : zeros12(),
      despesas: dbRow ? toNumArr(dbRow.despesas) : zeros12(),
    };
  });

  const rendimentosParticulares: RendimentosParticulares[] = parceiros.map(p => {
    const dbRow = (rendDb || []).find((r: any) => r.parceiro_id === p.id);
    return {
      parceiroId: p.id,
      dividendos: dbRow ? toNumArr(dbRow.dividendos) : zeros12(),
      alugueis: dbRow ? toNumArr(dbRow.alugueis) : zeros12(),
      proLabore: dbRow ? toNumArr(dbRow.pro_labore) : zeros12(),
      rendAplicacoes: dbRow ? toNumArr(dbRow.rend_aplicacoes) : zeros12(),
      rendProtegidos: dbRow ? toNumArr(dbRow.rend_protegidos) : zeros12(),
      doacoes: dbRow ? toNumArr(dbRow.doacoes) : zeros12(),
      ganhoCapital: dbRow ? toNumArr(dbRow.ganho_capital) : zeros12(),
    };
  });

  const retencoesParticulares: RetencoesParticulares[] = parceiros.map(p => {
    const dbRow = (retDb || []).find((r: any) => r.parceiro_id === p.id);
    return {
      parceiroId: p.id,
      irrfDividendos: dbRow ? toNumArr(dbRow.irrf_dividendos) : zeros12(),
      irrfAlugueis: dbRow ? toNumArr(dbRow.irrf_alugueis) : zeros12(),
      irrfProLabore: dbRow ? toNumArr(dbRow.irrf_pro_labore) : zeros12(),
      irrfRendAplicacoes: dbRow ? toNumArr(dbRow.irrf_rend_aplicacoes) : zeros12(),
      irrfOperacoesBolsa: dbRow ? toNumArr(dbRow.irrf_operacoes_bolsa) : zeros12(),
    };
  });

  const config = configDb as any;
  const funruralRegime = config?.funrural_pj_regime === "folha" ? "folha" : "receita_bruta";
  const funruralAliquota = Number(config?.funrural_pj_aliquota);
  const folhaPagamentoPJ = Number(config?.folha_pagamento_pj);
  const contabilidadeRegular = Boolean(config?.contabilidade_regular);
  const lcdprLimite = Number(config?.lcdpr_limite);

  return {
    parceiros,
    receitasProjecoes,
    receitasRealizacoes,
    vendasImobilizado,
    despesas,
    imobilizadoAquisicao,
    atividadeRuralParticular,
    rendimentosParticulares,
    retencoesParticulares,
    demaisDespesasPJ: config ? Number(config.demais_despesas_pj) || 0 : 0,
    lucroAcumuladoPJ: config ? Number(config.lucro_acumulado_pj) || 0 : 0,
    funruralPJRegime: funruralRegime,
    funruralPJAliquota: Number.isFinite(funruralAliquota) && funruralAliquota > 0 ? funruralAliquota : 0.0223,
    folhaPagamentoPJ: Number.isFinite(folhaPagamentoPJ) ? folhaPagamentoPJ : 0,
    funruralPFRegime: (config?.funrural_pf_regime === "folha" ? "folha" : "receita_bruta") as "receita_bruta" | "folha",
    funruralPFAliquota: (() => { const v = Number(config?.funrural_pf_aliquota); return Number.isFinite(v) && v > 0 ? v : 0.0163; })(),
    folhaPagamentoPF: (() => { const v = Number(config?.folha_pagamento_pf); return Number.isFinite(v) ? v : 0; })(),
    contabilidadeRegular,
    lcdprLimite: Number.isFinite(lcdprLimite) && lcdprLimite > 0 ? lcdprLimite : 4800000,
    simulacaoDespesasPFPerc: null,
    aliquotaDieselPorLitro: Number(config?.aliquota_diesel_por_litro) || 0,
    prejuizosAnteriores: config?.prejuizos_anteriores
      ? Object.fromEntries(
          Object.entries(config.prejuizos_anteriores as Record<string, number>).map(([k, v]) => [k, Number(v)])
        )
      : {},
    lucrosIsentosAcumulados: config?.lucros_isentos_acumulados
      ? Object.fromEntries(
          Object.entries(config.lucros_isentos_acumulados as Record<string, number>).map(([k, v]) => [k, Number(v)])
        )
      : {},
    regimeApuracaoRural: config?.regime_apuracao_rural
      ? Object.fromEntries(
          Object.entries(config.regime_apuracao_rural as Record<string, string>).map(([k, v]) => {
            const valor = String(v);
            const regime = valor === "arbitramento" || valor === "resultado" || valor === "automatico" ? valor : "automatico";
            return [k, regime as "automatico" | "arbitramento" | "resultado"];
          })
        )
      : {},
  };
}

// ─── SAVE (upsert) ───

export async function saveClientData(
  clienteId: string,
  state: CalcirState,
  options: SaveClientDataOptions = {},
): Promise<void> {
  // 1. Upsert parceiros
  if (state.parceiros.length > 0) {
    const parceirosPayload = state.parceiros.map(p => ({
      id: p.id,
      cliente_id: clienteId,
      nome: p.nome,
      cpf: p.cpf || null,
      perc_receitas: p.participacao,
      perc_despesas: p.participacao,
    }));
    const { error } = await supabase.from("parceiros").upsert(parceirosPayload, { onConflict: "id" });
    if (error) console.error("Save parceiros error:", error);
  }

  // Delete parceiros that were removed
  const existingParceiroIds = await fetchAllIds("parceiros", clienteId);
  const currentIds = new Set(state.parceiros.map(p => p.id));
  const toDelete = existingParceiroIds.filter(id => !currentIds.has(id));
  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 500) {
      await supabase.from("parceiros").delete().in("id", toDelete.slice(i, i + 500));
    }
  }

  // 2. Upsert receitas (projecoes + realizacoes)
  const allReceitas = [
    ...state.receitasProjecoes.map(r => ({ ...r, tipo: "projecao" })),
    ...state.receitasRealizacoes.map(r => ({ ...r, tipo: "realizacao" })),
  ];
  if (allReceitas.length > 0) {
    const receitasPayload = allReceitas.map(r => ({
      id: r.id,
      cliente_id: clienteId,
      tipo: r.tipo,
      produto: r.produto,
      obs: r.obs || null,
      entidade: r.entidade,
      pis_cofins: r.pisCofins,
      funrural_nao_incidente: r.funruralNaoIncidente ?? false,
      mes: r.mes,
      quantidade: r.quantidade,
      valor_unit: r.valorUnit,
      total: r.total,
      estoque: r.estoque ?? 0,
    }));
    // Batch in chunks of 500
    for (let i = 0; i < receitasPayload.length; i += 500) {
      const chunk = receitasPayload.slice(i, i + 500);
      const { error } = await supabase.from("receitas").upsert(chunk, { onConflict: "id" });
      if (error) console.error("Save receitas error:", error);
    }
  }
  // Delete removed receitas
  const existingRecIds = await fetchAllIds("receitas", clienteId);
  const currentRecIds = new Set(allReceitas.map(r => r.id));
  const toDeleteRec = existingRecIds.filter(id => !currentRecIds.has(id));
  if (toDeleteRec.length > 0) {
    for (let i = 0; i < toDeleteRec.length; i += 500) {
      await supabase.from("receitas").delete().in("id", toDeleteRec.slice(i, i + 500));
    }
  }

  // 3. Upsert despesas
  if (state.despesas.length > 0) {
    const despesasPayload = state.despesas.map(d => ({
      id: d.id,
      cliente_id: clienteId,
      descricao: d.descricao,
      obs: d.obs || null,
      entidade: d.entidade === "PF" ? "PF" : "PJ",
      total_ano_anterior: d.totalAnoAnterior || 0,
      realizado: d.realizado,
      a_realizar: d.aRealizar,
      total: d.total,
      credito_ibs_cbs: d.creditoIBSCBS || "sem_credito",
      estoque: d.estoque ?? 0,
      quantidade_litros: d.quantidadeLitros ?? null,
      percentual_credito_sn: d.percentualCreditoSN ?? null,
    }));
    for (let i = 0; i < despesasPayload.length; i += 500) {
      const chunk = despesasPayload.slice(i, i + 500);
      const { error } = await supabase.from("despesas").upsert(chunk, { onConflict: "id" });
      if (error) console.error("Save despesas error:", error);
    }
  }
  const existingDespIds = await fetchAllIds("despesas", clienteId);
  const currentDespIds = new Set(state.despesas.map(d => d.id));
  const toDeleteDesp = existingDespIds.filter(id => !currentDespIds.has(id));
  if (toDeleteDesp.length > 0) {
    for (let i = 0; i < toDeleteDesp.length; i += 500) {
      await supabase.from("despesas").delete().in("id", toDeleteDesp.slice(i, i + 500));
    }
  }

  // 4. Upsert vendas_imobilizado
  if (options.persistVendasImobilizado !== false) {
    if (state.vendasImobilizado.length > 0) {
      const payload = state.vendasImobilizado.map(v => ({
        id: v.id,
        cliente_id: clienteId,
        descricao: v.descricao,
        entidade: v.entidade,
        mes: v.mes,
        realizado: v.realizado,
        projetado: v.projetado,
        total: v.total,
      }));
      const { error } = await supabase.from("vendas_imobilizado").upsert(payload, { onConflict: "id" });
      if (error) console.error("Save vendas_imobilizado error:", error);
    }
    const existingVendaIds = await fetchAllIds("vendas_imobilizado", clienteId);
    const currentVendaIds = new Set(state.vendasImobilizado.map(v => v.id));
    const toDeleteVendas = existingVendaIds.filter(id => !currentVendaIds.has(id));
    if (toDeleteVendas.length > 0) {
      for (let i = 0; i < toDeleteVendas.length; i += 500) {
        await supabase.from("vendas_imobilizado").delete().in("id", toDeleteVendas.slice(i, i + 500));
      }
    }
  }

  // 5. Upsert imobilizado_aquisicao
  if (options.persistImobilizadoAquisicao !== false) {
    if (state.imobilizadoAquisicao.length > 0) {
      const payload = state.imobilizadoAquisicao.map(i => ({
        id: i.id,
        cliente_id: clienteId,
        descricao: i.descricao,
        entidade: i.entidade,
        realizado: i.realizado,
        a_realizar: i.aRealizar,
        total: i.total,
      }));
      const { error } = await supabase.from("imobilizado_aquisicao").upsert(payload, { onConflict: "id" });
      if (error) console.error("Save imobilizado_aquisicao error:", error);
    }
    const existingAquisicaoIds = await fetchAllIds("imobilizado_aquisicao", clienteId);
    const currentAquisicaoIds = new Set(state.imobilizadoAquisicao.map(i => i.id));
    const toDeleteAquisicoes = existingAquisicaoIds.filter(id => !currentAquisicaoIds.has(id));
    if (toDeleteAquisicoes.length > 0) {
      for (let i = 0; i < toDeleteAquisicoes.length; i += 500) {
        await supabase.from("imobilizado_aquisicao").delete().in("id", toDeleteAquisicoes.slice(i, i + 500));
      }
    }
  }

  // 6. Upsert atividade_rural_particular
  for (const a of state.atividadeRuralParticular) {
    const { data: existing } = await supabase
      .from("atividade_rural_particular")
      .select("id")
      .eq("parceiro_id", a.parceiroId)
      .maybeSingle();
    
    if (existing) {
      await supabase.from("atividade_rural_particular")
        .update({ receitas: a.receitas, despesas: a.despesas })
        .eq("id", existing.id);
    } else {
      await supabase.from("atividade_rural_particular")
        .insert({ parceiro_id: a.parceiroId, receitas: a.receitas, despesas: a.despesas });
    }
  }

  // 7. Upsert rendimentos_particulares
  for (const r of state.rendimentosParticulares) {
    const { data: existing } = await supabase
      .from("rendimentos_particulares")
      .select("id")
      .eq("parceiro_id", r.parceiroId)
      .maybeSingle();
    
    const payload = {
      parceiro_id: r.parceiroId,
      dividendos: r.dividendos,
      alugueis: r.alugueis,
      pro_labore: r.proLabore,
      rend_aplicacoes: r.rendAplicacoes,
      rend_protegidos: r.rendProtegidos,
      doacoes: r.doacoes,
      ganho_capital: r.ganhoCapital,
    };
    
    if (existing) {
      await supabase.from("rendimentos_particulares").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("rendimentos_particulares").insert(payload);
    }
  }

  // 8. Upsert retencoes_particulares
  for (const r of state.retencoesParticulares) {
    const { data: existing } = await supabase
      .from("retencoes_particulares")
      .select("id")
      .eq("parceiro_id", r.parceiroId)
      .maybeSingle();
    
    const payload = {
      parceiro_id: r.parceiroId,
      irrf_dividendos: r.irrfDividendos,
      irrf_alugueis: r.irrfAlugueis,
      irrf_pro_labore: r.irrfProLabore,
      irrf_rend_aplicacoes: r.irrfRendAplicacoes,
      irrf_operacoes_bolsa: r.irrfOperacoesBolsa,
    };
    
    if (existing) {
      await supabase.from("retencoes_particulares").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("retencoes_particulares").insert(payload);
    }
  }

  // 9. Upsert config_cliente
  const { data: existingConfig } = await supabase
    .from("config_cliente")
    .select("id")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  const configPayload = {
    cliente_id: clienteId,
    demais_despesas_pj: state.demaisDespesasPJ,
    lucro_acumulado_pj: state.lucroAcumuladoPJ,
    funrural_pj_regime: state.funruralPJRegime,
    funrural_pj_aliquota: state.funruralPJAliquota,
    folha_pagamento_pj: state.folhaPagamentoPJ,
    funrural_pf_regime: state.funruralPFRegime,
    funrural_pf_aliquota: state.funruralPFAliquota,
    folha_pagamento_pf: state.folhaPagamentoPF,
    prejuizos_anteriores: state.prejuizosAnteriores,
    lucros_isentos_acumulados: state.lucrosIsentosAcumulados || {},
    regime_apuracao_rural: state.regimeApuracaoRural || {},
    contabilidade_regular: state.contabilidadeRegular,
    lcdpr_limite: state.lcdprLimite,
    aliquota_diesel_por_litro: state.aliquotaDieselPorLitro,
  };

  if (existingConfig) {
    await supabase.from("config_cliente").update(configPayload).eq("id", existingConfig.id);
  } else {
    await supabase.from("config_cliente").insert(configPayload);
  }
}

/* ─── Connectere: start / check (short-lived calls) ─── */

export async function syncConnectereStart(
  clienteId: string,
  modulo: string,
  options?: { data_inicio?: string; data_fim?: string; nome_fazenda?: string }
) {
  const { data, error } = await supabase.functions.invoke("sync-connectere", {
    body: { cliente_id: clienteId, action: "start", modulo, ...options },
  });
  if (error) throw error;
  return data as { action: string; modulo: string; url_situacao: string; url_download: string };
}

export async function syncConnectereCheck(
  clienteId: string,
  modulo: string,
  urlSituacao: string,
  urlDownload: string
) {
  const { data, error } = await supabase.functions.invoke("sync-connectere", {
    body: { cliente_id: clienteId, action: "check", modulo, url_situacao: urlSituacao, url_download: urlDownload },
  });
  if (error) throw error;
  return data as { action: string; modulo: string; ready: boolean; situacao?: string; records?: number };
}

/* ─── Aegro: sync ─── */

export async function syncAegroStart(clienteId: string) {
  const { data, error } = await supabase.functions.invoke("sync-aegro", {
    body: { cliente_id: clienteId },
  });
  if (error) throw error;
  return data as { success: boolean; total_records: number; receitas: number; despesas: number };
}

/* ─── Generic integration helpers ─── */

export async function getIntegrationStatus(clienteId: string) {
  const { data } = await supabase
    .from("client_integrations")
    .select("*")
    .eq("cliente_id", clienteId)
    .maybeSingle();
  return data as any;
}

export async function saveIntegrationToken(clienteId: string, system: string, token: string) {
  const { data, error } = await supabase
    .from("client_integrations")
    .upsert(
      { cliente_id: clienteId, source_system: system, source_token: token, active: true },
      { onConflict: "cliente_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeIntegration(clienteId: string) {
  // Delete integration record
  await supabase.from("client_integrations").delete().eq("cliente_id", clienteId);
  // Clean up imported data from any source_system
  await supabase.from("receitas").delete().eq("cliente_id", clienteId).not("source_system", "is", null);
  await supabase.from("despesas").delete().eq("cliente_id", clienteId).not("source_system", "is", null);
  await supabase.from("vendas_imobilizado").delete().eq("cliente_id", clienteId).not("source_system", "is", null);
}

// ── Farm Collaboration ──────────────────────────────────────

export async function searchConsultorProfiles(query: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email")
    .ilike("email", `%${query}%`)
    .limit(10);
  if (error) throw error;
  return data || [];
}

export interface FarmCollaborator {
  id: string;
  consultor_id: string;
  role: string;
  nome: string;
  email: string | null;
}

export async function getFarmCollaborators(clienteId: string): Promise<FarmCollaborator[]> {
  const { data, error } = await supabase
    .from("consultor_clientes")
    .select("id, consultor_id, role")
    .eq("cliente_id", clienteId);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = data.map((r) => r.consultor_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, email")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  return data.map((r) => {
    const p = profileMap.get(r.consultor_id);
    return {
      id: r.id,
      consultor_id: r.consultor_id,
      role: r.role as string,
      nome: p?.nome || "",
      email: p?.email || null,
    };
  });
}

export async function addFarmCollaborator(clienteId: string, consultorId: string) {
  const { error } = await supabase
    .from("consultor_clientes")
    .insert({ consultor_id: consultorId, cliente_id: clienteId, role: "editor" });
  if (error) throw error;
}

export async function removeFarmCollaborator(consultorClientesId: string) {
  const { error } = await supabase
    .from("consultor_clientes")
    .delete()
    .eq("id", consultorClientesId);
  if (error) throw error;
}

export async function getUserFarmRole(
  userId: string,
  clienteId: string,
): Promise<"owner" | "editor" | null> {
  const { data, error } = await supabase
    .from("consultor_clientes")
    .select("role")
    .eq("consultor_id", userId)
    .eq("cliente_id", clienteId)
    .maybeSingle();
  if (error || !data) return null;
  return data.role as "owner" | "editor";
}

export async function getFarmDataWatermark(clienteId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_farm_data_watermark", {
    _cliente_id: clienteId,
  });
  if (error) throw error;
  return data;
}
