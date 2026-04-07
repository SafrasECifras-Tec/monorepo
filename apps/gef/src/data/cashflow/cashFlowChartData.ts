/**
 * cashFlowChartData.ts
 *
 * Fonte única de dados derivados para o módulo de Fluxo de Caixa.
 * Todos os valores são calculados a partir de `detalhamentoData`,
 * que representa os lançamentos transacionais — a mesma tabela que
 * futuramente será consultada no banco de dados.
 */
import { detalhamentoData } from './detalhamentoData';

export const SALDO_INICIAL = 1500000;

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_KEYS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Evolução Mensal (gráfico de área) ──────────────────────────────────────

const monthlyTotals = MONTH_KEYS.map((month, idx) => {
  const prefix = `2026-${String(idx + 1).padStart(2, '0')}-`;
  const txs = detalhamentoData.filter(t => t.data.startsWith(prefix));
  const entradas = txs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
  const saidas = txs.filter(t => t.tipo === 'saida').reduce((s, t) => s + Math.abs(t.valor), 0);
  return { month, entradas, saidas };
});

let runningBalance = SALDO_INICIAL;
export const cashFlowData = monthlyTotals.map(({ month, entradas, saidas }) => {
  runningBalance = runningBalance + entradas - saidas;
  return { month, entradas, saidas, saldoAcumulado: runningBalance };
});

// ─── Totais anuais (summary cards) ──────────────────────────────────────────

export const annualTotals = {
  totalEntradas: detalhamentoData
    .filter(t => t.tipo === 'entrada')
    .reduce((s, t) => s + t.valor, 0),
  totalSaidas: detalhamentoData
    .filter(t => t.tipo === 'saida')
    .reduce((s, t) => s + Math.abs(t.valor), 0),
};

// ─── Top categorias ─────────────────────────────────────────────────────────

const saidaCats: Record<string, number> = {};
const entradaCats: Record<string, number> = {};

detalhamentoData.forEach(t => {
  if (t.tipo === 'saida') {
    saidaCats[t.categoria] = (saidaCats[t.categoria] || 0) + Math.abs(t.valor);
  } else {
    entradaCats[t.categoria] = (entradaCats[t.categoria] || 0) + t.valor;
  }
});

const totalSaidaCats = Object.values(saidaCats).reduce((s, v) => s + v, 0);
const totalEntradaCats = Object.values(entradaCats).reduce((s, v) => s + v, 0);

export const topSaidas = Object.entries(saidaCats)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([category, value]) => ({
    category,
    value,
    percentage: Math.round((value / totalSaidaCats) * 100),
  }));

export const topEntradas = Object.entries(entradaCats)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([category, value]) => ({
    category,
    value,
    percentage: Math.round((value / totalEntradaCats) * 100),
  }));

// ─── Radar de Curto Prazo (próximos 30 dias) ────────────────────────────────

const today = new Date();
const future = new Date();
future.setDate(today.getDate() + 30);
const todayStr = toLocalDateStr(today);
const futureStr = toLocalDateStr(future);

const next30 = detalhamentoData.filter(t => t.data > todayStr && t.data <= futureStr);
const next30Saidas = next30.filter(t => t.tipo === 'saida');
const next30Entradas = next30.filter(t => t.tipo === 'entrada');

export const shortTermLiquidity = {
  aPagar: next30Saidas.reduce((s, t) => s + Math.abs(t.valor), 0),
  aPagarCount: next30Saidas.length,
  aReceber: next30Entradas.reduce((s, t) => s + t.valor, 0),
  aReceberCount: next30Entradas.length,
  saldoDisponivel: SALDO_INICIAL,
};

// ─── Mapa de meses (usado em navegação por mês) ──────────────────────────────

export const monthFullNames: Record<string, string> = {
  Jan: 'Janeiro', Fev: 'Fevereiro', Mar: 'Março',  Abr: 'Abril',
  Mai: 'Maio',    Jun: 'Junho',     Jul: 'Julho',   Ago: 'Agosto',
  Set: 'Setembro', Out: 'Outubro', Nov: 'Novembro', Dez: 'Dezembro',
};
