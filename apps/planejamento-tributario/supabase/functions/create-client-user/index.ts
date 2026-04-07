import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7); // remove "Bearer "

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const consultorId = user.id;

    const { data: roleData, error: roleError } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", consultorId)
      .eq("role", "consultor")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Apenas consultores podem criar usuarios" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      email: rawEmail,
      password,
      nome: rawNome,
      cliente_id,
    } = await req.json();

    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const nome = typeof rawNome === "string" ? rawNome.trim() : "";

    if (!email || !password || !cliente_id) {
      return new Response(JSON.stringify({ error: "email, password e cliente_id sao obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bloquear criação de acesso de cliente com email corporativo Safras & Cifras
    const BLOCKED_DOMAIN = "safrasecifras.com.br";
    if (email.endsWith(`@${BLOCKED_DOMAIN}`)) {
      return new Response(JSON.stringify({
        error: `Não é permitido criar acesso de cliente para e-mails @${BLOCKED_DOMAIN}. Colaboradores Safras & Cifras acessam o sistema como consultores.`,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: assoc, error: assocError } = await anonClient
      .from("consultor_clientes")
      .select("id")
      .eq("consultor_id", consultorId)
      .eq("cliente_id", cliente_id)
      .single();

    if (assocError || !assoc) {
      return new Response(JSON.stringify({ error: "Cliente nao pertence a este consultor" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from("profiles")
      .select("id, nome, email")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfileError) {
      return new Response(JSON.stringify({ error: `Falha ao buscar usuario existente: ${existingProfileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId = existingProfile?.id ?? null;
    let createdNewUser = false;

    if (!userId) {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, role: "cliente" },
      });

      if (createErr || !newUser.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Falha ao criar usuario" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      createdNewUser = true;
    }

    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({ id: userId, nome: nome || existingProfile?.nome || "", email }, { onConflict: "id" });

    if (profileErr) {
      if (createdNewUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(JSON.stringify({ error: `Falha ao salvar perfil: ${profileErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: userRoleErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "cliente" }, { onConflict: "user_id,role" });

    if (userRoleErr) {
      if (createdNewUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(JSON.stringify({ error: `Falha ao definir papel do usuario: ${userRoleErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: linkErr } = await adminClient
      .from("cliente_users")
      .upsert({ user_id: userId, cliente_id }, { onConflict: "user_id,cliente_id" });

    if (linkErr) {
      if (createdNewUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(JSON.stringify({ error: `Falha ao vincular usuario ao cliente: ${linkErr.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      email,
      created: createdNewUser,
      linked_existing_user: !createdNewUser,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-client-user error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
