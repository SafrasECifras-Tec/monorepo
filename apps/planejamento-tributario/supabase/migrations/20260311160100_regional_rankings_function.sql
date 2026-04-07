-- Ranking function: compares a client against all clients in the same regional.
-- Uses SECURITY DEFINER to bypass RLS and access cross-client data.

create or replace function public.get_regional_rankings(
  p_regional text,
  p_cliente_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_clientes_ids uuid[];
begin
  -- Get all client IDs in this regional
  select array_agg(id) into v_clientes_ids
  from public.clientes
  where regional = p_regional;

  if v_clientes_ids is null or array_length(v_clientes_ids, 1) is null then
    return jsonb_build_object(
      'receitas_produto', '[]'::jsonb,
      'despesas_categoria', '[]'::jsonb,
      'receita_geral', null,
      'despesa_geral', null,
      'total_clientes', 0
    );
  end if;

  select jsonb_build_object(
    'total_clientes', array_length(v_clientes_ids, 1),

    -- Ranking by product revenue
    'receitas_produto', coalesce((
      select jsonb_agg(row_to_json(rp))
      from (
        select
          sub.produto,
          sub.posicao,
          sub.total,
          sub.total_clientes_produto
        from (
          select
            r.produto,
            r.cliente_id,
            sum(r.total) as total,
            count(*) over (partition by r.produto) as total_clientes_produto,
            rank() over (partition by r.produto order by sum(r.total) desc) as posicao
          from public.receitas r
          where r.cliente_id = any(v_clientes_ids)
            and r.produto is not null
            and r.produto != ''
          group by r.produto, r.cliente_id
        ) sub
        where sub.cliente_id = p_cliente_id
        order by sub.total desc
      ) rp
    ), '[]'::jsonb),

    -- Ranking by expense category
    'despesas_categoria', coalesce((
      select jsonb_agg(row_to_json(dc))
      from (
        select
          sub.descricao,
          sub.posicao,
          sub.total,
          sub.total_clientes_categoria
        from (
          select
            d.descricao,
            d.cliente_id,
            sum(d.total) as total,
            count(*) over (partition by d.descricao) as total_clientes_categoria,
            rank() over (partition by d.descricao order by sum(d.total) desc) as posicao
          from public.despesas d
          where d.cliente_id = any(v_clientes_ids)
            and d.descricao is not null
            and d.descricao != ''
          group by d.descricao, d.cliente_id
        ) sub
        where sub.cliente_id = p_cliente_id
        order by sub.total desc
      ) dc
    ), '[]'::jsonb),

    -- Overall revenue ranking
    'receita_geral', (
      select row_to_json(sub)
      from (
        select rg.posicao, rg.total
        from (
          select
            r.cliente_id,
            sum(r.total) as total,
            rank() over (order by sum(r.total) desc) as posicao
          from public.receitas r
          where r.cliente_id = any(v_clientes_ids)
          group by r.cliente_id
        ) rg
        where rg.cliente_id = p_cliente_id
      ) sub
    ),

    -- Overall expense ranking
    'despesa_geral', (
      select row_to_json(sub)
      from (
        select dg.posicao, dg.total
        from (
          select
            d.cliente_id,
            sum(d.total) as total,
            rank() over (order by sum(d.total) desc) as posicao
          from public.despesas d
          where d.cliente_id = any(v_clientes_ids)
          group by d.cliente_id
        ) dg
        where dg.cliente_id = p_cliente_id
      ) sub
    )
  ) into v_result;

  return v_result;
end;
$$;
