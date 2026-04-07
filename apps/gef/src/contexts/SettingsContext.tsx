import React, { createContext, useContext, useState } from 'react';

// ─── Debt Indicadores ───────────────────────────────────────────────────────
export const DEBT_INDICADOR_ITEMS = [
  { key: 'comprometimento_ebitda', label: 'Comprometimento do EBITDA' },
  { key: 'endividamento_receita',  label: 'Endividamento / Receita' },
  { key: 'endividamento_ebitda',   label: 'Endividamento / EBITDA' },
  { key: 'renegociacao',           label: 'Renegociação' },
  { key: 'custeio_custo',          label: 'Custeio / Custo Desembolsado' },
  { key: 'custo_financeiro',       label: 'Custo Financeiro vs' },
] as const;

// ─── Balance Indicadores ────────────────────────────────────────────────────
export const BALANCE_INDICADOR_ITEMS = [
  { key: 'ccl',                    label: 'Capital Circulante Líquido (CCL)' },
  { key: 'compromissos_prazo',     label: 'Compromissos Curto x Longo prazo' },
  { key: 'liquidez_imediata',      label: 'Liquidez Imediata' },
  { key: 'liquidez_corrente',      label: 'Liquidez Corrente' },
  { key: 'liquidez_geral',         label: 'Liquidez Geral' },
  { key: 'endividamento_pl',       label: 'Endividamento sobre o Patrimônio Líquido' },
  { key: 'grau_endividamento',     label: 'Grau de Endividamento' },
  { key: 'patrimonio_liquido',     label: 'Patrimônio Líquido' },
  { key: 'patrimonio_liquido_terras', label: 'Patrimônio Líquido (Excluindo Terras)' },
] as const;

type DebtKey    = typeof DEBT_INDICADOR_ITEMS[number]['key'];
type BalanceKey = typeof BALANCE_INDICADOR_ITEMS[number]['key'];

const defaultDebt    = Object.fromEntries(DEBT_INDICADOR_ITEMS.map(i => [i.key, true]))    as Record<DebtKey, boolean>;
const defaultBalance = Object.fromEntries(BALANCE_INDICADOR_ITEMS.map(i => [i.key, true])) as Record<BalanceKey, boolean>;

const STORAGE_KEY = 'gef_settings_v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { debt: Record<string, boolean>; balance: Record<string, boolean> };
  } catch {
    return null;
  }
}

interface SettingsContextValue {
  debtIndicadores:    Record<string, boolean>;
  balanceIndicadores: Record<string, boolean>;
  toggleDebt:    (key: string) => void;
  toggleBalance: (key: string) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  debtIndicadores:    defaultDebt,
  balanceIndicadores: defaultBalance,
  toggleDebt:    () => {},
  toggleBalance: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const saved = loadFromStorage();

  const [debtIndicadores, setDebtIndicadores] = useState<Record<string, boolean>>(
    saved ? { ...defaultDebt, ...saved.debt } : defaultDebt
  );
  const [balanceIndicadores, setBalanceIndicadores] = useState<Record<string, boolean>>(
    saved ? { ...defaultBalance, ...saved.balance } : defaultBalance
  );

  const persist = (debt: Record<string, boolean>, balance: Record<string, boolean>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ debt, balance }));
  };

  const toggleDebt = (key: string) => {
    setDebtIndicadores(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persist(next, balanceIndicadores);
      return next;
    });
  };

  const toggleBalance = (key: string) => {
    setBalanceIndicadores(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persist(debtIndicadores, next);
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ debtIndicadores, balanceIndicadores, toggleDebt, toggleBalance }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
