/**
 * Resolve CSS custom properties (HSL channel format) to hex at runtime.
 * Recharts requires hex strings — this bridges design tokens → hex.
 *
 * Uses an internal cache so repeated calls (e.g. inside React renders)
 * don't trigger getComputedStyle on every frame. Cache is invalidated
 * when the theme changes (e.g. dark mode toggle) via invalidateChartColorCache().
 *
 * Usage:
 *   const colors = getChartColors();
 *   <Bar fill={colors.chart1} />
 *
 * With React (recommended):
 *   const colors = useMemo(() => getChartColors(), [theme]);
 */

let _cache: Record<string, string> | null = null;

/** Clear the cached colors — call when toggling dark/light mode. */
export function invalidateChartColorCache(): void {
  _cache = null;
}

/**
 * Parse an HSL channel string like "151 56% 28%" into an
 * #rrggbb hex string. Falls back to #888888 if parsing fails.
 */
function hslChannelsToHex(hslChannels: string): string {
  const parts = hslChannels.trim().split(/\s+/);
  if (parts.length < 3) return "#888888";

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  // HSL → RGB conversion
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)));
  };

  const r = f(0);
  const g = f(8);
  const b = f(4);

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Read a single CSS custom property and convert to hex. */
function resolveToken(token: string): string {
  if (typeof document === "undefined") return "#888888";
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!raw) return "#888888";
  return hslChannelsToHex(raw);
}

export interface ChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  primary: string;
  primaryLight: string;
  destructive: string;
  success: string;
  warning: string;
}

/**
 * Get the full chart color palette as hex strings.
 * Results are cached until invalidateChartColorCache() is called.
 */
export function getChartColors(): ChartColors {
  if (_cache) return _cache as ChartColors;

  const colors: ChartColors = {
    chart1: resolveToken("--chart-1"),
    chart2: resolveToken("--chart-2"),
    chart3: resolveToken("--chart-3"),
    chart4: resolveToken("--chart-4"),
    chart5: resolveToken("--chart-5"),
    primary: resolveToken("--primary"),
    primaryLight: resolveToken("--sidebar-primary"), // lighter primary variant
    destructive: resolveToken("--destructive"),
    success: resolveToken("--success"),
    warning: resolveToken("--warning"),
  };

  _cache = colors;
  return colors;
}

/**
 * Ordered palette for series/slices.
 * Usage: colors[i % colors.length]
 */
export function getChartPalette(): string[] {
  const c = getChartColors();
  return [c.chart1, c.chart2, c.chart3, c.chart4, c.chart5];
}
