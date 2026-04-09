/**
 * Decorative plow-furrow / pipe-connector lines — Safras & Cifras brand element.
 *
 * Each line traces a pipe-elbow path:
 *
 *   ─────────────╮          Q-bézier elbow  (right → down)
 *                │
 *                │  D px    straight vertical section
 *                │
 *                ╰──────── Q-bézier elbow  (down → right)
 *
 * All 4 lines use identical geometry — only y shifts by `spacing`.
 * D = spacing so each line's vertical section sits flush against the next
 * one, forming a clean parallel pipe-bundle column.
 */
export function PlowLines() {
  const COLORS = ['#0062a3', '#467f5f', '#a9bf9a', '#f4af2d']; // blue → gold

  const spacing = 36;    // vertical gap between lines
  const y0  = 20;        // y of top (blue) line
  const R   = 64;        // elbow radius  — generous, pipe-like
  const D   = spacing;   // straight vertical depth = spacing → sections sit adjacent
  const x1  = 700;       // x where elbows begin  (~49 % of 1440)
  const viewW = 1440;
  const viewH = 480;     // tall enough; container is also 480 px → no y-distortion

  // Each line's full drop: 2R + D
  const drop = 2 * R + D; // 164

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
        const y    = y0 + i * spacing;   // 20 | 56 | 92 | 128
        const yEnd = y + drop;            // 184 | 220 | 256 | 292

        return (
          <path
            key={color}
            d={[
              `M 0 ${y}`,
              `H ${x1}`,
              // Elbow 1 — going RIGHT turns to going DOWN
              `Q ${x1 + R} ${y}  ${x1 + R} ${y + R}`,
              // Straight vertical section (D = spacing → adjacent to next line's section)
              `V ${y + R + D}`,
              // Elbow 2 — going DOWN turns to going RIGHT
              `Q ${x1 + R} ${yEnd}  ${x1 + 2 * R} ${yEnd}`,
              `H ${viewW}`,
            ].join(' ')}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
