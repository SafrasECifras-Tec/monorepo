-- Add funrural_nao_incidente boolean flag to receitas and overrides tables
-- Used to mark revenues that do not incur Funrural (e.g. exports, animal raising)

ALTER TABLE receitas ADD COLUMN IF NOT EXISTS funrural_nao_incidente boolean DEFAULT false;
ALTER TABLE calcir_receitas_overrides ADD COLUMN IF NOT EXISTS funrural_nao_incidente boolean DEFAULT false;
