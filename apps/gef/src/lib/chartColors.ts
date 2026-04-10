/**
 * Centralized chart color palette for Recharts components.
 * Recharts requires hex values — it cannot consume CSS custom properties.
 * Keep in sync with the --chart-* tokens in index.css.
 */
export const CHART_COLORS = {
  primary: '#267046',
  primaryLight: '#3d9960',
  success: '#2d8a56',
  destructive: '#dc2626',
  warning: '#e69500',
  chart1: '#267046',  // green (primary)
  chart2: '#e06050',  // coral
  chart3: '#d4a017',  // gold
  chart4: '#3b82f6',  // blue
  chart5: '#f4af2d',  // yellow
} as const;

/**
 * Paleta padrão de séries — usada em todos os gráficos do sistema.
 * Regra: importar estas constantes em vez de hardcodar hex nos componentes.
 */
export const C = {
  orange: '#f59e0b', // amber-500  — séries laranja/destaque
  blue:   '#3b82f6', // blue-500   — séries azul
  green:  '#10b981', // emerald-500 — séries verde / sucesso
  gray:   '#475569', // slate-600  — séries neutro / cinza
} as const;

/** Ordered palette for series/slices — use with .map((_, i) => PALETTE[i % PALETTE.length]) */
export const PALETTE = [
  CHART_COLORS.chart1,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
] as const;

/** Paleta sequencial padrão para séries múltiplas */
export const SERIES_PALETTE = [
  C.blue,
  C.green,
  C.orange,
  C.gray,
] as const;
