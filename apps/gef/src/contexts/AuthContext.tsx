import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ALLOWED_DOMAIN = 'safrasecifras.com.br';
const STORAGE_KEY = 'gef_auth_user';

export type AuthUser = {
  email: string;
  name: string;
  picture: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (credentialJwt: string) => { success: boolean; error?: string };
  logout: () => void;
};

function decodeJwt(token: string): Record<string, string> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((credentialJwt: string): { success: boolean; error?: string } => {
    try {
      const payload = decodeJwt(credentialJwt);
      const email: string = payload['email'] ?? '';

      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return {
          success: false,
          error: `Acesso restrito. Use um e-mail @${ALLOWED_DOMAIN}.`,
        };
      }

      const authUser: AuthUser = {
        email,
        name: payload['name'] ?? email,
        picture: payload['picture'] ?? '',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao processar o login. Tente novamente.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    // Redirect to Sócios do Agro portal login (not GEF's own login page)
    const portalUrl = (import.meta as any).env?.VITE_PORTAL_URL ?? 'http://localhost:4000';
    window.location.href = `${portalUrl}/auth`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
