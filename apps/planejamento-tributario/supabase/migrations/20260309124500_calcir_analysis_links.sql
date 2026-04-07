create table if not exists public.calcir_analises (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  descricao text,
  tipo text not null check (tipo in ('base', 'consolidada')),
  status text not null default 'rascunho' check (status in ('rascunho', 'fechada', 'arquivada')),
  ano_referencia integer check (ano_referencia between 2000 and 2100),
  regra_deduplicacao text not null default 'cpf_periodo_origem' check (regra_deduplicacao in ('cpf_periodo_origem', 'cpf_global')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cliente_id, nome)
);

create index if not exists idx_calcir_analises_cliente_id on public.calcir_analises (cliente_id);
create index if not exists idx_calcir_analises_tipo on public.calcir_analises (tipo);

create or replace function public.set_calcir_analises_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_calcir_analises_updated_at on public.calcir_analises;
create trigger trg_set_calcir_analises_updated_at
before update on public.calcir_analises
for each row
execute function public.set_calcir_analises_updated_at();

create table if not exists public.calcir_analise_origens (
  id uuid primary key default gen_random_uuid(),
  analise_consolidada_id uuid not null references public.calcir_analises(id) on delete cascade,
  analise_origem_id uuid not null references public.calcir_analises(id) on delete cascade,
  ordem integer not null default 1 check (ordem > 0),
  regra_deduplicacao_override text check (regra_deduplicacao_override in ('cpf_periodo_origem', 'cpf_global')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analise_consolidada_id, analise_origem_id),
  check (analise_consolidada_id <> analise_origem_id)
);

create index if not exists idx_calcir_analise_origens_consolidada_id on public.calcir_analise_origens (analise_consolidada_id);
create index if not exists idx_calcir_analise_origens_origem_id on public.calcir_analise_origens (analise_origem_id);

create or replace function public.set_calcir_analise_origens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_calcir_analise_origens_updated_at on public.calcir_analise_origens;
create trigger trg_set_calcir_analise_origens_updated_at
before update on public.calcir_analise_origens
for each row
execute function public.set_calcir_analise_origens_updated_at();

create or replace function public.validate_calcir_analise_origens()
returns trigger
language plpgsql
as $$
declare
  v_tipo_consolidada text;
  v_tipo_origem text;
  v_cliente_consolidada uuid;
  v_cliente_origem uuid;
begin
  select tipo, cliente_id
    into v_tipo_consolidada, v_cliente_consolidada
  from public.calcir_analises
  where id = new.analise_consolidada_id;

  select tipo, cliente_id
    into v_tipo_origem, v_cliente_origem
  from public.calcir_analises
  where id = new.analise_origem_id;

  if v_tipo_consolidada is distinct from 'consolidada' then
    raise exception 'analise_consolidada_id deve ser do tipo consolidada';
  end if;

  if v_tipo_origem is distinct from 'base' then
    raise exception 'analise_origem_id deve ser do tipo base';
  end if;

  if v_cliente_consolidada is distinct from v_cliente_origem then
    raise exception 'análises devem pertencer ao mesmo cliente';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_calcir_analise_origens on public.calcir_analise_origens;
create trigger trg_validate_calcir_analise_origens
before insert or update on public.calcir_analise_origens
for each row
execute function public.validate_calcir_analise_origens();

alter table public.calcir_analises enable row level security;
alter table public.calcir_analise_origens enable row level security;

drop policy if exists calcir_analises_consultor_manage on public.calcir_analises;
create policy calcir_analises_consultor_manage
on public.calcir_analises
for all
using (is_consultant_for_client(auth.uid(), cliente_id))
with check (is_consultant_for_client(auth.uid(), cliente_id));

drop policy if exists calcir_analises_cliente_read on public.calcir_analises;
create policy calcir_analises_cliente_read
on public.calcir_analises
for select
using (is_cliente_user(auth.uid(), cliente_id));

drop policy if exists calcir_analise_origens_consultor_manage on public.calcir_analise_origens;
create policy calcir_analise_origens_consultor_manage
on public.calcir_analise_origens
for all
using (
  exists (
    select 1
    from public.calcir_analises a
    where a.id = analise_consolidada_id
      and is_consultant_for_client(auth.uid(), a.cliente_id)
  )
)
with check (
  exists (
    select 1
    from public.calcir_analises a
    where a.id = analise_consolidada_id
      and is_consultant_for_client(auth.uid(), a.cliente_id)
  )
);

drop policy if exists calcir_analise_origens_cliente_read on public.calcir_analise_origens;
create policy calcir_analise_origens_cliente_read
on public.calcir_analise_origens
for select
using (
  exists (
    select 1
    from public.calcir_analises a
    where a.id = analise_consolidada_id
      and is_cliente_user(auth.uid(), a.cliente_id)
  )
);

-- Correção defensiva de policies legadas permissivas criadas na migration inicial.
drop policy if exists "Allow all for authenticated" on public.clientes;
drop policy if exists "Allow all for authenticated" on public.parceiros;
drop policy if exists "Allow all for authenticated" on public.receitas;
drop policy if exists "Allow all for authenticated" on public.despesas;
drop policy if exists "Allow all for authenticated" on public.vendas_imobilizado;
drop policy if exists "Allow all for authenticated" on public.imobilizado_aquisicao;
drop policy if exists "Allow all for authenticated" on public.atividade_rural_particular;
drop policy if exists "Allow all for authenticated" on public.rendimentos_particulares;
drop policy if exists "Allow all for authenticated" on public.retencoes_particulares;
drop policy if exists "Allow all for authenticated" on public.config_cliente;
drop policy if exists "Allow all for authenticated" on public.staging_imports;
drop policy if exists "Allow all for authenticated" on public.staging_field_mappings;
drop policy if exists "Allow all for authenticated" on public.client_integrations;