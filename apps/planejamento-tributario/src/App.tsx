import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CalcirProvider, useCalcir } from "@/contexts/CalcirContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import DashboardAnalises from "./pages/DashboardAnalises";
import InformacoesCliente from "./pages/InformacoesCliente";
import RelatorioFinal from "./pages/RelatorioFinal";
import ApuracaoFinal from "./pages/ApuracaoFinal";
import ReceitasAgro from "./pages/ReceitasAgro";
import DespesasAgro from "./pages/DespesasAgro";
import ParticularPF from "./pages/ParticularPF";
import RecNaoRurais from "./pages/RecNaoRurais";
import SimulacaoPJ from "./pages/SimulacaoPJ";
import SimulacaoIBSCBS from "./pages/SimulacaoIBSCBS";
import SimulacaoIRPFM from "./pages/SimulacaoIRPFM";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import HomePage from "./pages/HomePage";
import Configuracoes from "./pages/Configuracoes";
import ClienteAutoLogin from "./pages/ClienteAutoLogin";
import NotFound from "./pages/NotFound";
import AnalisesCalcir from "./pages/AnalisesCalcir";
import GestaoCreditos from "./pages/GestaoCreditos";
import Conselheiro from "./pages/Conselheiro";
import { AlertTriangle, Loader2 } from "lucide-react";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireQuadroSocietario({ children }: { children: React.ReactNode }) {
  const { state, clienteId } = useCalcir();
  const navigate = useNavigate();

  if (!clienteId) {
    return <>{children}</>;
  }

  const totalParticipacao = state.parceiros.reduce((sum, parceiro) => sum + parceiro.participacao, 0);
  const quadroSocietarioValido = state.parceiros.length > 0 && Math.abs(totalParticipacao - 100) < 0.1;

  if (quadroSocietarioValido) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Preencha o Quadro Societário para continuar</AlertTitle>
        <AlertDescription>
          O total de participação dos parceiros deve ser 100% para liberar esta tela.
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={() => navigate("/")}>
            Ir para Informações do Cliente
          </Button>
        </div>
      </Alert>
    </div>
  );
}

function RequireCliente({ children }: { children: React.ReactNode }) {
  const { clienteId } = useCalcir();
  const { role } = useAuth();
  
  if (!clienteId && role === "consultor") {
    return <Navigate to="/clientes" replace />;
  }

  if (!clienteId && role === "cliente") {
    // Para clientes, aguardamos o ClienteAutoLogin buscar o id
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to={role === "cliente" ? "/" : "/clientes"} replace /> : <Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Consultor: select client */}
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            {role === "cliente" ? <Navigate to="/" replace /> : <HomePage />}
          </ProtectedRoute>
        }
      />

      {/* Main app routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {role === "cliente" ? <ClienteAutoLogin /> : null}
            <RequireCliente>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<InformacoesCliente />} />
                  <Route path="/dashboard" element={<RequireQuadroSocietario><DashboardAnalises /></RequireQuadroSocietario>} />
                  <Route path="/relatorio-final" element={<RequireQuadroSocietario><RelatorioFinal /></RequireQuadroSocietario>} />
                  <Route path="/apuracao" element={<RequireQuadroSocietario><ApuracaoFinal /></RequireQuadroSocietario>} />
                  <Route path="/receitas" element={<RequireQuadroSocietario><ReceitasAgro /></RequireQuadroSocietario>} />
                  <Route path="/despesas" element={<RequireQuadroSocietario><DespesasAgro /></RequireQuadroSocietario>} />
                  <Route path="/particular-pf" element={<RequireQuadroSocietario><ParticularPF /></RequireQuadroSocietario>} />
                  <Route path="/rec-nao-rurais" element={<RequireQuadroSocietario><RecNaoRurais /></RequireQuadroSocietario>} />
                  <Route path="/simulacao-pj" element={<SimulacaoPJ />} />
                  <Route path="/simulacao-ibs-cbs" element={<SimulacaoIBSCBS />} />
                  <Route path="/gestao-creditos" element={<RequireQuadroSocietario><GestaoCreditos /></RequireQuadroSocietario>} />
                  <Route path="/simulacao-irpfm" element={<SimulacaoIRPFM />} />
                  <Route path="/analises" element={<RequireQuadroSocietario><AnalisesCalcir /></RequireQuadroSocietario>} />
                  <Route path="/conselheiro" element={<Conselheiro />} />
                  <Route path="/configuracoes" element={
                    role === null
                      ? <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      : role === "consultor" ? <Configuracoes /> : <Navigate to="/" replace />
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </RequireCliente>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider
          allowedDomain="safrasecifras.com.br"
          onSignIn={() => {
            sessionStorage.removeItem("calcir_cliente_id");
            sessionStorage.removeItem("calcir_analise_id");
            window.location.replace("/clientes");
          }}
        >
          <CalcirProvider>
            <AppRoutes />
          </CalcirProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
