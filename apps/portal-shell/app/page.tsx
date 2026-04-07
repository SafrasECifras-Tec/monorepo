import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerTenantId } from "@/lib/tenant.server";

export const runtime = "edge";
import type { Fazenda } from "@socios/database";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AppLauncherCard } from "@/components/AppLauncherCard";

const GEF_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : (process.env.NEXT_PUBLIC_GEF_URL ?? "http://localhost:3000");

const PLT_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : (process.env.NEXT_PUBLIC_PLT_URL ?? "http://localhost:8080");

export default async function LaunchpadPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch fazendas server-side for instant render — no loading state needed
  const { data: fazendas } = (await supabase
    .from("fazendas")
    .select("id, produtor_id, nome, municipio, estado, area_total_ha")
    .order("nome")) as { data: Fazenda[] | null };

  const currentTenantId = await getServerTenantId();

  return (
    <div className="min-h-screen w-full flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          fazendas={fazendas ?? []}
          currentTenantId={currentTenantId}
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            {/* Page header */}
            <div className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">
                Plataforma
              </p>
              <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground">
                Sócios do Agro
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione o módulo que deseja acessar
              </p>
            </div>

            {/* App launcher grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* GEF usa Google OAuth próprio — o navegador reutiliza a sessão Google nativa */}
              <AppLauncherCard
                name="GEF"
                fullName="Gestão Estratégica de Fazendas"
                description="Análise econômico-financeira, DRE, fluxo de caixa e gestão patrimonial da fazenda."
                href={GEF_URL}
                currentTenantId={currentTenantId}
                colorScheme="teal"
                ssoType="google"
              />
              {/* PLT usa Supabase — passa tokens no hash para login automático */}
              <AppLauncherCard
                name="PLT"
                fullName="Planejamento Tributário Rural"
                description="Simulações e planejamento tributário para produtores rurais pessoa física e jurídica."
                href={PLT_URL}
                currentTenantId={currentTenantId}
                colorScheme="green"
                ssoType="supabase"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
