
-- =============================================
-- PASSO 1: Tabelas Estruturadas
-- =============================================

-- Clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  documento text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Parceiros
CREATE TABLE public.parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  cpf text,
  perc_receitas numeric NOT NULL DEFAULT 0,
  perc_despesas numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.parceiros FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receitas (projecoes + realizacoes via coluna tipo)
CREATE TABLE public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL DEFAULT 'realizacao',
  produto text NOT NULL DEFAULT '',
  obs text DEFAULT '',
  entidade text NOT NULL DEFAULT 'PJ',
  pis_cofins boolean NOT NULL DEFAULT false,
  mes text NOT NULL DEFAULT 'Jan',
  quantidade numeric NOT NULL DEFAULT 0,
  valor_unit numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.receitas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Despesas
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL DEFAULT '',
  obs text DEFAULT '',
  realizado numeric NOT NULL DEFAULT 0,
  a_realizar numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.despesas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vendas Imobilizado
CREATE TABLE public.vendas_imobilizado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL DEFAULT '',
  entidade text NOT NULL DEFAULT 'PJ',
  mes text NOT NULL DEFAULT 'Jan',
  realizado numeric NOT NULL DEFAULT 0,
  projetado numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendas_imobilizado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.vendas_imobilizado FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Imobilizado Aquisicao
CREATE TABLE public.imobilizado_aquisicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL DEFAULT '',
  entidade text NOT NULL DEFAULT 'PJ',
  realizado numeric NOT NULL DEFAULT 0,
  a_realizar numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.imobilizado_aquisicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.imobilizado_aquisicao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Atividade Rural Particular (arrays de 12 meses)
CREATE TABLE public.atividade_rural_particular (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id uuid REFERENCES public.parceiros(id) ON DELETE CASCADE NOT NULL,
  receitas numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  despesas numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.atividade_rural_particular ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.atividade_rural_particular FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rendimentos Particulares
CREATE TABLE public.rendimentos_particulares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id uuid REFERENCES public.parceiros(id) ON DELETE CASCADE NOT NULL,
  dividendos numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  alugueis numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  pro_labore numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  rend_aplicacoes numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  rend_protegidos numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  doacoes numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  ganho_capital numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rendimentos_particulares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.rendimentos_particulares FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Retencoes Particulares
CREATE TABLE public.retencoes_particulares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id uuid REFERENCES public.parceiros(id) ON DELETE CASCADE NOT NULL,
  irrf_dividendos numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  irrf_alugueis numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  irrf_pro_labore numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  irrf_rend_aplicacoes numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  irrf_operacoes_bolsa numeric[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retencoes_particulares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.retencoes_particulares FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Config Cliente
CREATE TABLE public.config_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  demais_despesas_pj numeric NOT NULL DEFAULT 0,
  lucro_acumulado_pj numeric NOT NULL DEFAULT 0,
  prejuizos_anteriores jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.config_cliente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.config_cliente FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- PASSO 2: Tabelas de Staging
-- =============================================

-- Staging Imports
CREATE TABLE public.staging_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  source_system text NOT NULL DEFAULT 'connectere',
  raw_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  mapped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staging_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.staging_imports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Staging Field Mappings
CREATE TABLE public.staging_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  source_field text NOT NULL,
  target_table text NOT NULL,
  target_field text NOT NULL,
  transform_expression text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staging_field_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.staging_field_mappings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client Integrations
CREATE TABLE public.client_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  source_system text NOT NULL DEFAULT 'connectere',
  source_token text NOT NULL,
  last_sync_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, source_system)
);
ALTER TABLE public.client_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.client_integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
