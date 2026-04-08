import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerTenantId } from "@/lib/tenant.server";
import { BarChart3, Calculator, Landmark, ShieldCheck } from "lucide-react";

// NOTE: do NOT set `runtime = "edge"` here.
// Edge Runtime causes RSC manifest ID mismatches in pnpm monorepos.
// For Cloudflare Pages deployment, @cloudflare/next-on-pages handles
// edge compilation at build time without requiring per-route declarations.
import type { Fazenda } from "@socios/database";
import { Header } from "@/components/Header";
import { AppLauncherCard } from "@/components/AppLauncherCard";
import { UserMenu } from "@/components/UserMenu";

const GEF_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : (process.env.NEXT_PUBLIC_GEF_URL || "https://socios-gef.tecnologia-231.workers.dev");

const PLT_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : (process.env.NEXT_PUBLIC_PLT_URL || "https://socios-plt.tecnologia-231.workers.dev");

export default async function LaunchpadPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: fazendas } = (await supabase
    .from("fazendas")
    .select("id, produtor_id, nome, municipio, estado, area_total_ha")
    .order("nome")) as { data: Fazenda[] | null };

  const currentTenantId = await getServerTenantId();

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header
        user={user}
        fazendas={fazendas ?? []}
        currentTenantId={currentTenantId}
      />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <div className="mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
              Plataforma
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Módulos
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
              Acesse os módulos da plataforma Sócios do Agro. Selecione uma
              fazenda acima para contextualizá-los automaticamente.
            </p>
          </div>

          {/* Module grid — 2×2 */}
          <div className="grid gap-5 sm:grid-cols-2">
            <AppLauncherCard
              tag="GEF"
              title="Gestão Estratégica de Fazendas"
              description="Análise econômico-financeira, DRE, fluxo de caixa, estoque e indicadores de desempenho da fazenda."
              icon={<BarChart3 className="h-5 w-5" />}
              accentGradient="from-teal-600 to-cyan-500"
              accentColor="text-teal-600"
              href={GEF_URL}
              currentTenantId={currentTenantId}
              ssoType="supabase"
            />

            <AppLauncherCard
              tag="Contábil"
              title="Planejamento Tributário"
              description="Simulações tributárias, comparativos de regimes e planejamento fiscal para produtores rurais PF e PJ."
              icon={<Calculator className="h-5 w-5" />}
              accentGradient="from-emerald-700 to-green-500"
              accentColor="text-emerald-700"
              href={PLT_URL}
              currentTenantId={currentTenantId}
              ssoType="supabase"
            />

            <AppLauncherCard
              tag="Patrimonial"
              title="Gestão Patrimonial"
              description="Controle de ativos, inventário patrimonial, depreciação e valorização dos bens da propriedade rural."
              icon={<Landmark className="h-5 w-5" />}
              accentGradient="from-amber-600 to-yellow-500"
              accentColor="text-amber-600"
              currentTenantId={currentTenantId}
              locked
            />

            <AppLauncherCard
              tag="Governança"
              title="Governança"
              description="Estrutura societária, compliance, gestão de riscos e boas práticas de governança para o agronegócio."
              icon={<ShieldCheck className="h-5 w-5" />}
              accentGradient="from-violet-600 to-purple-500"
              accentColor="text-violet-600"
              currentTenantId={currentTenantId}
              locked
            />
          </div>
        </div>
      </main>

      {/* Floating user menu — bottom-right */}
      <UserMenu user={user} />
    </div>
  );
}
