
ALTER TABLE public.vendas_imobilizado 
  ADD COLUMN IF NOT EXISTS source_system text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_modulo text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_documento text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_row_hash text DEFAULT NULL;
