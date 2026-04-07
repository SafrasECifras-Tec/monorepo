
-- Profiles table (consultor)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Consultor-Cliente N:N
CREATE TABLE public.consultor_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(consultor_id, cliente_id)
);
ALTER TABLE public.consultor_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultors see own associations" ON public.consultor_clientes FOR SELECT USING (auth.uid() = consultor_id);
CREATE POLICY "Consultors can insert own associations" ON public.consultor_clientes FOR INSERT WITH CHECK (auth.uid() = consultor_id);
CREATE POLICY "Consultors can delete own associations" ON public.consultor_clientes FOR DELETE USING (auth.uid() = consultor_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if user is consultant for a client
CREATE OR REPLACE FUNCTION public.is_consultant_for_client(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultor_clientes
    WHERE consultor_id = _user_id AND cliente_id = _cliente_id
  );
$$;

-- Update RLS on existing tables to use consultant check
-- clientes
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.clientes;
CREATE POLICY "Consultors see own clients" ON public.clientes FOR SELECT USING (
  public.is_consultant_for_client(auth.uid(), id)
);
CREATE POLICY "Consultors can insert clients" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Consultors can update own clients" ON public.clientes FOR UPDATE USING (
  public.is_consultant_for_client(auth.uid(), id)
);
CREATE POLICY "Consultors can delete own clients" ON public.clientes FOR DELETE USING (
  public.is_consultant_for_client(auth.uid(), id)
);

-- receitas
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.receitas;
CREATE POLICY "Consultors manage receitas" ON public.receitas FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- despesas
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.despesas;
CREATE POLICY "Consultors manage despesas" ON public.despesas FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- parceiros
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.parceiros;
CREATE POLICY "Consultors manage parceiros" ON public.parceiros FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- vendas_imobilizado
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.vendas_imobilizado;
CREATE POLICY "Consultors manage vendas_imobilizado" ON public.vendas_imobilizado FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- imobilizado_aquisicao
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.imobilizado_aquisicao;
CREATE POLICY "Consultors manage imobilizado_aquisicao" ON public.imobilizado_aquisicao FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- config_cliente
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.config_cliente;
CREATE POLICY "Consultors manage config_cliente" ON public.config_cliente FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- client_integrations
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.client_integrations;
CREATE POLICY "Consultors manage client_integrations" ON public.client_integrations FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- staging_imports
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.staging_imports;
CREATE POLICY "Consultors manage staging_imports" ON public.staging_imports FOR ALL USING (
  public.is_consultant_for_client(auth.uid(), cliente_id)
) WITH CHECK (
  public.is_consultant_for_client(auth.uid(), cliente_id)
);

-- atividade_rural_particular (linked via parceiro -> cliente)
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.atividade_rural_particular;
CREATE POLICY "Consultors manage atividade_rural" ON public.atividade_rural_particular FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = atividade_rural_particular.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = atividade_rural_particular.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
);

-- rendimentos_particulares
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.rendimentos_particulares;
CREATE POLICY "Consultors manage rendimentos" ON public.rendimentos_particulares FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = rendimentos_particulares.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = rendimentos_particulares.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
);

-- retencoes_particulares
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.retencoes_particulares;
CREATE POLICY "Consultors manage retencoes" ON public.retencoes_particulares FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = retencoes_particulares.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.id = retencoes_particulares.parceiro_id
    AND public.is_consultant_for_client(auth.uid(), p.cliente_id)
  )
);

-- staging_field_mappings (global config, allow all authenticated)
DROP POLICY IF EXISTS "Allow all for authenticated " ON public.staging_field_mappings;
CREATE POLICY "Authenticated can read mappings" ON public.staging_field_mappings FOR SELECT USING (true);
