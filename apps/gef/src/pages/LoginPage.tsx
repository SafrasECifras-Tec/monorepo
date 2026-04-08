import { useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { getSupabaseClient } from '@socios/auth';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background relative flex items-center justify-center font-sans overflow-hidden">
      {/* Background blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/25 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/25 blur-[140px] pointer-events-none" />
      <div className="fixed top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-300/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[20%] left-[5%] w-[25%] h-[25%] rounded-full bg-teal-300/15 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Card principal */}
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/65 backdrop-blur-2xl shadow-elevated ">

          {/* Faixa decorativa no topo */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-teal-400 to-blue-500 rounded-t-3xl" />

          <div className="px-10 py-10 flex flex-col items-center gap-8">

            {/* Logo + título */}
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl scale-110" />
                <div className="relative bg-card/80 rounded-2xl p-4 border border-border/60 shadow-soft">
                  <img
                    src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png"
                    alt="Safras & Cifras"
                    className="h-9 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Portal GEF
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Gestão Econômico-Financeira
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Área de login */}
            <div className="w-full flex flex-col items-center gap-5">
              {/* Badge de acesso restrito */}
              <div className="flex items-center gap-2.5 w-full bg-accent/80 border border-border/70 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Acesso restrito</p>
                  <p className="text-xs text-muted-foreground">Apenas <span className="font-medium text-primary">@safrasecifras.com.br</span></p>
                </div>
              </div>

              {/* Botão Google */}
              {loading ? (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-3">
                  <div className="h-4 w-4 border-2 border-border border-t-muted-foreground rounded-full animate-spin" />
                  <span>Entrando…</span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground transition hover:bg-accent"
                  >
                    Entrar com Google
                  </button>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2.5 bg-destructive/5 border border-destructive/20 rounded-2xl px-4 py-3 w-full">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive leading-relaxed">{error}</p>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Ao entrar, você concorda com as políticas de uso interno da Safras &amp; Cifras.
            </p>
          </div>
        </div>

        {/* Texto abaixo do card */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Safras &amp; Cifras · Tecnologia
        </p>
      </div>
    </div>
  );
}
