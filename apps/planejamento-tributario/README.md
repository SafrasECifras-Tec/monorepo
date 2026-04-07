# Planejamento Tributário — Safras & Cifras

App de planejamento tributário para produtores rurais brasileiros. Permite que consultores da Safras & Cifras modelam cenários de IRPF, IRPJ, IBS/CBS e outros tributos rurais para seus clientes.

## Stack

- **React 18** + **Vite 6** + **TypeScript 5.8**
- **Tailwind CSS v3** + **shadcn/ui** (Radix UI)
- **Supabase** (auth + banco de dados com RLS)
- **React Router v6**
- **React Query v5**
- **Cloudflare Workers** (deploy)

## Pré-requisitos

- Node.js >= 18
- pnpm >= 10.8.0 (gerenciado pelo monorepo)

## Variáveis de ambiente

Crie `apps/planejamento-tributario/.env` com:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

## Desenvolvimento

A partir da **raiz do monorepo**:

```bash
pnpm dev --filter=planejamento-tributario   # inicia na porta 8080
pnpm build --filter=planejamento-tributario
pnpm test --filter=planejamento-tributario
pnpm lint --filter=planejamento-tributario
```

## Deploy

Deploy automático via GitHub Actions a cada push na `main` que afete este app.

Deploy manual:

```bash
pnpm build --filter=planejamento-tributario
cd apps/planejamento-tributario && npx wrangler deploy
```

**URL de produção:** `https://planejamento-tributario.tecnologia-231.workers.dev`

## Autenticação

- Email/senha via Supabase Auth
- Google OAuth restrito ao domínio `@safrasecifras.com.br`
- Roles: `consultor` (acesso total) e `cliente` (acesso restrito ao próprio dado)
