import { useMemo } from 'react';
import type { TransactionRow } from '@/contexts/ImportDataContext';
import { SALDO_INICIAL, monthFullNames } from '@/data/cashflow/cashFlowChartData';

const MONTH_KEYS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function useCashFlowChartData(transactions: TransactionRow[], saldoInicial: number = SALDO_INICIAL) {
  return useMemo(() => {
    // Monthly evolution
    const monthlyTotals = MONTH_KEYS.map((month, idx) => {
      const prefix = `2026-${String(idx + 1).padStart(2, '0')}-`;
      const txs = transactions.filter(t => t.data.startsWith(prefix));
      const entradas = txs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
      const saidas   = txs.filter(t => t.tipo === 'saida').reduce((s, t) => s + Math.abs(t.valor), 0);
      return { month, entradas, saidas };
    });

    let running = saldoInicial;
    const cashFlowData = monthlyTotals.map(({ month, entradas, saidas }) => {
      running = running + entradas - saidas;
      return { month, entradas, saidas, saldoAcumulado: running };
    });

    // Annual totals
    const annualTotals = {
      totalEntradas: transactions.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0),
      totalSaidas:   transactions.filter(t => t.tipo === 'saida').reduce((s, t) => s + Math.abs(t.valor), 0),
    };

    // Top categories
    const saidaCats: Record<string, number>  = {};
    const entradaCats: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.tipo === 'saida') {
        saidaCats[t.categoria] = (saidaCats[t.categoria] || 0) + Math.abs(t.valor);
      } else {
        entradaCats[t.categoria] = (entradaCats[t.categoria] || 0) + t.valor;
      }
    });

    const totalSaidaCats   = Object.values(saidaCats).reduce((s, v) => s + v, 0);
    const totalEntradaCats = Object.values(entradaCats).reduce((s, v) => s + v, 0);

    const topSaidas = Object.entries(saidaCats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, value]) => ({
        category, value,
        percentage: totalSaidaCats > 0 ? Math.round((value / totalSaidaCats) * 100) : 0,
      }));

    const topEntradas = Object.entries(entradaCats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, value]) => ({
        category, value,
        percentage: totalEntradaCats > 0 ? Math.round((value / totalEntradaCats) * 100) : 0,
      }));

    // Short-term liquidity (next 30 days)
    const today   = new Date();
    const future  = new Date();
    future.setDate(today.getDate() + 30);
    const todayStr  = toLocalDateStr(today);
    const futureStr = toLocalDateStr(future);

    const next30         = transactions.filter(t => t.data > todayStr && t.data <= futureStr);
    const next30Saidas   = next30.filter(t => t.tipo === 'saida');
    const next30Entradas = next30.filter(t => t.tipo === 'entrada');

    const shortTermLiquidity = {
      aPagar:         next30Saidas.reduce((s, t) => s + Math.abs(t.valor), 0),
      aPagarCount:    next30Saidas.length,
      aReceber:       next30Entradas.reduce((s, t) => s + t.valor, 0),
      aReceberCount:  next30Entradas.length,
      saldoDisponivel: saldoInicial,
    };

    return { cashFlowData, annualTotals, topSaidas, topEntradas, shortTermLiquidity };
  }, [transactions, saldoInicial]);
}

export { SALDO_INICIAL, monthFullNames };
