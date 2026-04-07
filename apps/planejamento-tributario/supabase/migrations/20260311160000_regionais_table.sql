-- Create regionais table with fixed list of regionals
create table if not exists public.regionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz default now()
);

alter table public.regionais enable row level security;

-- Everyone authenticated can read regionais
create policy "Authenticated can read regionais"
  on public.regionais for select to authenticated using (true);

-- Seed the fixed list
insert into public.regionais (nome) values
  ('BA'),
  ('DF'),
  ('DF Oeste'),
  ('ES'),
  ('Fronteira Oeste'),
  ('GO'),
  ('GO/Noroeste'),
  ('GO/Sudoeste'),
  ('MA'),
  ('MG SUL/SP'),
  ('MG Triângulo'),
  ('MS'),
  ('MT Norte'),
  ('MT Oeste'),
  ('MT Sul'),
  ('MT Vale'),
  ('MT Vale/PE'),
  ('Pará Norte'),
  ('Paraguai'),
  ('PI'),
  ('PR'),
  ('RS José Ney'),
  ('RS/SC/PA'),
  ('SP'),
  ('TO Norte/PA'),
  ('TO Sul')
on conflict (nome) do nothing;
