# GEF — Gestão Econômica e Financeira

Dashboard financeiro para análise estratégica de fazendas. Importa planilhas Excel de fluxo de caixa, endividamento, balanço patrimonial e DRE, gerando visualizações e projeções para consultores e produtores rurais.

## Stack

- **React 19** + **Vite 6** + **TypeScript 5.8**
- **Tailwind CSS v4** + **shadcn/ui**
- **IndexedDB** (armazenamento local via `idb`)
- **Google OAuth 2.0** (autenticação restrita ao domínio `@safrasecifras.com.br`)
- **Google Gemini** (análises com IA)
- **Recharts** (gráficos)
- **Cloudflare Workers** (deploy via `@cloudflare/vite-plugin`)

## Pré-requisitos

- Node.js >= 18
- pnpm >= 10.8.0 (gerenciado pelo monorepo)

## Variáveis de ambiente

Crie `apps/gef/.env` (use `.env.example` como base):

```env
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
GEMINI_API_KEY=<gemini-api-key>
```

O `VITE_GOOGLE_CLIENT_ID` é criado em: Google Cloud Console → APIs e Serviços → Credenciais → OAuth 2.0. Adicione `http://localhost:3000` e o domínio de produção como origens autorizadas.

## Desenvolvimento

A partir da **raiz do monorepo**:

```bash
pnpm dev --filter=gef    # inicia na porta 3000
pnpm build --filter=gef
pnpm lint --filter=gef
```

## Deploy

Deploy automático via GitHub Actions a cada push na `main` que afete este app.

Deploy manual:

```bash
pnpm build --filter=gef
cd apps/gef && npx wrangler deploy --config dist/wrangler.json
```

> O `@cloudflare/vite-plugin` gera `dist/wrangler.json` durante o build, que é o config usado pelo deploy.

**URL de produção:** `https://gef.tecnologia-231.workers.dev`

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Fluxo de Caixa** | Realizado vs. projetado mensal, por safra |
| **Estoque** | Gestão de grãos em armazém |
| **Endividamento** | Dívidas bancárias, indicadores e cronograma |
| **Balanço** | Ativo, passivo e patrimônio líquido |
| **DRE** | Demonstrativo de resultado por safra |
| **Projeção** | Cenários de projeção avançados |

## Dados

Todos os dados são importados via planilhas Excel (`.xlsx`) e armazenados localmente no **IndexedDB** do navegador — sem backend próprio. Cada usuário/cliente tem seus dados isolados por chave no IndexedDB.
