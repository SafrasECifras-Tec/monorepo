/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
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
import { Toaster } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';

function EstoqueModule() {
  const estoqueData = useEstoqueData();
  return (
    <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Estoque</h1>
        <p className="text-muted-foreground mt-1">Gestao e comercializacao de graos</p>
      </header>
      <EstoqueTab stockData={estoqueData ?? []} />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState('cashflow');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <div className="flex items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-muted-foreground">Modulo em desenvolvimento</h2>
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
    <AuthProvider
      allowedDomain="safrasecifras.com.br"
      onSignIn={() => window.location.replace('/')}
    >
      <TooltipProvider delayDuration={0}>
        <AppContent />
      </TooltipProvider>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
