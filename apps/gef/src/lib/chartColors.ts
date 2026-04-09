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
  chart5: '#f4af2d',  // gold
} as const;

/** Ordered palette for series/slices — use with .map((_, i) => PALETTE[i % PALETTE.length]) */
export const PALETTE = [
  CHART_COLORS.chart1,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
] as const;
