import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@socios/auth";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_DOMAIN = "safrasecifras.com.br";

type AppRole = "consultor" | "cliente";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchRole = async (userId: string, attempt = 1) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (error) {
      console.warn(`fetchRole attempt ${attempt} failed:`, error.message);
      if (attempt < 3) {
        setTimeout(() => fetchRole(userId, attempt + 1), 500 * attempt);
        return;
      }
    }
    setRole((data?.role as AppRole) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const provider = session.user.app_metadata?.provider;
          const email = session.user.email ?? "";

          // Block Google logins from outside the allowed domain
          if (provider === "google" && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
            await supabase.auth.signOut();
            window.location.replace(`/auth?error=domain_not_allowed`);
            return;
          }

          // Update state first to avoid stuck loading spinner
          setSession(session);
          setUser(session.user);
          setTimeout(() => fetchRole(session.user.id), 0);
          setLoading(false);

          // Only redirect once per actual sign-in (not on session restore).
          // A real sign-in means either:
          //   1. Google OAuth callback (URL has access_token or code param)
          //   2. Email/password form just submitted (we're still on /auth page)
          const isOAuthCallback =
            window.location.hash.includes("access_token") ||
            window.location.search.includes("code=");
          const isFromAuthPage = window.location.pathname === "/auth";

          if (isOAuthCallback || isFromAuthPage) {
            // Fresh login — clear session storage and navigate to client list
            sessionStorage.removeItem("calcir_cliente_id");
            sessionStorage.removeItem("calcir_analise_id");
            window.location.replace("/clientes");
          }
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid Supabase client deadlock
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export type { AppRole };
