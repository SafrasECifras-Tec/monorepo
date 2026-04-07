
-- Role enum
CREATE TYPE public.app_role AS ENUM ('consultor', 'cliente');

-- User roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Security definer function to check role without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Auto-assign 'consultor' role on signup (default)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  
  -- Default role is consultor; can be overridden via metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'consultor'
  ));
  
  RETURN NEW;
END;
$$;

-- For cliente role: they can see clientes row where their profile is linked
-- Create a table linking client users to their cliente record
CREATE TABLE public.cliente_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cliente_id)
);
ALTER TABLE public.cliente_users ENABLE ROW LEVEL SECURITY;

-- Cliente users can see their own associations
CREATE POLICY "Users see own cliente links" ON public.cliente_users
  FOR SELECT USING (auth.uid() = user_id);

-- Consultors can manage cliente_users for their clients
CREATE POLICY "Consultors manage cliente_users" ON public.cliente_users
  FOR ALL USING (
    public.has_role(auth.uid(), 'consultor') AND
    public.is_consultant_for_client(auth.uid(), cliente_id)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'consultor') AND
    public.is_consultant_for_client(auth.uid(), cliente_id)
  );

-- Update data table RLS to also allow cliente role users (read-only)
-- Helper: check if user is a cliente user for a given cliente_id
CREATE OR REPLACE FUNCTION public.is_cliente_user(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cliente_users
    WHERE user_id = _user_id AND cliente_id = _cliente_id
  );
$$;

-- Add SELECT policies for cliente users on data tables
CREATE POLICY "Clientes read own receitas" ON public.receitas
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own despesas" ON public.despesas
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own parceiros" ON public.parceiros
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own vendas_imobilizado" ON public.vendas_imobilizado
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own imobilizado_aquisicao" ON public.imobilizado_aquisicao
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own config_cliente" ON public.config_cliente
  FOR SELECT USING (public.is_cliente_user(auth.uid(), cliente_id));

CREATE POLICY "Clientes read own clientes" ON public.clientes
  FOR SELECT USING (public.is_cliente_user(auth.uid(), id));

-- Parceiro-linked tables for cliente users
CREATE POLICY "Clientes read own atividade_rural" ON public.atividade_rural_particular
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parceiros p
      WHERE p.id = atividade_rural_particular.parceiro_id
      AND public.is_cliente_user(auth.uid(), p.cliente_id)
    )
  );

CREATE POLICY "Clientes read own rendimentos" ON public.rendimentos_particulares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parceiros p
      WHERE p.id = rendimentos_particulares.parceiro_id
      AND public.is_cliente_user(auth.uid(), p.cliente_id)
    )
  );

CREATE POLICY "Clientes read own retencoes" ON public.retencoes_particulares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parceiros p
      WHERE p.id = retencoes_particulares.parceiro_id
      AND public.is_cliente_user(auth.uid(), p.cliente_id)
    )
  );
