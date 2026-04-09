/**
 * Decorative plow-furrow lines — Safras & Cifras brand element.
 *
 * Shape per line — smooth cubic Bézier S-curve with horizontal tangents:
 *
 *   ─────────────╮
 *                 ╲  ← steep diagonal middle (≈ 48° from horizontal)
 *                  ╰─────────────
 *
 * Path: M 0 y  H x1  C (x1+t) y  (x2-t) (y+dY)  x2 (y+dY)  H viewW
 *
 * All 4 lines are identical — only y shifts by `spacing`, keeping
 * the lines perfectly parallel throughout the curve.
 */
export function PlowLines() {
  const COLORS = ['#0062a3', '#467f5f', '#a9bf9a', '#f4af2d']; // blue → gold

  const spacing = 32;   // vertical gap between lines
  const y0  = 30;       // y of top (blue) line
  const x1  = 640;      // S-curve begins here  (~44 % of viewBox)
  const x2  = 800;      // S-curve ends here    (~56 % of viewBox)
  const t   = 35;       // Bézier handle length — short = steep visible middle
  const dY  = 180;      // total vertical drop per line
  const viewW = 1440;
  const viewH = y0 + (COLORS.length - 1) * spacing + dY + 90; // ≈ 410

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {COLORS.map((color, i) => {
        const y = y0 + i * spacing; // 30 | 62 | 94 | 126

        return (
          <path
            key={color}
            d={[
              `M 0 ${y}`,
              `H ${x1}`,
              // Cubic Bézier: horizontal handle at start, horizontal handle at end,
              // short handles → steep ~48° diagonal in the middle
              `C ${x1 + t} ${y}  ${x2 - t} ${y + dY}  ${x2} ${y + dY}`,
              `H ${viewW}`,
            ].join(' ')}
            stroke={color}
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
