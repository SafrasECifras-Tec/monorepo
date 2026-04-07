-- ============================================================
-- Structured DB: add missing columns for new features
-- Ensures ALL application data is queryable in relational tables
-- ============================================================

-- 1. credito_ibs_cbs on despesas
--    Tracks credit classification for IBS/CBS simulation
ALTER TABLE public.despesas
ADD COLUMN IF NOT EXISTS credito_ibs_cbs text NOT NULL DEFAULT 'sem_credito';

ALTER TABLE public.despesas
DROP CONSTRAINT IF EXISTS despesas_credito_ibs_cbs_check;

ALTER TABLE public.despesas
ADD CONSTRAINT despesas_credito_ibs_cbs_check
CHECK (credito_ibs_cbs IN ('cheia', 'reducao60', 'sem_credito'));

CREATE INDEX IF NOT EXISTS idx_despesas_credito_ibs_cbs
ON public.despesas (credito_ibs_cbs);

-- 2. lucros_isentos_acumulados on config_cliente
--    Stores accumulated tax-exempt profits per partner (parceiroId → value)
ALTER TABLE public.config_cliente
ADD COLUMN IF NOT EXISTS lucros_isentos_acumulados jsonb NOT NULL DEFAULT '{}'::jsonb;
