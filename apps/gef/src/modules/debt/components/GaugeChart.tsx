import React from 'react';

interface ColorRange {
  min: number;
  max: number;
  color: string;
}

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  colorRanges: ColorRange[];
}

function polarToCartesian(centerX: number, centerY: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: centerX + r * Math.cos(rad), y: centerY + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle - 90);
  const end   = polarToCartesian(cx, cy, r, endAngle   - 90);
  const large = endAngle - startAngle > 180 ? '1' : '0';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

export function GaugeChart({ value, max, colorRanges }: GaugeChartProps) {
  const cx = 130, cy = 120, r = 80, sw = 24;
  const activeColor = colorRanges.find(rng => value >= rng.min && value <= rng.max)?.color
    ?? colorRanges[colorRanges.length - 1].color;
  const angle = Math.min(Math.max((value / max) * 180, 0), 180);

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-full min-h-[200px]">
      <svg viewBox="0 0 260 140" className="w-full max-w-[280px] overflow-visible">
        <path d={arcPath(cx, cy, r, 0, 180)} fill="none" stroke="#cbd5e1" strokeWidth={sw} strokeLinecap="round" />
        <path
          d={arcPath(cx, cy, r, 0, angle)}
          fill="none"
          stroke={activeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <text x={cx - r} y={cy + 30} fontSize="14" fill="#64748b" textAnchor="middle" fontWeight="500">0</text>
        <text x={cx + r} y={cy + 30} fontSize="14" fill="#64748b" textAnchor="middle" fontWeight="500">{max}</text>
      </svg>
      <div className="absolute bottom-2 left-0 right-0 text-center flex flex-col items-center">
        <span className="text-5xl font-bold text-foreground tracking-tight">{value.toFixed(2)}</span>
      </div>
    </div>
  );
}
