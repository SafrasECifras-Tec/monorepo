-- ============================================================
-- CALCIR COW (Parte 1): fundação de dados para overrides
-- Entidades iniciais: receitas e despesas
-- ============================================================

create table if not exists public.calcir_receitas_overrides (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  analise_id uuid not null references public.calcir_analises(id) on delete cascade,
  source_receita_id uuid not null references public.receitas(id) on delete cascade,

  produto text,
  obs text,
  entidade text check (entidade in ('PF', 'PJ')),
  pis_cofins boolean,
  mes text,
  quantidade numeric,
  valor_unit numeric,
  total numeric,

  is_deleted boolean not null default false,
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_calcir_receitas_overrides_analise_source unique (analise_id, source_receita_id)
);

create table if not exists public.calcir_despesas_overrides (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  analise_id uuid not null references public.calcir_analises(id) on delete cascade,
  source_despesa_id uuid not null references public.despesas(id) on delete cascade,

  descricao text,
  obs text,
  total_ano_anterior numeric,
  realizado numeric,
  a_realizar numeric,
  total numeric,
  credito_ibs_cbs text check (credito_ibs_cbs in ('cheia', 'reducao60', 'diesel', 'simples_nacional', 'sem_credito')),

  is_deleted boolean not null default false,
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_calcir_despesas_overrides_analise_source unique (analise_id, source_despesa_id)
);

create index if not exists idx_cro_analise_source
on public.calcir_receitas_overrides (analise_id, source_receita_id);

create index if not exists idx_cro_cliente_analise
on public.calcir_receitas_overrides (cliente_id, analise_id);

create index if not exists idx_cdo_analise_source
on public.calcir_despesas_overrides (analise_id, source_despesa_id);

create index if not exists idx_cdo_cliente_analise
on public.calcir_despesas_overrides (cliente_id, analise_id);

create or replace function public.set_calcir_receitas_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_calcir_receitas_overrides_updated_at on public.calcir_receitas_overrides;
create trigger trg_set_calcir_receitas_overrides_updated_at
before update on public.calcir_receitas_overrides
for each row
execute function public.set_calcir_receitas_overrides_updated_at();

create or replace function public.set_calcir_despesas_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_calcir_despesas_overrides_updated_at on public.calcir_despesas_overrides;
create trigger trg_set_calcir_despesas_overrides_updated_at
before update on public.calcir_despesas_overrides
for each row
execute function public.set_calcir_despesas_overrides_updated_at();

create or replace function public.validate_calcir_receitas_overrides()
returns trigger
language plpgsql
as $$
declare
  v_cliente_analise uuid;
  v_cliente_source uuid;
begin
  select cliente_id
    into v_cliente_analise
  from public.calcir_analises
  where id = new.analise_id;

  if v_cliente_analise is null then
    raise exception 'analise_id inválido para calcir_receitas_overrides';
  end if;

  select cliente_id
    into v_cliente_source
  from public.receitas
  where id = new.source_receita_id;

  if v_cliente_source is null then
    raise exception 'source_receita_id inválido para calcir_receitas_overrides';
  end if;

  if new.cliente_id is distinct from v_cliente_analise
     or new.cliente_id is distinct from v_cliente_source then
    raise exception 'cliente_id inconsistente em calcir_receitas_overrides';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_calcir_receitas_overrides on public.calcir_receitas_overrides;
create trigger trg_validate_calcir_receitas_overrides
before insert or update on public.calcir_receitas_overrides
for each row
execute function public.validate_calcir_receitas_overrides();

create or replace function public.validate_calcir_despesas_overrides()
returns trigger
language plpgsql
as $$
declare
  v_cliente_analise uuid;
  v_cliente_source uuid;
begin
  select cliente_id
    into v_cliente_analise
  from public.calcir_analises
  where id = new.analise_id;

  if v_cliente_analise is null then
    raise exception 'analise_id inválido para calcir_despesas_overrides';
  end if;

  select cliente_id
    into v_cliente_source
  from public.despesas
  where id = new.source_despesa_id;

  if v_cliente_source is null then
    raise exception 'source_despesa_id inválido para calcir_despesas_overrides';
  end if;

  if new.cliente_id is distinct from v_cliente_analise
     or new.cliente_id is distinct from v_cliente_source then
    raise exception 'cliente_id inconsistente em calcir_despesas_overrides';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_calcir_despesas_overrides on public.calcir_despesas_overrides;
create trigger trg_validate_calcir_despesas_overrides
before insert or update on public.calcir_despesas_overrides
for each row
execute function public.validate_calcir_despesas_overrides();

alter table public.calcir_receitas_overrides enable row level security;
alter table public.calcir_despesas_overrides enable row level security;

drop policy if exists calcir_receitas_overrides_consultor_manage on public.calcir_receitas_overrides;
create policy calcir_receitas_overrides_consultor_manage
on public.calcir_receitas_overrides
for all
using (is_consultant_for_client(auth.uid(), cliente_id))
with check (is_consultant_for_client(auth.uid(), cliente_id));

drop policy if exists calcir_receitas_overrides_cliente_read on public.calcir_receitas_overrides;
create policy calcir_receitas_overrides_cliente_read
on public.calcir_receitas_overrides
for select
using (is_cliente_user(auth.uid(), cliente_id));

drop policy if exists calcir_despesas_overrides_consultor_manage on public.calcir_despesas_overrides;
create policy calcir_despesas_overrides_consultor_manage
on public.calcir_despesas_overrides
for all
using (is_consultant_for_client(auth.uid(), cliente_id))
with check (is_consultant_for_client(auth.uid(), cliente_id));

drop policy if exists calcir_despesas_overrides_cliente_read on public.calcir_despesas_overrides;
create policy calcir_despesas_overrides_cliente_read
on public.calcir_despesas_overrides
for select
using (is_cliente_user(auth.uid(), cliente_id));
