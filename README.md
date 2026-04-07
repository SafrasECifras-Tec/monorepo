# Sócios do Agro — Monorepo

Monorepo unificado da plataforma **Sócios do Agro** (Safras & Cifras), gerenciado com **Turborepo + pnpm**.

## Visão Geral

Consolida múltiplos sistemas independentes em uma base de código única, compartilhando configuração, auth e futuramente UI.

| App | Descrição | Deploy |
|-----|-----------|--------|
| `apps/planejamento-tributario` | Planejamento tributário para produtores rurais | Cloudflare Workers |
| `apps/gef` | Gestão Estratégica de Fazenda — dashboards financeiros | Cloudflare Workers |

| Package | Descrição |
|---------|-----------|
| `packages/auth` | Cliente Supabase compartilhado (`@socios/auth`) |
| `packages/tsconfig` | Configs TypeScript base (`@socios/tsconfig`) |
| `packages/config-eslint` | Config ESLint compartilhada (`@socios/eslint-config`) |

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 10.8.0 — `npm install -g pnpm@10.8.0`
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — instalado como dep local

## Setup

```bash
# Clonar e instalar
git clone https://github.com/SafrasECifras-Tec/monorepo.git
cd monorepo
pnpm install
```

### Variáveis de Ambiente

Copie os arquivos de exemplo e preencha:

```bash
# PLT
cp apps/planejamento-tributario/.env.example apps/planejamento-tributario/.env

# GEF
cp apps/gef/.env.example apps/gef/.env
```

**PLT** (`apps/planejamento-tributario/.env`):
```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

**GEF** (`apps/gef/.env`):
```env
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
GEMINI_API_KEY=<gemini-api-key>
```

## Desenvolvimento

```bash
# Rodar todos os apps em paralelo
pnpm dev

# Rodar app específico
pnpm dev --filter=planejamento-tributario   # porta 8080
pnpm dev --filter=gef                       # porta 3000
```

## Build

```bash
# Build de todos os apps (com cache Turborepo)
pnpm build

# Build de app específico
pnpm build --filter=planejamento-tributario
pnpm build --filter=gef
```

## Lint e Testes

```bash
pnpm lint                                        # lint todos
pnpm lint --filter=planejamento-tributario       # lint PLT
pnpm test --filter=planejamento-tributario       # testes PLT (Vitest)
```

## Deploy (Cloudflare)

Cada app faz deploy como um **Cloudflare Worker** com assets estáticos (SPA).

```bash
# Deploy PLT
pnpm build --filter=planejamento-tributario
cd apps/planejamento-tributario && pnpm exec wrangler deploy

# Deploy GEF
pnpm build --filter=gef
cd apps/gef && pnpm exec wrangler deploy
```

> Requer autenticação no Cloudflare: `pnpm exec wrangler login`

## Estrutura

```
/
├── apps/
│   ├── planejamento-tributario/   (React 18 + Vite + Tailwind v3 + Supabase)
│   └── gef/                       (React 19 + Vite + Tailwind v4 + IndexedDB)
├── packages/
│   ├── auth/                      (Supabase client singleton)
│   ├── tsconfig/                  (base.json, vite-react.json, node.json)
│   └── config-eslint/             (ESLint flat config)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Stack Técnica

- **Monorepo**: Turborepo + pnpm workspaces
- **Build**: Vite 6
- **Linguagem**: TypeScript 5.8 (strict)
- **UI**: React 18/19 + shadcn/ui + Tailwind CSS
- **Auth**: Supabase (PLT) / Google OAuth (GEF)
- **Deploy**: Cloudflare Workers + Assets

## Roadmap

- [ ] `apps/portal-shell` — Next.js shell unificado (Auth, Layout, Navegação)
- [ ] `packages/ui` — Design system compartilhado (Tailwind v4 + shadcn)
- [ ] `packages/types` — Tipos e contratos compartilhados
- [ ] Module Federation / Runtime Integration dos microfrontends
- [ ] GEF migrado para Supabase auth unificada
