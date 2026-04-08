/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MainLayout } from '@/components/layout/MainLayout';
import { DREDashboard } from '@/modules/dre/DREDashboard';
import { DebtDashboard } from '@/modules/debt/DebtDashboard';
import { BalanceDashboard } from '@/modules/balance/BalanceDashboard';
import { CashFlowDashboard } from '@/modules/cashflow/CashFlowDashboard';
import { EstoqueTab } from '@/modules/cashflow/EstoqueTab';
import { useEstoqueData } from '@/hooks/useEstoqueData';
import { AjustesDashboard } from '@/modules/ajustes/AjustesDashboard';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ImportDataProvider } from '@/contexts/ImportDataContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { LoginPage } from '@/pages/LoginPage';
import { Toaster } from 'sonner';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '359561013239-44d1m7harmo5dglpitl895gstgjv1efe.apps.googleusercontent.com';

function EstoqueModule() {
  const estoqueData = useEstoqueData();
  return (
    <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Estoque</h1>
        <p className="text-muted-foreground mt-1">Gestão e comercialização de grãos</p>
      </header>
      <EstoqueTab stockData={estoqueData ?? []} />
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('cashflow');

  if (!user) {
    return <LoginPage />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dre':
        return <DREDashboard />;
      case 'debt':
        return <DebtDashboard />;
      case 'patrimony':
        return <BalanceDashboard />;
      case 'cashflow':
        return <CashFlowDashboard />;
      case 'estoque':
        return <EstoqueModule />;
      case 'ajustes':
        return <AjustesDashboard />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Ícone com halo */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl scale-125" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-card">
                  <Wrench className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
              </div>

              {/* Texto */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Em desenvolvimento
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este módulo está sendo construído e estará disponível em breve.
                </p>
              </div>

              {/* Badge de status */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Em breve
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <ClientProvider>
      <ImportDataProvider>
        <SettingsProvider>
          <MainLayout activeModule={activeModule} onNavigate={setActiveModule}>
            {renderModule()}
          </MainLayout>
          <Toaster position="top-right" />
        </SettingsProvider>
      </ImportDataProvider>
    </ClientProvider>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
