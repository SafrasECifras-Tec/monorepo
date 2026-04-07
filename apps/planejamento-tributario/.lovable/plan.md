

## Plano: Arquitetura Multi-Sistema de Integração

### Contexto

Hoje a integração está 100% acoplada ao Connectere: tabela `client_integrations` com `source_system = "connectere"` fixo, Edge Function dedicada, e UI com módulos hardcoded. Precisamos generalizar para suportar N sistemas (Connectere, Aegro, futuros) com a regra de que **cada fazenda pode ter no maximo 1 sistema integrado**.

### API Aegro - Resumo Tecnico

- Base URL: `https://app.aegro.com.br`
- Auth: Bearer token (API key por fazenda)
- Chamadas diretas (sincrona, REST padrao) - sem pattern async start/check
- Endpoints relevantes para CALCIR:
  - **Lancamentos Financeiros** (`/pub/v1/bills`) - receitas e despesas
  - **Parcelas** (`/pub/v1/installments/filter`) - pagamentos/quitacoes
  - **Patrimônios** (`/pub/v1/assets/filter`) - imobilizado
  - **Safras** (`/pub/v1/crops/filter`) - contexto agricola
  - **Atividades/Realizacoes** (`/pub/v1/activities/realizations/filter`) - custos operacionais

### Implementacao

#### 1. Migração de banco: restrição de unicidade por cliente

```sql
-- Garantir que cada cliente tenha no maximo 1 integração ativa
ALTER TABLE client_integrations 
  ADD CONSTRAINT unique_active_integration_per_client 
  UNIQUE (cliente_id);
```

Isso substitui a constraint atual `(cliente_id, source_system)` para impedir 2 sistemas na mesma fazenda.

#### 2. Refatorar UI da aba Integração

Substituir a tela atual (que assume Connectere) por um fluxo em etapas:

**Etapa 1 - Seleção do Sistema:** Cards visuais para escolher entre Connectere e Aegro (e futuros). Se ja existe integração ativa, mostra o sistema atual com opção de trocar (com confirmação de que dados do sistema anterior serão removidos).

**Etapa 2 - Configuração:** Formulário dinâmico por sistema:
- Connectere: campo de token + seleção de módulos + período
- Aegro: campo de API key + seleção de safra (futuramente)

**Etapa 3 - Sincronização:** Botão de sync com progresso. A orquestração varia por sistema:
- Connectere: mantém o pattern async start/check existente
- Aegro: chamadas diretas sequenciais por endpoint

#### 3. Nova Edge Function: `sync-aegro`

Criar `supabase/functions/sync-aegro/index.ts`:
- Recebe `cliente_id` e `action` (por enquanto apenas `sync`)
- Busca token na `client_integrations` onde `source_system = "aegro"`
- Chama endpoints Aegro com `Authorization: Bearer <token>`
- Mapeia lançamentos financeiros para `receitas`/`despesas` (tipo = receita ou despesa no Aegro)
- Salva com `source_system = "aegro"` e `source_modulo` por endpoint
- Usa o mesmo pattern de `batchUpsert` (delete + insert por source_modulo)

#### 4. Camada de serviço

Em `src/services/supabaseData.ts`, adicionar:
- `syncAegroStart(clienteId)` - invoca a Edge Function sync-aegro
- Manter `syncConnectereStart/Check` existentes

#### 5. Refatorar `Configuracoes.tsx`

Extrair componentes:
- `IntegrationSelector` - cards de seleção do sistema
- `ConnectereConfig` - configuração e sync específica Connectere (código atual)
- `AegroConfig` - configuração e sync específica Aegro
- O componente pai renderiza o sub-componente correto baseado no `source_system` salvo

#### 6. Atualizar config.toml

```toml
[functions.sync-aegro]
verify_jwt = false
```

### Arquivos-alvo

- `src/pages/Configuracoes.tsx` - refatorar aba de integração
- `src/components/configuracoes/IntegrationSelector.tsx` (novo)
- `src/components/configuracoes/ConnectereSync.tsx` (novo - extraído do atual)
- `src/components/configuracoes/AegroSync.tsx` (novo)
- `src/services/supabaseData.ts` - novos métodos Aegro
- `supabase/functions/sync-aegro/index.ts` (novo)
- `supabase/config.toml` - registrar nova function
- Migração SQL para constraint de unicidade

### Decisões de design

- A regra "1 sistema por fazenda" é imposta no banco (unique constraint) e na UI (seleção exclusiva)
- Trocar de sistema exige confirmação e limpa dados `source_system` do anterior
- Cada sistema tem sua Edge Function independente para manter isolamento e facilitar manutenção
- O mapeamento Aegro começa pelos endpoints financeiros (bills/installments) que mapeiam diretamente para receitas/despesas - os demais endpoints podem ser adicionados incrementalmente

