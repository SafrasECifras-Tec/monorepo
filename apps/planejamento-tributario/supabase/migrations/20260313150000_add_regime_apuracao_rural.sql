alter table public.config_cliente
add column if not exists regime_apuracao_rural jsonb default '{}'::jsonb;
