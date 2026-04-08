import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Lock } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      setError('Não foi possível obter as credenciais. Tente novamente.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = login(response.credential);
    if (!result.success) {
      setError(result.error ?? 'Erro desconhecido.');
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('O login com Google falhou. Tente novamente.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#E8ECF2] relative flex items-center justify-center font-sans overflow-hidden">
      {/* Background blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-400/25 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/25 blur-[140px] pointer-events-none" />
      <div className="fixed top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-300/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[20%] left-[5%] w-[25%] h-[25%] rounded-full bg-teal-300/15 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Card principal */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/65 backdrop-blur-2xl shadow-xl shadow-slate-200/60">

          {/* Faixa decorativa no topo */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 rounded-t-3xl" />

          <div className="px-10 py-10 flex flex-col items-center gap-8">

            {/* Logo + título */}
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/15 blur-xl scale-110" />
                <div className="relative bg-white/80 rounded-2xl p-4 border border-white/60 shadow-sm">
                  <img
                    src="https://s.criacaostatic.cc/safrasecifraswng5tdg0/uploads/2023/10/Logo-Safras-Cifras_Preto-scaled.png"
                    alt="Safras & Cifras"
                    className="h-9 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Portal GEF
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Gestão Econômico-Financeira
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* Área de login */}
            <div className="w-full flex flex-col items-center gap-5">
              {/* Badge de acesso restrito */}
              <div className="flex items-center gap-2.5 w-full bg-slate-50/80 border border-slate-200/70 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 shrink-0">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Acesso restrito</p>
                  <p className="text-xs text-slate-500">Apenas <span className="font-medium text-emerald-700">@safrasecifras.com.br</span></p>
                </div>
              </div>

              {/* Botão Google */}
              {loading ? (
                <div className="flex items-center gap-2.5 text-sm text-slate-500 py-3">
                  <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  <span>Entrando…</span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="320"
                    text="signin_with"
                    shape="pill"
                  />
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50/90 border border-red-200/70 rounded-2xl px-4 py-3 w-full">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Ao entrar, você concorda com as políticas de uso interno da Safras &amp; Cifras.
            </p>
          </div>
        </div>

        {/* Texto abaixo do card */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Safras &amp; Cifras · Tecnologia
        </p>
      </div>
    </div>
  );
}
