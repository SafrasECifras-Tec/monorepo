/**
 * Decorative plow-furrow lines — Safras & Cifras brand element.
 *
 * Each of the 4 lines makes the SAME path:
 *   horizontal ─── 90° turn down ─── straight down ─── 90° turn right ─── horizontal
 *
 * Because all paths use identical geometry (same x1, R, D) just shifted by
 * a constant y, the lines stay perfectly parallel (constant 36 px gap)
 * throughout both curves and the straight section.
 *
 *   ─────────╮
 *             │   ← Q bezier right→down
 *             │   ← straight vertical (D px)
 *             ╰─────────
 *                 ← Q bezier down→right
 */
export function PlowLines() {
  const COLORS = ['#0062a3', '#467f5f', '#a9bf9a', '#f4af2d']; // blue → gold

  const spacing = 36;  // px between lines (constant throughout)
  const y0 = 24;       // y of top (blue) line
  const R  = 80;       // corner radius for both 90° turns
  const D  = 32;       // straight vertical depth between the two turns
  const x1 = 680;      // x where the step begins (~47 % of 1440 viewBox)
  const viewW = 1440;
  const viewH = 370;

  // Vertical sections (at x = x1+R = 760):
  //   line i: from (y0+i*spacing)+R  to  (y0+i*spacing)+R+D
  // Gap between adjacent vertical sections = spacing − D = 36−32 = 4 px (non-overlapping ✓)

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
        const y    = y0 + i * spacing;       // 24 | 60 | 96 | 132
        const yEnd = y + 2 * R + D;          // 216 | 252 | 288 | 324

        return (
          <path
            key={color}
            d={[
              `M 0 ${y}`,
              `H ${x1}`,
              // Q1 — smooth 90° turn: going RIGHT → going DOWN
              `Q ${x1 + R} ${y} ${x1 + R} ${y + R}`,
              // Straight vertical section
              `V ${y + R + D}`,
              // Q2 — smooth 90° turn: going DOWN → going RIGHT
              `Q ${x1 + R} ${yEnd} ${x1 + 2 * R} ${yEnd}`,
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
