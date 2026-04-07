
-- 1. Insert the missing profile for the existing consultant user
INSERT INTO public.profiles (id, nome, email)
VALUES (
  '7c1bf232-cb40-4127-9562-68566420a652',
  'Consultor Safras',
  'consultor@safrasecifras.com.br'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert the missing role
INSERT INTO public.user_roles (user_id, role)
VALUES ('7c1bf232-cb40-4127-9562-68566420a652', 'consultor')
ON CONFLICT DO NOTHING;

-- 3. Create the trigger that was missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
