alter table public.despesas
  add column if not exists total_ano_anterior numeric not null default 0;
