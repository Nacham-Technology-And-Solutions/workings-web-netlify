import React, { useMemo } from 'react';
import type { GlassLayout, GlazingElement } from '@/types/calculations';

export interface GlassCuttingNestProps {
  layout: GlassLayout;
  elementsMap: Record<string, GlazingElement>;
  /** Highlight matching pieces; others dimmed. 'all' = no dimming. */
  elementFilter: string;
  className?: string;
}

const WASTE_FILL = '#D1D5DB';
const DEFAULT_PIECE_FILL = '#C8DEE5';

/**
 * SVG nest: waste rects first, then pieces on top. Scales to fit width.
 */
const GlassCuttingNest: React.FC<GlassCuttingNestProps> = ({
  layout,
  elementsMap,
  elementFilter,
  className = '',
}) => {
  const { stock, placements } = layout;
  const w = stock.widthMm;
  const h = stock.heightMm;

  const ordered = useMemo(() => {
    const waste = placements.filter((p) => p.kind === 'waste');
    const pieces = placements.filter((p) => p.kind === 'piece');
    return [...waste, ...pieces];
  }, [placements]);

  if (w <= 0 || h <= 0) {
    return <p className="text-sm text-gray-500 relative z-10">Invalid stock dimensions for layout.</p>;
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className={`w-full max-w-2xl border-2 border-gray-400 bg-gray-200 ${className}`}
      style={{ aspectRatio: `${w} / ${h}` }}
      aria-label="Glass sheet cutting layout"
    >
      {ordered.map((p, i) => {
        const isPiece = p.kind === 'piece';
        const element = p.elementId ? elementsMap[p.elementId] : undefined;
        const match =
          elementFilter === 'all' || !isPiece || !p.elementId || p.elementId === elementFilter;
        const opacity = match ? 1 : 0.28;
        const fill = isPiece ? element?.color ?? DEFAULT_PIECE_FILL : WASTE_FILL;
        const labelW = p.nominalWidthMm ?? p.widthMm;
        const labelH = p.nominalHeightMm ?? p.heightMm;
        const titleParts = [
          `${Math.round(p.widthMm)}×${Math.round(p.heightMm)} mm`,
          isPiece && (labelW !== p.widthMm || labelH !== p.heightMm) ? `ordered ${Math.round(labelW)}×${Math.round(labelH)}` : null,
          isPiece && element?.title,
          p.rotated ? 'rotated' : null,
        ].filter(Boolean);

        return (
          <g key={`${p.kind}-${i}-${p.xMm}-${p.yMm}`} opacity={opacity}>
            <rect
              x={p.xMm}
              y={p.yMm}
              width={p.widthMm}
              height={p.heightMm}
              fill={fill}
              stroke="#4B5563"
              strokeWidth={Math.max(1, Math.min(w, h) * 0.0015)}
            />
            {isPiece && p.widthMm > 40 && p.heightMm > 28 && (
              <text
                x={p.xMm + p.widthMm / 2}
                y={p.yMm + p.heightMm / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(56, Math.min(p.widthMm, p.heightMm) * 0.12)}
                fill="#1F2937"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {`${Math.round(labelW)}×${Math.round(labelH)}`}
              </text>
            )}
            <title>{titleParts.join(' — ')}</title>
          </g>
        );
      })}
    </svg>
  );
};

export default GlassCuttingNest;
