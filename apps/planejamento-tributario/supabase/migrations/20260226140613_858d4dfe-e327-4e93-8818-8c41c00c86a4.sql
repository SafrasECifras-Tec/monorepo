
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado text DEFAULT '';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS porte text DEFAULT '';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS regional text DEFAULT '';
