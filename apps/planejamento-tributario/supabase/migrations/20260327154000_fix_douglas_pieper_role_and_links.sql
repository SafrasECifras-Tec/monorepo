-- ============================================================
-- Corrige conta do Douglas Pieper (douglas.pieper@safrasecifras.com.br)
-- Problema: estava com role 'cliente' (criado indevidamente via
--   create-client-user com email corporativo) causando loading infinito
--   ao tentar logar via Google OAuth.
-- ============================================================

-- 1. Remover role 'cliente' incorreta do usuário
DELETE FROM public.user_roles
WHERE user_id = 'fb79f47a-4e97-47ca-b13f-cc60a9c6385a'
  AND role = 'cliente';

-- 2. Garantir role 'consultor' correta
INSERT INTO public.user_roles (user_id, role)
VALUES ('fb79f47a-4e97-47ca-b13f-cc60a9c6385a', 'consultor')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Remover vínculos incorretos de cliente_users
DELETE FROM public.cliente_users
WHERE user_id = 'fb79f47a-4e97-47ca-b13f-cc60a9c6385a';

-- 4. Adicionar vínculos corretos como consultor
--    Renato von Laer  (63b023d9-9fab-4daf-a0e4-57051316d872)
--    Adriana Vianna   (c9791298-1573-4406-a50d-ce2fbb40cab5)
INSERT INTO public.consultor_clientes (consultor_id, cliente_id)
VALUES
  ('fb79f47a-4e97-47ca-b13f-cc60a9c6385a', '63b023d9-9fab-4daf-a0e4-57051316d872'),
  ('fb79f47a-4e97-47ca-b13f-cc60a9c6385a', 'c9791298-1573-4406-a50d-ce2fbb40cab5')
ON CONFLICT DO NOTHING;
