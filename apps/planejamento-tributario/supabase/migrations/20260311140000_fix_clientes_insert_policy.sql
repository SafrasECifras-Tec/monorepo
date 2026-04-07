-- Fix: ensure consultors can insert new clients (fazendas)
-- The original INSERT policy may have been lost or never applied correctly.
drop policy if exists "Consultors can insert clients" on public.clientes;
create policy "Consultors can insert clients"
  on public.clientes
  for insert
  to authenticated
  with check (true);
