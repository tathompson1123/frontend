/**
 * Oakame-style three-bar pulsing loader.
 * Each bar scales vertically in a staggered wave — bar 1, 2, 3 offset by 0.15s each.
 *
 * Props:
 *   color  — CSS color string (default: currentColor)
 *   size   — 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 */
export default function OakameLoader({ color = 'currentColor', size = 'md' }) {
  const dims = {
    sm: { w: 4,  h: 24, gap: 3 },
    md: { w: 7,  h: 36, gap: 5 },
    lg: { w: 10, h: 52, gap: 6 },
    xl: { w: 14, h: 72, gap: 8 },
  };
  const { w, h, gap } = dims[size] || dims.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="oakame-bar"
          style={{
            width: w,
            height: h,
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
