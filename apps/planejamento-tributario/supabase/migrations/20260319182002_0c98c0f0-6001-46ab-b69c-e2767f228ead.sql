ALTER TABLE public.config_cliente 
  ADD COLUMN IF NOT EXISTS funrural_pf_regime text NOT NULL DEFAULT 'receita_bruta',
  ADD COLUMN IF NOT EXISTS funrural_pf_aliquota numeric NOT NULL DEFAULT 0.015,
  ADD COLUMN IF NOT EXISTS folha_pagamento_pf numeric NOT NULL DEFAULT 0;