import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCalcir } from "@/contexts/CalcirContext";

/**
 * For "cliente" role users: auto-set the clienteId from cliente_users table.
 * This component renders nothing — it just triggers the side effect.
 * If no cliente_users link is found, redirects to an error page to avoid
 * an infinite loading spinner.
 */
export default function ClienteAutoLogin() {
  const { user, role, signOut } = useAuth();
  const { clienteId, setClienteId } = useCalcir();

  useEffect(() => {
    if (role !== "cliente" || !user || clienteId) return;

    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(async ({ data, error }) => {
        if (data?.cliente_id) {
          setClienteId(data.cliente_id);
        } else {
          // Nenhum vínculo encontrado — evitar loading infinito
          console.error("ClienteAutoLogin: nenhum cliente_users encontrado para o usuário", user.id, error);
          await signOut();
          window.location.replace("/auth?error=no_client_found");
        }
      });
  }, [user, role, clienteId, setClienteId, signOut]);

  return null;
}
