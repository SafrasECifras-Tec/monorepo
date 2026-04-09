/**
 * Decorative plow-furrow lines — Safras & Cifras brand element.
 * 4 parallel lines in brand colors:  horizontal → curve down →
 * curve back to horizontal (S-curve / arado headland-turn pattern).
 * Positioned to pass behind the lower module cards.
 */
export function PlowLines() {
  // Quadratic Bézier corners give perfectly smooth 90° turns.
  //
  //   ──────────╮
  //              │   Q1: → turns ↓
  //              ╰──────────
  //                  Q2: ↓ turns →
  //
  const R  = 110;  // corner radius (viewBox units)
  const x1 = 570;  // x where the step begins  (~40% of 1440px viewBox)
  const viewW = 1440;
  const viewH = 480; // tall enough for the lower horizontal to be visible

  const lines = [
    { color: '#0062a3', y: 22  },  // brand blue       (top)
    { color: '#467f5f', y: 58  },  // brand dark green
    { color: '#a9bf9a', y: 94  },  // brand light green
    { color: '#f4af2d', y: 130 },  // brand gold        (bottom)
  ];

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {lines.map(({ color, y }) => (
        <path
          key={color}
          d={[
            `M 0 ${y}`,
            `H ${x1}`,
            // Q1 — going RIGHT turns to going DOWN
            `Q ${x1 + R} ${y} ${x1 + R} ${y + R}`,
            // Q2 — going DOWN turns back to going RIGHT
            `Q ${x1 + R} ${y + 2 * R} ${x1 + 2 * R} ${y + 2 * R}`,
            `H ${viewW}`,
          ].join(' ')}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
