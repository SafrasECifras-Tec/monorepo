-- ============================================================
-- CALCIR COW (Parte 2): backend + migração gradual
-- - Feature flag por cliente
-- - Controle de migração por análise
-- - RPCs de leitura efetiva (receitas/despesas)
-- - RPCs de escrita COW (upsert + soft delete)
-- ============================================================

alter table public.config_cliente
  add column if not exists calcir_cow_enabled boolean not null default false;

alter table public.calcir_analises
  add column if not exists cow_migrated_at timestamptz;

create table if not exists public.calcir_cow_migration_issues (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  analise_id uuid not null references public.calcir_analises(id) on delete cascade,
  entity_type text not null check (entity_type in ('receita', 'despesa')),
  payload_item_id text,
  source_id uuid,
  reason text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_calcir_cow_migration_issues_cliente_analise
  on public.calcir_cow_migration_issues (cliente_id, analise_id);

create index if not exists idx_calcir_cow_migration_issues_entity
  on public.calcir_cow_migration_issues (entity_type, resolved);

alter table public.calcir_cow_migration_issues enable row level security;

drop policy if exists calcir_cow_migration_issues_consultor_manage on public.calcir_cow_migration_issues;
create policy calcir_cow_migration_issues_consultor_manage
on public.calcir_cow_migration_issues
for all
using (is_consultant_for_client(auth.uid(), cliente_id))
with check (is_consultant_for_client(auth.uid(), cliente_id));

drop policy if exists calcir_cow_migration_issues_cliente_read on public.calcir_cow_migration_issues;
create policy calcir_cow_migration_issues_cliente_read
on public.calcir_cow_migration_issues
for select
using (is_cliente_user(auth.uid(), cliente_id));

create or replace function public.calcir_get_receitas_efetivas(
  p_cliente_id uuid,
  p_analise_id uuid
)
returns table (
  source_id uuid,
  is_override boolean,
  row_version integer,
  id uuid,
  cliente_id uuid,
  tipo text,
  produto text,
  obs text,
  entidade text,
  pis_cofins boolean,
  mes text,
  quantidade numeric,
  valor_unit numeric,
  total numeric,
  created_at timestamptz,
  source_system text,
  source_modulo text,
  source_documento text,
  source_row_hash text
)
language plpgsql
as $$
declare
  v_is_base boolean;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    return query
    select
      r.id as source_id,
      false as is_override,
      1 as row_version,
      r.id,
      r.cliente_id,
      r.tipo,
      r.produto,
      r.obs,
      r.entidade,
      r.pis_cofins,
      r.mes,
      r.quantidade,
      r.valor_unit,
      r.total,
      r.created_at,
      r.source_system,
      r.source_modulo,
      r.source_documento,
      r.source_row_hash
    from public.receitas r
    where r.cliente_id = p_cliente_id;

    return;
  end if;

  return query
  select
    r.id as source_id,
    (o.id is not null) as is_override,
    coalesce(o.row_version, 1) as row_version,
    r.id,
    r.cliente_id,
    r.tipo,
    coalesce(o.produto, r.produto) as produto,
    coalesce(o.obs, r.obs) as obs,
    coalesce(o.entidade, r.entidade) as entidade,
    coalesce(o.pis_cofins, r.pis_cofins) as pis_cofins,
    coalesce(o.mes, r.mes) as mes,
    coalesce(o.quantidade, r.quantidade) as quantidade,
    coalesce(o.valor_unit, r.valor_unit) as valor_unit,
    coalesce(o.total, r.total) as total,
    r.created_at,
    r.source_system,
    r.source_modulo,
    r.source_documento,
    r.source_row_hash
  from public.receitas r
  left join public.calcir_receitas_overrides o
    on o.source_receita_id = r.id
   and o.analise_id = p_analise_id
   and o.cliente_id = p_cliente_id
  where r.cliente_id = p_cliente_id
    and coalesce(o.is_deleted, false) = false;
end;
$$;

create or replace function public.calcir_get_despesas_efetivas(
  p_cliente_id uuid,
  p_analise_id uuid
)
returns table (
  source_id uuid,
  is_override boolean,
  row_version integer,
  id uuid,
  cliente_id uuid,
  descricao text,
  obs text,
  total_ano_anterior numeric,
  realizado numeric,
  a_realizar numeric,
  total numeric,
  credito_ibs_cbs text,
  created_at timestamptz,
  source_system text,
  source_modulo text,
  source_documento text,
  source_row_hash text
)
language plpgsql
as $$
declare
  v_is_base boolean;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    return query
    select
      d.id as source_id,
      false as is_override,
      1 as row_version,
      d.id,
      d.cliente_id,
      d.descricao,
      d.obs,
      d.total_ano_anterior,
      d.realizado,
      d.a_realizar,
      d.total,
      d.credito_ibs_cbs,
      d.created_at,
      d.source_system,
      d.source_modulo,
      d.source_documento,
      d.source_row_hash
    from public.despesas d
    where d.cliente_id = p_cliente_id;

    return;
  end if;

  return query
  select
    d.id as source_id,
    (o.id is not null) as is_override,
    coalesce(o.row_version, 1) as row_version,
    d.id,
    d.cliente_id,
    coalesce(o.descricao, d.descricao) as descricao,
    coalesce(o.obs, d.obs) as obs,
    coalesce(o.total_ano_anterior, d.total_ano_anterior) as total_ano_anterior,
    coalesce(o.realizado, d.realizado) as realizado,
    coalesce(o.a_realizar, d.a_realizar) as a_realizar,
    coalesce(o.total, d.total) as total,
    coalesce(o.credito_ibs_cbs, d.credito_ibs_cbs) as credito_ibs_cbs,
    d.created_at,
    d.source_system,
    d.source_modulo,
    d.source_documento,
    d.source_row_hash
  from public.despesas d
  left join public.calcir_despesas_overrides o
    on o.source_despesa_id = d.id
   and o.analise_id = p_analise_id
   and o.cliente_id = p_cliente_id
  where d.cliente_id = p_cliente_id
    and coalesce(o.is_deleted, false) = false;
end;
$$;

create or replace function public.calcir_upsert_receita_override(
  p_cliente_id uuid,
  p_analise_id uuid,
  p_source_receita_id uuid,
  p_patch jsonb,
  p_expected_version integer default null
)
returns table (
  source_id uuid,
  row_version integer,
  is_override boolean
)
language plpgsql
as $$
declare
  v_is_base boolean;
  v_existing public.calcir_receitas_overrides%rowtype;
  v_row_version integer;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    raise exception 'CALCIR_COW_BASE_ANALYSIS_WRITE_NOT_ALLOWED';
  end if;

  select *
    into v_existing
  from public.calcir_receitas_overrides o
  where o.cliente_id = p_cliente_id
    and o.analise_id = p_analise_id
    and o.source_receita_id = p_source_receita_id
  for update;

  if not found then
    if p_expected_version is not null and p_expected_version <> 1 then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    insert into public.calcir_receitas_overrides (
      cliente_id,
      analise_id,
      source_receita_id,
      produto,
      obs,
      entidade,
      pis_cofins,
      mes,
      quantidade,
      valor_unit,
      total,
      is_deleted,
      row_version
    )
    values (
      p_cliente_id,
      p_analise_id,
      p_source_receita_id,
      case when p_patch ? 'produto' then (p_patch ->> 'produto') else null end,
      case when p_patch ? 'obs' then (p_patch ->> 'obs') else null end,
      case when p_patch ? 'entidade' then (p_patch ->> 'entidade') else null end,
      case when p_patch ? 'pis_cofins' then (p_patch ->> 'pis_cofins')::boolean else null end,
      case when p_patch ? 'mes' then (p_patch ->> 'mes') else null end,
      case when p_patch ? 'quantidade' then (p_patch ->> 'quantidade')::numeric else null end,
      case when p_patch ? 'valorUnit' then (p_patch ->> 'valorUnit')::numeric
           when p_patch ? 'valor_unit' then (p_patch ->> 'valor_unit')::numeric
           else null end,
      case when p_patch ? 'total' then (p_patch ->> 'total')::numeric else null end,
      false,
      1
    )
    returning public.calcir_receitas_overrides.row_version
      into v_row_version;
  else
    if p_expected_version is not null and v_existing.row_version <> p_expected_version then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    update public.calcir_receitas_overrides o
       set produto = case when p_patch ? 'produto' then (p_patch ->> 'produto') else o.produto end,
           obs = case when p_patch ? 'obs' then (p_patch ->> 'obs') else o.obs end,
           entidade = case when p_patch ? 'entidade' then (p_patch ->> 'entidade') else o.entidade end,
           pis_cofins = case when p_patch ? 'pis_cofins' then (p_patch ->> 'pis_cofins')::boolean else o.pis_cofins end,
           mes = case when p_patch ? 'mes' then (p_patch ->> 'mes') else o.mes end,
           quantidade = case when p_patch ? 'quantidade' then (p_patch ->> 'quantidade')::numeric else o.quantidade end,
           valor_unit = case when p_patch ? 'valorUnit' then (p_patch ->> 'valorUnit')::numeric
                             when p_patch ? 'valor_unit' then (p_patch ->> 'valor_unit')::numeric
                             else o.valor_unit end,
           total = case when p_patch ? 'total' then (p_patch ->> 'total')::numeric else o.total end,
           is_deleted = false,
           row_version = o.row_version + 1
     where o.id = v_existing.id
     returning public.calcir_receitas_overrides.row_version
       into v_row_version;
  end if;

  return query
  select p_source_receita_id, v_row_version, true;
end;
$$;

create or replace function public.calcir_upsert_despesa_override(
  p_cliente_id uuid,
  p_analise_id uuid,
  p_source_despesa_id uuid,
  p_patch jsonb,
  p_expected_version integer default null
)
returns table (
  source_id uuid,
  row_version integer,
  is_override boolean
)
language plpgsql
as $$
declare
  v_is_base boolean;
  v_existing public.calcir_despesas_overrides%rowtype;
  v_row_version integer;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    raise exception 'CALCIR_COW_BASE_ANALYSIS_WRITE_NOT_ALLOWED';
  end if;

  select *
    into v_existing
  from public.calcir_despesas_overrides o
  where o.cliente_id = p_cliente_id
    and o.analise_id = p_analise_id
    and o.source_despesa_id = p_source_despesa_id
  for update;

  if not found then
    if p_expected_version is not null and p_expected_version <> 1 then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    insert into public.calcir_despesas_overrides (
      cliente_id,
      analise_id,
      source_despesa_id,
      descricao,
      obs,
      total_ano_anterior,
      realizado,
      a_realizar,
      total,
      credito_ibs_cbs,
      is_deleted,
      row_version
    )
    values (
      p_cliente_id,
      p_analise_id,
      p_source_despesa_id,
      case when p_patch ? 'descricao' then (p_patch ->> 'descricao') else null end,
      case when p_patch ? 'obs' then (p_patch ->> 'obs') else null end,
      case when p_patch ? 'totalAnoAnterior' then (p_patch ->> 'totalAnoAnterior')::numeric
           when p_patch ? 'total_ano_anterior' then (p_patch ->> 'total_ano_anterior')::numeric
           else null end,
      case when p_patch ? 'realizado' then (p_patch ->> 'realizado')::numeric else null end,
      case when p_patch ? 'aRealizar' then (p_patch ->> 'aRealizar')::numeric
           when p_patch ? 'a_realizar' then (p_patch ->> 'a_realizar')::numeric
           else null end,
      case when p_patch ? 'total' then (p_patch ->> 'total')::numeric else null end,
      case when p_patch ? 'creditoIBSCBS' then (p_patch ->> 'creditoIBSCBS')
           when p_patch ? 'credito_ibs_cbs' then (p_patch ->> 'credito_ibs_cbs')
           else null end,
      false,
      1
    )
    returning public.calcir_despesas_overrides.row_version
      into v_row_version;
  else
    if p_expected_version is not null and v_existing.row_version <> p_expected_version then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    update public.calcir_despesas_overrides o
       set descricao = case when p_patch ? 'descricao' then (p_patch ->> 'descricao') else o.descricao end,
           obs = case when p_patch ? 'obs' then (p_patch ->> 'obs') else o.obs end,
           total_ano_anterior = case when p_patch ? 'totalAnoAnterior' then (p_patch ->> 'totalAnoAnterior')::numeric
                                     when p_patch ? 'total_ano_anterior' then (p_patch ->> 'total_ano_anterior')::numeric
                                     else o.total_ano_anterior end,
           realizado = case when p_patch ? 'realizado' then (p_patch ->> 'realizado')::numeric else o.realizado end,
           a_realizar = case when p_patch ? 'aRealizar' then (p_patch ->> 'aRealizar')::numeric
                             when p_patch ? 'a_realizar' then (p_patch ->> 'a_realizar')::numeric
                             else o.a_realizar end,
           total = case when p_patch ? 'total' then (p_patch ->> 'total')::numeric else o.total end,
           credito_ibs_cbs = case when p_patch ? 'creditoIBSCBS' then (p_patch ->> 'creditoIBSCBS')
                                  when p_patch ? 'credito_ibs_cbs' then (p_patch ->> 'credito_ibs_cbs')
                                  else o.credito_ibs_cbs end,
           is_deleted = false,
           row_version = o.row_version + 1
     where o.id = v_existing.id
     returning public.calcir_despesas_overrides.row_version
       into v_row_version;
  end if;

  return query
  select p_source_despesa_id, v_row_version, true;
end;
$$;

create or replace function public.calcir_soft_delete_receita_override(
  p_cliente_id uuid,
  p_analise_id uuid,
  p_source_receita_id uuid,
  p_expected_version integer default null
)
returns table (
  source_id uuid,
  row_version integer,
  is_deleted boolean
)
language plpgsql
as $$
declare
  v_existing public.calcir_receitas_overrides%rowtype;
  v_row_version integer;
  v_is_base boolean;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    raise exception 'CALCIR_COW_BASE_ANALYSIS_WRITE_NOT_ALLOWED';
  end if;

  select *
    into v_existing
  from public.calcir_receitas_overrides o
  where o.cliente_id = p_cliente_id
    and o.analise_id = p_analise_id
    and o.source_receita_id = p_source_receita_id
  for update;

  if not found then
    if p_expected_version is not null and p_expected_version <> 1 then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    insert into public.calcir_receitas_overrides (
      cliente_id,
      analise_id,
      source_receita_id,
      is_deleted,
      row_version
    )
    values (
      p_cliente_id,
      p_analise_id,
      p_source_receita_id,
      true,
      1
    )
    returning public.calcir_receitas_overrides.row_version
      into v_row_version;
  else
    if p_expected_version is not null and v_existing.row_version <> p_expected_version then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    update public.calcir_receitas_overrides o
       set is_deleted = true,
           row_version = o.row_version + 1
     where o.id = v_existing.id
     returning public.calcir_receitas_overrides.row_version
       into v_row_version;
  end if;

  return query
  select p_source_receita_id, v_row_version, true;
end;
$$;

create or replace function public.calcir_soft_delete_despesa_override(
  p_cliente_id uuid,
  p_analise_id uuid,
  p_source_despesa_id uuid,
  p_expected_version integer default null
)
returns table (
  source_id uuid,
  row_version integer,
  is_deleted boolean
)
language plpgsql
as $$
declare
  v_existing public.calcir_despesas_overrides%rowtype;
  v_row_version integer;
  v_is_base boolean;
begin
  select a.is_base_padrao
    into v_is_base
  from public.calcir_analises a
  where a.id = p_analise_id
    and a.cliente_id = p_cliente_id;

  if v_is_base is null then
    raise exception 'análise inválida para o cliente informado';
  end if;

  if v_is_base then
    raise exception 'CALCIR_COW_BASE_ANALYSIS_WRITE_NOT_ALLOWED';
  end if;

  select *
    into v_existing
  from public.calcir_despesas_overrides o
  where o.cliente_id = p_cliente_id
    and o.analise_id = p_analise_id
    and o.source_despesa_id = p_source_despesa_id
  for update;

  if not found then
    if p_expected_version is not null and p_expected_version <> 1 then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    insert into public.calcir_despesas_overrides (
      cliente_id,
      analise_id,
      source_despesa_id,
      is_deleted,
      row_version
    )
    values (
      p_cliente_id,
      p_analise_id,
      p_source_despesa_id,
      true,
      1
    )
    returning public.calcir_despesas_overrides.row_version
      into v_row_version;
  else
    if p_expected_version is not null and v_existing.row_version <> p_expected_version then
      raise exception 'CALCIR_COW_VERSION_CONFLICT';
    end if;

    update public.calcir_despesas_overrides o
       set is_deleted = true,
           row_version = o.row_version + 1
     where o.id = v_existing.id
     returning public.calcir_despesas_overrides.row_version
       into v_row_version;
  end if;

  return query
  select p_source_despesa_id, v_row_version, true;
end;
$$;
