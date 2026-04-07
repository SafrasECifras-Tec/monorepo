ALTER TABLE public.config_cliente
ADD COLUMN IF NOT EXISTS funrural_pj_regime text NOT NULL DEFAULT 'receita_bruta',
ADD COLUMN IF NOT EXISTS funrural_pj_aliquota numeric NOT NULL DEFAULT 0.0205,
ADD COLUMN IF NOT EXISTS folha_pagamento_pj numeric NOT NULL DEFAULT 0;

ALTER TABLE public.config_cliente
DROP CONSTRAINT IF EXISTS config_cliente_funrural_pj_regime_check;

ALTER TABLE public.config_cliente
ADD CONSTRAINT config_cliente_funrural_pj_regime_check
CHECK (funrural_pj_regime IN ('receita_bruta', 'folha'));
