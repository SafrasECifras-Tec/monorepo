// ─── Endividamento por Safra ──────────────────────────────────────────────────
// Dados referência: posição em 31/08/2025
export interface EndividamentoPorSafraItem {
  safra: string;
  custeios: number;
  investimentos: number;
  investimentosDolar: number;
  total: number;
}

export const endividamentoPorSafraData: EndividamentoPorSafraItem[] = [
  { safra: 'Safra 2025/26', custeios: 7_202_310, investimentos: 2_400_000, investimentosDolar: 700_000,  total: 10_302_310 },
  { safra: 'Safra 2026/27', custeios: 1_127_560, investimentos:   300_000, investimentosDolar: 100_000,  total:  1_527_560 },
  { safra: 'Safra 2027/28', custeios:   949_846, investimentos:   300_000, investimentosDolar: 100_000,  total:  1_349_846 },
  { safra: 'Safra 2028/29', custeios:   755_989, investimentos:   300_000, investimentosDolar: 100_000,  total:  1_155_989 },
  { safra: 'Safra 2029/30', custeios:   755_989, investimentos:   300_000, investimentosDolar: 100_000,  total:  1_155_989 },
  { safra: 'Safra 2030/31', custeios:   130_000, investimentos:    30_000, investimentosDolar:  20_000,  total:    180_000 },
];

// ─── Histórico do Endividamento ───────────────────────────────────────────────
export interface HistoricoEndividamentoItem {
  data: string;
  compraDeTerras: number;
  custeios: number;
  investimentos: number;
  investimentosDolar: number;
  total: number;
}

export const historicoEndividamentoData: HistoricoEndividamentoItem[] = [
  { data: '31/08/2020', compraDeTerras: 13_435_035, custeios: 12_343_633, investimentos: 15_399_007, investimentosDolar:  7_334_685, total: 48_512_360 },
  { data: '31/08/2021', compraDeTerras: 18_993_076, custeios: 15_884_617, investimentos:  3_960_428, investimentosDolar:  6_208_251, total: 45_046_373 },
  { data: '31/08/2022', compraDeTerras: 12_662_051, custeios: 14_192_000, investimentos:  5_067_027, investimentosDolar:  5_486_299, total: 37_407_376 },
  { data: '31/08/2023', compraDeTerras:  5_131_027, custeios:  7_872_000, investimentos:  3_974_010, investimentosDolar:  4_612_992, total: 21_590_029 },
  { data: '31/08/2024', compraDeTerras:  8_976_000, custeios:  4_002_121, investimentos:  5_259_935, investimentosDolar:          0, total: 18_238_056 },
  { data: '31/08/2025', compraDeTerras:  8_720_000, custeios:  3_301_750, investimentos:  3_649_943, investimentosDolar:          0, total: 15_671_693 },
];

// ─── Cores por categoria ──────────────────────────────────────────────────────
export const DEBT_CHART_COLORS = {
  custeios:           '#f59e0b',  // yellow  — padrão da tela
  investimentos:      '#3b82f6',  // blue    — padrão da tela
  investimentosDolar: '#10b981',  // emerald — dólar/moeda estrangeira
  compraDeTerras:     '#64748b',  // slate   — ativos fixos
} as const;
