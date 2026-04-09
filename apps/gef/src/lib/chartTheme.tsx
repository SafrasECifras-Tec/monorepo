import React from 'react';

/**
 * Shared chart theme for GEF Recharts components.
 * Keeps visual chrome (grid, axes, tooltips, labels) consistent across all charts
 * and aligned with the design system tokens.
 */

// ── Recharts prop presets ─────────────────────────────────────────────────────

/** CartesianGrid: horizontal-only dashes, design-system border color */
export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3' as const,
  vertical: false,
  stroke: 'hsl(var(--border))',
  opacity: 0.7,
};

/** Axis tick style — muted foreground, compact font */
export const CHART_AXIS_TICK = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 11,
} as const;

/** Tooltip hover-column background */
export const CHART_CURSOR = { fill: 'hsl(var(--muted) / 0.5)' };

/** Standard bar corner radius for standalone (non-stacked) bars — matches PLT. */
export const CHART_BAR_RADIUS = [6, 6, 0, 0] as const;

/**
 * Custom shape for STACKED bar charts that rounds only the topmost visible
 * segment per stack column. Inner segments stay rectangular so no artefacts
 * appear between layers.
 *
 * @param chartData  The data array passed to <BarChart>
 * @param thisKey    The dataKey of the bar this shape is for
 * @param allKeys    ALL stack keys ordered bottom → top (e.g. ['a','b','c'])
 *
 * @example
 * <Bar dataKey="a" stackId="s" shape={stackedTopRadius(data, 'a', KEYS)} />
 * <Bar dataKey="b" stackId="s" shape={stackedTopRadius(data, 'b', KEYS)} />
 * <Bar dataKey="c" stackId="s" shape={stackedTopRadius(data, 'c', KEYS)} />
 */
export function stackedTopRadius(
  chartData: Record<string, any>[],
  thisKey: string,
  allKeys: readonly string[],
) {
  return function RoundedStackedBar(props: any) {
    const { x, y, width, height, index, fill } = props;
    if (!height || height <= 0) return null;

    const row = chartData[index] ?? {};
    const keyIdx = allKeys.indexOf(thisKey);
    // Round the top only if every key rendered ABOVE this one is falsy for this row
    const isTop = allKeys.slice(keyIdx + 1).every(k => !row[k]);
    const r = isTop ? 6 : 0;

    return (
      <path
        d={[
          `M ${x + r},${y}`,
          `L ${x + width - r},${y}`,
          `Q ${x + width},${y} ${x + width},${y + r}`,
          `L ${x + width},${y + height}`,
          `L ${x},${y + height}`,
          `L ${x},${y + r}`,
          `Q ${x},${y} ${x + r},${y}`,
          'Z',
        ].join(' ')}
        fill={fill}
      />
    );
  };
}

// ── Label components ──────────────────────────────────────────────────────────

/**
 * Top-of-bar compact currency label (R$ Xk / R$ X,XXM).
 * Drop-in replacement for the hand-rolled TotalLabel in debt/DRE charts.
 */
export function ChartBarTopLabel(props: {
  x?: number; y?: number; width?: number; value?: number;
}) {
  const { x = 0, y = 0, width = 0, value } = props;
  if (!value) return null;

  const formatted =
    value >= 1_000_000
      ? `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`
      : value >= 1_000
      ? `R$ ${(value / 1_000).toFixed(0)}k`
      : `R$ ${value}`;

  return (
    <text
      x={x + width / 2} y={y - 6}
      textAnchor="middle"
      fill="hsl(var(--foreground))"
      fontSize={11}
      fontWeight={700}
    >
      {formatted}
    </text>
  );
}

// ── Tooltip primitives ────────────────────────────────────────────────────────

const tooltipBase =
  'bg-popover border border-border p-4 rounded-2xl shadow-float min-w-[200px] z-50 pointer-events-none';

const tooltipTitle =
  'text-sm font-bold mb-2 border-b border-border/50 pb-2';

/** A single row inside GefTooltip */
export interface GefTooltipEntry {
  /** Dot colour (optional) */
  color?: string;
  label: string;
  value: string;
  /** Renders the value with font-bold instead of font-semibold */
  bold?: boolean;
}

/**
 * Standard tooltip wrapper — matches PLT's CustomChartTooltip style.
 * Pass as `content={<GefTooltip .../>}` or build it inline using
 * `gefTooltipClass` / `gefTooltipTitleClass` constants.
 */
export function GefTooltip({
  title,
  entries,
  footer,
}: {
  title: string;
  entries: GefTooltipEntry[];
  footer?: { label: string; value: string };
}) {
  return (
    <div className={tooltipBase}>
      <p className={tooltipTitle}>{title}</p>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={i} className="flex justify-between items-center text-xs gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {e.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: e.color }}
                />
              )}
              {e.label}
            </span>
            <span className={e.bold ? 'font-bold tabular-nums' : 'font-semibold tabular-nums'}>
              {e.value}
            </span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="flex justify-between text-xs pt-2 mt-2 border-t border-border/50 font-bold">
          <span>{footer.label}</span>
          <span>{footer.value}</span>
        </div>
      )}
    </div>
  );
}

/** Exported class strings for charts that build their tooltip JSX inline */
export const gefTooltipClass = tooltipBase;
export const gefTooltipTitleClass = tooltipTitle;
