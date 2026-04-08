import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "./client";
import type { User, Session } from "./types";

export type AppRole = "consultor" | "cliente";

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

interface AuthProviderProps {
  children: React.ReactNode;
  /** If set, Google logins from outside this domain are blocked */
  allowedDomain?: string;
  /** Called after a successful fresh sign-in (not on session restore) */
  onSignIn?: () => void;
}

export function AuthProvider({ children, allowedDomain, onSignIn }: AuthProviderProps) {
  const supabase = getSupabaseClient();
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
    // When the portal opens this app with Supabase tokens in the hash,
    // Supabase's _initialize() processes them asynchronously. We must NOT
    // set loading=false until SIGNED_IN fires (or a safety timeout expires).
    const hasHashTokens =
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token");

    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const provider = session.user.app_metadata?.provider;
        const email = session.user.email ?? "";

        if (allowedDomain && provider === "google" && !email.endsWith(`@${allowedDomain}`)) {
          await supabase.auth.signOut();
          window.location.replace(`/auth?error=domain_not_allowed`);
          return;
        }

        if (safetyTimer) clearTimeout(safetyTimer);

        setSession(session);
        setUser(session.user);
        setTimeout(() => fetchRole(session.user.id), 0);
        setLoading(false);

        const isOAuthCallback =
          window.location.hash.includes("access_token") ||
          window.location.search.includes("code=");
        const isFromAuthPage = window.location.pathname === "/auth";

        if (isOAuthCallback || isFromAuthPage) {
          onSignIn?.();
        }
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRole(session.user.id), 0);
        setLoading(false);
      } else {
        setRole(null);
        // Keep loading=true while hash tokens are still being processed
        if (!hasHashTokens) {
          setLoading(false);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        setLoading(false);
      } else if (!hasHashTokens) {
        setLoading(false);
      }
    });

    // Safety timeout: if hash tokens are invalid/expired, SIGNED_IN never
    // fires. Force loading=false after 5s so the app can redirect normally.
    if (hasHashTokens) {
      safetyTimer = setTimeout(() => {
        setLoading((current) => {
          if (current) {
            console.warn(
              "@socios/auth: hash token processing timed out (5 s) — tokens may be expired or invalid"
            );
          }
          return false;
        });
      }, 5_000);
    }

    return () => {
      subscription.unsubscribe();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
