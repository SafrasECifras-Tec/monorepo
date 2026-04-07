-- Adiciona campos para crédito IBS/CBS de combustíveis (diesel) e Simples Nacional

-- Despesas: quantidade em litros (para diesel) e percentual de crédito (para Simples Nacional)
ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS quantidade_litros NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS percentual_credito_sn NUMERIC DEFAULT NULL;

-- Config cliente: alíquota de IBS/CBS por litro de diesel (R$/litro)
-- Valor 0 = não definido (aguardando publicação do Comitê Gestor do IBS)
ALTER TABLE config_cliente
  ADD COLUMN IF NOT EXISTS aliquota_diesel_por_litro NUMERIC DEFAULT 0;
