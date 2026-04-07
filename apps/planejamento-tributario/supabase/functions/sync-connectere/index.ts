import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONNECTERE_BASE = "https://g3.connectere.agr.br";
const BATCH_SIZE = 200;
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── Helpers ───

function parseBR(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const s = String(val).replace(/^R\$\s*/, "").trim();
  if (!s) return 0;
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(s) || 0;
}

function dateToMonth(d: string | null): string {
  if (!d) return "Jan";
  const parts = d.split("/");
  if (parts.length >= 2) {
    const idx = parseInt(parts[1], 10) - 1;
    return MESES[idx] || "Jan";
  }
  return "Jan";
}

function detectEntidade(cpfCnpj: string | null): "PF" | "PJ" {
  if (!cpfCnpj) return "PJ";
  const digits = cpfCnpj.replace(/\D/g, "");
  return digits.length <= 11 ? "PF" : "PJ";
}

function hashRecord(rec: Record<string, unknown>, modulo: string): string {
  const key = `${modulo}:${rec["ID"] || rec["id_do_documento"] || rec["indice"]}-${rec["Data"] || rec["data"] || ""}-${rec["Documento"] || rec["documento"] || ""}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ─── Mappers per module ───

function mapComercial(records: Record<string, unknown>[], clienteId: string) {
  // Comercial → ONLY receitas + vendas_imobilizado
  // Despesas come exclusively from the Contabil module (authoritative ledger)
  const receitas: Record<string, unknown>[] = [];
  const vendas: Record<string, unknown>[] = [];

  for (const r of records) {
    const op = String(r["Operação"] || r["operacao"] || "").toLowerCase();
    const hash = hashRecord(r, "Comercial");
    const doc = String(r["Documento"] || r["documento"] || "");
    const entidade = detectEntidade(r["CNPJ do Fornecedor / Comprador"] as string);
    const mes = dateToMonth(r["Data"] as string);
    const total = parseBR(r["valor_liquido"]);

    const comercializavel = String(r["comercializavel"] || "").trim();
    const comercializavelType = String(r["comercializavel_type"] || "").toLowerCase();
    const descricaoRaw = String(r["descricao"] || "").trim();
    const historico = String(r["Histórico"] || "").trim();
    const fornecedorCliente = String(r["Fornecedor/Cliente"] || "").trim();
    const operacao = String(r["Operação"] || r["operacao"] || "");

    // Distinguish actual asset sales (Maquina) from grain/product sales
    const isImobilizado = comercializavelType === "maquina" || 
      (op.includes("venda") && op.includes("imobilizado") && !comercializavelType);

    if (op.includes("venda") && isImobilizado) {
      vendas.push({
        cliente_id: clienteId,
        descricao: comercializavel || descricaoRaw || historico || "Venda Imobilizado",
        entidade,
        mes,
        realizado: total,
        projetado: 0,
        total,
        source_system: "connectere",
        source_modulo: "Comercial",
        source_documento: doc,
        source_row_hash: hash,
      });
    } else if (op.includes("venda") || op.includes("complementar") || op.includes("faturamento") || op.includes("receita")) {
      receitas.push({
        cliente_id: clienteId,
        produto: comercializavel || descricaoRaw || "Produto não identificado",
        obs: `${fornecedorCliente || operacao}${historico ? " - " + historico : ""}`,
        entidade,
        pis_cofins: false,
        mes,
        quantidade: parseBR(r["quantidade"]),
        valor_unit: parseBR(r["valor_unitario"]),
        total,
        tipo: "realizacao",
        source_system: "connectere",
        source_modulo: "Comercial",
        source_documento: doc,
        source_row_hash: hash,
      });
    }
    // All other operations (Desembolso, Compra, Devolução, Transferência) are
    // already captured by the Contabil module as journal entries — skip here.
  }

  // Log unique operations for debugging
  const ops = new Set(records.map(r => String(r["Operação"] || r["operacao"] || "unknown")));
  console.log(`[Comercial] Unique operations found: ${[...ops].join(", ")}`);

  return { receitas, vendas };
}

function mapContabil(records: Record<string, unknown>[], clienteId: string) {
  const despesas: Record<string, unknown>[] = [];

  // Only map Debito entries with cost/expense account groups
  for (const r of records) {
    const tipo = String(r["tipo"] || "").toLowerCase();
    const grupo = String(r["grupo_de_conta"] || "").toLowerCase();
    const conta = String(r["conta"] || "").toLowerCase();
    
    if (tipo !== "debito") continue;
    if (!grupo.includes("custo") && !grupo.includes("despesa")) continue;

    // Ignore non-operational / financial expenses
    if (
      conta.includes("juro") || 
      conta.includes("multa") || 
      conta.includes("prolabore") || 
      conta.includes("pró-labore") || 
      conta.includes("dividendos")
    ) {
      continue;
    }

    const hash = hashRecord(r, "Contabil");
    despesas.push({
      cliente_id: clienteId,
      descricao: String(r["conta"] || ""),
      obs: String(r["Histórico"] || ""),
      realizado: parseBR(r["valor"]),
      a_realizar: 0,
      total: parseBR(r["valor"]),
      source_system: "connectere",
      source_modulo: "Contabil",
      source_documento: String(r["Documento"] || ""),
      source_row_hash: hash,
    });
  }
  return { despesas };
}

function mapFinanceiroQuitacoes(records: Record<string, unknown>[], clienteId: string) {
  // Only receitas (recebimentos). Pagamentos already in Contabil.
  const receitas: Record<string, unknown>[] = [];

  for (const r of records) {
    const tipo = String(r["Tipo"] || "").toLowerCase();
    if (tipo !== "recebimento") continue;

    const hash = hashRecord(r, "Financeiro_Quitacoes");
    const doc = String(r["documento"] || r["Documento"] || "");
    const valorPago = parseBR(r["valor_pago"]);
    const mes = dateToMonth(r["data_pagamento"] as string || r["Data da quitação"] as string);

    receitas.push({
      cliente_id: clienteId,
      produto: String(r["Tipo de documento"] || "Recebimento"),
      obs: String(r["Pessoa"] || ""),
      entidade: "PJ",
      pis_cofins: false,
      mes,
      quantidade: 1,
      valor_unit: valorPago,
      total: valorPago,
      tipo: "realizacao",
      source_system: "connectere",
      source_modulo: "Financeiro_Quitacoes",
      source_documento: doc,
      source_row_hash: hash,
    });
  }
  return { receitas };
}

function mapFinanceiroEmprestimos(_records: Record<string, unknown>[], _clienteId: string) {
  // Empréstimos already captured in Contabil module. Skip to avoid double-counting.
  return {};
}

// ─── Batch insert with dedup ───

async function batchUpsert(
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: Record<string, unknown>[],
  clienteId: string,
  modulo: string
) {
  if (rows.length === 0) return 0;

  // Delete previous data from this source module for this client
  await supabase
    .from(table)
    .delete()
    .eq("cliente_id", clienteId)
    .eq("source_system", "connectere")
    .eq("source_modulo", modulo);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`[${modulo}] Batch insert error in ${table} (batch ${i}): ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

// ─── Main handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { cliente_id, action = "start", modulo, data_inicio, data_fim, nome_fazenda, url_situacao, url_download } = body;

    if (!cliente_id) {
      return new Response(JSON.stringify({ error: "cliente_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get token
    const { data: integration, error: intError } = await supabase
      .from("client_integrations")
      .select("*")
      .eq("cliente_id", cliente_id)
      .eq("source_system", "connectere")
      .eq("active", true)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: "No active Connectere integration found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = integration.source_token;
    const headers = { Authorization: `Token token=${token}`, "Content-Type": "application/json" };

    // ─── ACTION: START ───
    if (action === "start") {
      if (!modulo) {
        return new Response(JSON.stringify({ error: "modulo is required for action=start" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const queryParams = new URLSearchParams({ "dados[modulo]": modulo });
      if (data_inicio) queryParams.set("dados[data_inicio]", data_inicio);
      if (data_fim) queryParams.set("dados[data_fim]", data_fim);
      if (nome_fazenda) queryParams.set("dados[nome_fazenda]", nome_fazenda);

      const startUrl = `${CONNECTERE_BASE}/api/v1/dados?${queryParams.toString()}`;
      console.log(`[${modulo}] Starting generation: ${startUrl}`);

      const startRes = await fetch(startUrl, { headers });
      if (!startRes.ok) {
        const text = await startRes.text();
        return new Response(JSON.stringify({ error: `Start failed (${startRes.status}): ${text}` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const startBody = await startRes.json();
      console.log(`[${modulo}] Start response:`, JSON.stringify(startBody));

      return new Response(JSON.stringify({
        action: "started",
        modulo,
        url_situacao: startBody.url_situacao,
        url_download: startBody.url_download,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: CHECK ───
    if (action === "check") {
      if (!url_situacao || !url_download || !modulo) {
        return new Response(JSON.stringify({ error: "modulo, url_situacao and url_download are required for action=check" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[${modulo}] Checking status...`);
      let pollRes: Response;
      try {
        pollRes = await fetch(url_situacao, { headers });
      } catch (fetchErr) {
        console.log(`[${modulo}] Poll fetch error: ${fetchErr.message}`);
        return new Response(JSON.stringify({
          action: "checking", modulo, situacao: "Aguardando (rede)", ready: false,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!pollRes.ok) {
        if (pollRes.status >= 500) {
          console.log(`[${modulo}] Poll returned ${pollRes.status}, treating as still processing`);
          return new Response(JSON.stringify({
            action: "checking", modulo, situacao: "Aguardando (servidor)", ready: false,
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: `Poll failed (${pollRes.status})` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pollBody = await pollRes.json();
      const situacao = pollBody.situacao;
      console.log(`[${modulo}] Status: ${situacao}`);

      if (situacao !== "Realizada") {
        return new Response(JSON.stringify({
          action: "checking", modulo, situacao, ready: false,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Ready — download + map to domain tables ───
      console.log(`[${modulo}] Downloading from: ${url_download}`);
      const dlRes = await fetch(url_download, { headers });
      if (!dlRes.ok) {
        return new Response(JSON.stringify({ error: `Download failed (${dlRes.status})` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const records = await dlRes.json();
      const data: Record<string, unknown>[] = Array.isArray(records) ? records : [];
      console.log(`[${modulo}] Downloaded ${data.length} records. Mapping to domain tables...`);

      // Save metadata + sample to staging_imports
      const sample = data.slice(0, 3);
      await supabase.from("staging_imports").insert({
        cliente_id,
        source_system: "connectere",
        modulo,
        raw_data: { modulo, sample, total_registros: data.length },
        record_count: data.length,
        status: "mapping",
      });

      // Map records based on module
      let mappedReceitas = 0, mappedDespesas = 0, mappedVendas = 0;

      try {
        if (modulo === "Comercial") {
          const { receitas, vendas } = mapComercial(data, cliente_id);
          mappedReceitas = await batchUpsert(supabase, "receitas", receitas, cliente_id, "Comercial");
          mappedVendas = await batchUpsert(supabase, "vendas_imobilizado", vendas, cliente_id, "Comercial");
          // Also clean up any old Comercial despesas from previous syncs
          await supabase.from("despesas").delete()
            .eq("cliente_id", cliente_id).eq("source_system", "connectere").eq("source_modulo", "Comercial");
        } else if (modulo === "Contabil") {
          const { despesas } = mapContabil(data, cliente_id);
          mappedDespesas = await batchUpsert(supabase, "despesas", despesas, cliente_id, "Contabil");
        } else if (modulo === "Financeiro_Quitacoes") {
          const { receitas } = mapFinanceiroQuitacoes(data, cliente_id);
          mappedReceitas = await batchUpsert(supabase, "receitas", receitas, cliente_id, "Financeiro_Quitacoes");
          // Clean up any old Financeiro_Quitacoes despesas from previous syncs
          await supabase.from("despesas").delete()
            .eq("cliente_id", cliente_id).eq("source_system", "connectere").eq("source_modulo", "Financeiro_Quitacoes");
        } else if (modulo === "Financeiro_Emprestimos_e_Financiamentos") {
          mapFinanceiroEmprestimos(data, cliente_id);
          // Clean up any old Financeiro_Emprestimos despesas from previous syncs
          await supabase.from("despesas").delete()
            .eq("cliente_id", cliente_id).eq("source_system", "connectere").eq("source_modulo", "Financeiro_Emprestimos");
        }

        // Update staging status
        await supabase
          .from("staging_imports")
          .update({ status: "mapped", mapped_at: new Date().toISOString() })
          .eq("cliente_id", cliente_id)
          .eq("modulo", modulo)
          .eq("status", "mapping");

        console.log(`[${modulo}] Mapping done: ${mappedReceitas} receitas, ${mappedDespesas} despesas, ${mappedVendas} vendas`);
      } catch (mapErr) {
        console.error(`[${modulo}] Mapping error: ${mapErr.message}`);
        await supabase
          .from("staging_imports")
          .update({ status: "error", error_message: mapErr.message })
          .eq("cliente_id", cliente_id)
          .eq("modulo", modulo)
          .eq("status", "mapping");
      }

      // Update last_sync
      await supabase
        .from("client_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id);

      return new Response(JSON.stringify({
        action: "done",
        modulo,
        ready: true,
        records: data.length,
        mapped: { receitas: mappedReceitas, despesas: mappedDespesas, vendas: mappedVendas },
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
