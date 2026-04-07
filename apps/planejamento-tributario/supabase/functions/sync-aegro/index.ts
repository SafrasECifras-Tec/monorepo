import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AEGRO_BASE = "https://app.aegro.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cliente_id } = await req.json();
    if (!cliente_id) throw new Error("cliente_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get integration token
    const { data: integration, error: intError } = await supabase
      .from("client_integrations")
      .select("source_token")
      .eq("cliente_id", cliente_id)
      .eq("source_system", "aegro")
      .eq("active", true)
      .single();

    if (intError || !integration) throw new Error("Integração Aegro não encontrada ou inativa");

    const apiKey = integration.source_token;
    const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

    // Fetch bills (lançamentos financeiros)
    let allBills: any[] = [];
    let page = 0;
    const pageSize = 100;
    while (true) {
      const url = `${AEGRO_BASE}/pub/v1/bills?page=${page}&size=${pageSize}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Aegro API error [${res.status}]: ${body}`);
      }
      const bills = await res.json();
      if (!Array.isArray(bills) || bills.length === 0) break;
      allBills = allBills.concat(bills);
      if (bills.length < pageSize) break;
      page++;
    }

    // Map bills to receitas/despesas
    const receitas: any[] = [];
    const despesas: any[] = [];

    const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (const bill of allBills) {
      const valor = Math.abs(Number(bill.value) || 0);
      if (valor === 0) continue;

      const date = bill.dueDate || bill.issueDate || bill.createdAt;
      const mes = date ? MONTHS[new Date(date).getMonth()] || "Jan" : "Jan";
      const descricao = bill.description || bill.name || "Sem descrição";
      const hash = `aegro-bill-${bill._id || bill.id}`;

      // Aegro: type "revenue" = receita, "expense" = despesa
      const billType = (bill.type || "").toLowerCase();

      if (billType === "revenue" || billType === "receita") {
        receitas.push({
          cliente_id,
          tipo: "realizacao",
          produto: descricao,
          obs: bill.category || "",
          entidade: "PJ",
          pis_cofins: false,
          mes,
          quantidade: 1,
          valor_unit: valor,
          total: valor,
          source_system: "aegro",
          source_modulo: "bills",
          source_row_hash: hash,
          source_documento: bill.documentNumber || null,
        });
      } else {
        despesas.push({
          cliente_id,
          descricao,
          obs: bill.category || "",
          realizado: valor,
          a_realizar: 0,
          total: valor,
          source_system: "aegro",
          source_modulo: "bills",
          source_row_hash: hash,
          source_documento: bill.documentNumber || null,
        });
      }
    }

    // Batch upsert: delete old aegro data for this client, then insert new
    await supabase.from("receitas").delete().eq("cliente_id", cliente_id).eq("source_system", "aegro").eq("source_modulo", "bills");
    await supabase.from("despesas").delete().eq("cliente_id", cliente_id).eq("source_system", "aegro").eq("source_modulo", "bills");

    // Insert in batches of 500
    for (let i = 0; i < receitas.length; i += 500) {
      const { error } = await supabase.from("receitas").insert(receitas.slice(i, i + 500));
      if (error) console.error("Insert receitas error:", error);
    }
    for (let i = 0; i < despesas.length; i += 500) {
      const { error } = await supabase.from("despesas").insert(despesas.slice(i, i + 500));
      if (error) console.error("Insert despesas error:", error);
    }

    // Update last_sync_at
    await supabase.from("client_integrations").update({ last_sync_at: new Date().toISOString() }).eq("cliente_id", cliente_id).eq("source_system", "aegro");

    const totalRecords = receitas.length + despesas.length;

    return new Response(JSON.stringify({
      success: true,
      total_records: totalRecords,
      receitas: receitas.length,
      despesas: despesas.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("sync-aegro error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
