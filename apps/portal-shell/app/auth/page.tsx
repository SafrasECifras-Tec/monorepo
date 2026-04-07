"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "domain_not_allowed") {
      setErrorMsg("Apenas contas @safrasecifras.com.br podem acessar o sistema.");
    } else if (error === "auth_callback_failed") {
      setErrorMsg("Falha na autenticação. Tente novamente.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "safrasecifras.com.br" },
      },
    });
    if (error) {
      setGoogleLoading(false);
      setErrorMsg(error.message);
    }
    // On success the browser navigates away — no further handling needed
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      {/* Background video — clipped in its own stacking context */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{
            filter: "brightness(0.55) saturate(1.1)",
            opacity: videoVisible ? 1 : 0,
          }}
          onCanPlay={() => {
            setVideoVisible(true);
            setTimeout(() => setCardVisible(true), 650);
          }}
        >
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-4 py-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          }}
        >
          {/* Header */}
          <div className="text-center pt-6 pb-2 px-8">
            <div className="mx-auto mb-3">
              <Image
                src="/logo-safras-cifras.png"
                alt="Safras & Cifras"
                width={80}
                height={80}
                priority
                className="mx-auto h-20 w-auto object-contain drop-shadow-lg"
                style={{ filter: "brightness(1.15)" }}
              />
            </div>
            <h1 className="text-xl font-semibold text-white/95 tracking-tight">
              Sócios do Agro
            </h1>
            <p className="text-sm text-white/50 mt-0.5">Bem-vindo</p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mx-8 mt-4 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-2.5 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <div className="pb-8 pt-4 px-8">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
              Área do Cliente
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-white/70 uppercase tracking-wide"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-white/70 uppercase tracking-wide"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center h-10 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20 hover:border-white/30 text-sm font-medium backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Entrar
              </button>
            </form>

            <div className="relative my-3 flex items-center gap-3">
              <div className="flex-1 border-t border-white/15" />
              <span className="text-xs uppercase text-white/35 tracking-widest">ou</span>
              <div className="flex-1 border-t border-white/15" />
            </div>

            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
              Área do Consultor S&amp;C
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center h-10 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 text-sm font-medium backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GoogleIcon />
              )}
              Entrar com Google
            </button>
            <p className="text-center text-xs text-white/30 mt-2">
              Exclusivo para consultores
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
