-- Fix: a policy "Collaborators see farm collaborators" criada na migration
-- anterior fazia SELECT FROM consultor_clientes dentro de uma policy ON
-- consultor_clientes, causando recursão infinita → 500 Internal Server Error.
--
-- Solução: usar is_consultant_for_client() que é SECURITY DEFINER e
-- executa sem passar pelo RLS, quebrando o ciclo de recursão.

DROP POLICY IF EXISTS "Collaborators see farm collaborators" ON public.consultor_clientes;

CREATE POLICY "Collaborators see farm collaborators"
  ON public.consultor_clientes
  FOR SELECT
  USING (
    public.is_consultant_for_client(auth.uid(), cliente_id)
  );
