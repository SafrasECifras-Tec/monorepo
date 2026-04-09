/**
 * Decorative plow-furrow lines — Safras & Cifras brand element.
 * 4 parallel lines in brand colors that run horizontally then curve 90°
 * downward at roughly the horizontal center of the page, imitating a field
 * plow (arado) pattern. Positioned to visually pass behind the lower cards.
 */
export function PlowLines() {
  // Curve starts at ~50% of the 1440-unit viewBox width, with a large sweeping radius
  const curveX = 720; // x where the horizontal ends and the arc begins
  const R = 200;      // corner radius — large for a soft, elegant sweep
  const viewW = 1440;
  const viewH = 380;

  const lines = [
    { color: '#0062a3', y: 38  },  // brand blue   (top)
    { color: '#467f5f', y: 78  },  // brand dark green
    { color: '#a9bf9a', y: 118 },  // brand light green
    { color: '#f4af2d', y: 158 },  // brand gold    (bottom)
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
          // Horizontal from left → large 90° arc → vertical down
          d={`M 0 ${y} H ${curveX} A ${R} ${R} 0 0 1 ${curveX + R} ${y + R} V ${viewH}`}
          stroke={color}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
