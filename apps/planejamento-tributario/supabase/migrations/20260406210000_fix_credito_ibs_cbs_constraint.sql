-- Atualiza constraint de credito_ibs_cbs para incluir 'diesel' e 'simples_nacional'
-- A migration anterior (20260406200000) adicionou os campos mas esqueceu de atualizar o CHECK

ALTER TABLE despesas
  DROP CONSTRAINT IF EXISTS despesas_credito_ibs_cbs_check;

ALTER TABLE despesas
  ADD CONSTRAINT despesas_credito_ibs_cbs_check
  CHECK (credito_ibs_cbs IN ('cheia', 'reducao60', 'diesel', 'simples_nacional', 'sem_credito'));
