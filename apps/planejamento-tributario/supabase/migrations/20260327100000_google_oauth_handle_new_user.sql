-- Update handle_new_user trigger to support Google OAuth metadata (full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',  -- Google OAuth
      NEW.raw_user_meta_data->>'nome',        -- Email/password signup
      ''
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role is consultor; can be overridden via metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'consultor'
  ))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
