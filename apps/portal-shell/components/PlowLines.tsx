/**
 * Decorative plow-furrow lines — Safras & Cifras brand element.
 * 4 parallel lines in brand colors that run horizontally then curve 90°
 * downward at the right edge, imitating a field plow (arado) pattern.
 */
export function PlowLines() {
  const R = 90; // corner radius (viewBox units)
  const viewW = 1440;
  const viewH = 220;

  const lines = [
    { color: '#0062a3', y: 30 },   // brand blue
    { color: '#467f5f', y: 62 },   // brand dark green
    { color: '#a9bf9a', y: 94 },   // brand light green
    { color: '#f4af2d', y: 126 },  // brand gold
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
          // Horizontal from left → curve 90° clockwise → vertical down
          d={`M 0 ${y} H ${viewW - R} A ${R} ${R} 0 0 1 ${viewW} ${y + R} V ${viewH}`}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
