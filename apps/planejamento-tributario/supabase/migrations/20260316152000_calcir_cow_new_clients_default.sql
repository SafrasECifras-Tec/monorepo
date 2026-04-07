-- ============================================================
-- CALCIR COW rollout policy
-- - Clientes atuais ficam no legado (flag false)
-- - Clientes novos entram com COW por padrão (default true)
-- ============================================================

update public.config_cliente
set calcir_cow_enabled = false;

alter table public.config_cliente
  alter column calcir_cow_enabled set default true;
