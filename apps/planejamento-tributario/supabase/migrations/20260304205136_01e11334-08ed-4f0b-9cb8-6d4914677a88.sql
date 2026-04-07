CREATE POLICY "Consultors can view client user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cliente_users cu
    JOIN public.consultor_clientes cc ON cc.cliente_id = cu.cliente_id
    WHERE cu.user_id = profiles.id
      AND cc.consultor_id = auth.uid()
  )
);