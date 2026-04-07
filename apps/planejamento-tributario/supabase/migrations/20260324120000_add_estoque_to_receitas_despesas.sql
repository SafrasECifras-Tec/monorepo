-- Add estoque (stock/inventory) numeric column to receitas and despesas tables
-- This allows tracking inventory/stock values per revenue and expense entry

-- Receitas
ALTER TABLE receitas ADD COLUMN IF NOT EXISTS estoque numeric DEFAULT 0;
ALTER TABLE calcir_receitas_overrides ADD COLUMN IF NOT EXISTS estoque numeric DEFAULT 0;

-- Despesas
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS estoque numeric DEFAULT 0;
ALTER TABLE calcir_despesas_overrides ADD COLUMN IF NOT EXISTS estoque numeric DEFAULT 0;
