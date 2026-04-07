alter table if exists config_cliente
  add column if not exists contabilidade_regular boolean not null default false,
  add column if not exists lcdpr_limite numeric not null default 4800000;
