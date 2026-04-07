alter table public.calcir_analises
add column if not exists is_base_padrao boolean not null default false;

create unique index if not exists uq_calcir_analises_base_padrao_por_cliente
on public.calcir_analises (cliente_id)
where is_base_padrao = true;

create table if not exists public.calcir_analise_payloads (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references public.calcir_analises(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analise_id)
);

create index if not exists idx_calcir_analise_payloads_cliente_id
on public.calcir_analise_payloads (cliente_id);

create or replace function public.set_calcir_analise_payloads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_calcir_analise_payloads_updated_at on public.calcir_analise_payloads;
create trigger trg_set_calcir_analise_payloads_updated_at
before update on public.calcir_analise_payloads
for each row
execute function public.set_calcir_analise_payloads_updated_at();

create or replace function public.validate_calcir_analise_payloads()
returns trigger
language plpgsql
as $$
declare
  v_cliente_analise uuid;
begin
  select cliente_id
    into v_cliente_analise
  from public.calcir_analises
  where id = new.analise_id;

  if v_cliente_analise is null then
    raise exception 'analise_id inválido para payload';
  end if;

  if v_cliente_analise is distinct from new.cliente_id then
    raise exception 'cliente_id do payload deve ser o mesmo da análise';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_calcir_analise_payloads on public.calcir_analise_payloads;
create trigger trg_validate_calcir_analise_payloads
before insert or update on public.calcir_analise_payloads
for each row
execute function public.validate_calcir_analise_payloads();

alter table public.calcir_analise_payloads enable row level security;

drop policy if exists calcir_analise_payloads_consultor_manage on public.calcir_analise_payloads;
create policy calcir_analise_payloads_consultor_manage
on public.calcir_analise_payloads
for all
using (is_consultant_for_client(auth.uid(), cliente_id))
with check (is_consultant_for_client(auth.uid(), cliente_id));

drop policy if exists calcir_analise_payloads_cliente_read on public.calcir_analise_payloads;
create policy calcir_analise_payloads_cliente_read
on public.calcir_analise_payloads
for select
using (is_cliente_user(auth.uid(), cliente_id));