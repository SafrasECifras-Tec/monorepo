-- ============================================================
-- Migration: Share Farm Collaboration
-- Permite múltiplos consultores editarem a mesma fazenda.
-- ============================================================

-- 1. Role column on consultor_clientes (owner vs editor)
ALTER TABLE public.consultor_clientes
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner'
  CONSTRAINT consultor_clientes_role_check CHECK (role IN ('owner', 'editor'));

-- 2. updated_at columns for optimistic locking / conflict detection
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.parceiros
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.vendas_imobilizado
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.imobilizado_aquisicao
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.config_cliente
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Reusable trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to each table
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clientes', 'receitas', 'despesas', 'parceiros',
    'vendas_imobilizado', 'imobilizado_aquisicao', 'config_cliente'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I; '
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- 4. Helper: check if user is the owner of a farm
CREATE OR REPLACE FUNCTION public.is_farm_owner(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultor_clientes
    WHERE consultor_id = _user_id
      AND cliente_id = _cliente_id
      AND role = 'owner'
  );
$$;

-- 5. RPC: get max updated_at across all data tables for conflict detection
CREATE OR REPLACE FUNCTION public.get_farm_data_watermark(_cliente_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT GREATEST(
    (SELECT MAX(updated_at) FROM public.clientes WHERE id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.receitas WHERE cliente_id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.despesas WHERE cliente_id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.parceiros WHERE cliente_id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.vendas_imobilizado WHERE cliente_id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.imobilizado_aquisicao WHERE cliente_id = _cliente_id),
    (SELECT MAX(updated_at) FROM public.config_cliente WHERE cliente_id = _cliente_id)
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- 6. Allow consultors to search other consultor profiles (for share modal)
CREATE POLICY "Consultors can search consultor profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND public.has_role(id, 'consultor')
  );

-- 7. Owners can share farms (insert editor rows for other consultors)
CREATE POLICY "Owners can share farms"
  ON public.consultor_clientes
  FOR INSERT
  WITH CHECK (
    public.is_farm_owner(auth.uid(), cliente_id)
    AND role = 'editor'
    AND consultor_id != auth.uid()
  );

-- 8. Owners can unshare farms (remove editors, not themselves)
CREATE POLICY "Owners can unshare farms"
  ON public.consultor_clientes
  FOR DELETE
  USING (
    public.is_farm_owner(auth.uid(), cliente_id)
    AND consultor_id != auth.uid()
  );

-- 9. Collaborators can see all collaborators for their shared farms
--    (needed for the share modal to show current collaborators)
CREATE POLICY "Collaborators see farm collaborators"
  ON public.consultor_clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultor_clientes cc
      WHERE cc.consultor_id = auth.uid()
        AND cc.cliente_id = consultor_clientes.cliente_id
    )
  );
