import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

/** Font size in SVG user units (mm): uniform across all cuts; doubled for legibility. */
const PIECE_WALL_FONT_MM = 56;
const PIECE_LABEL_FONT_MM = 48;
const STOCK_DIM_FONT_MM = 68;

/** Target gap from piece inner top/left edges to dimension text (mm); capped on very small cuts. */
const DIM_EDGE_INSET_TARGET_MM = 36;

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
}

function buildPieceTitle(p: {
  widthMm: number;
  heightMm: number;
  nominalWidthMm?: number;
  nominalHeightMm?: number;
  rotated?: boolean;
  elementTitle?: string;
}): string {
  const cut = `${Math.round(p.widthMm)}×${Math.round(p.heightMm)} mm`;
  const nomW = p.nominalWidthMm;
  const nomH = p.nominalHeightMm;
  const hasNominal =
    nomW != null &&
    nomH != null &&
    (Math.round(nomW) !== Math.round(p.widthMm) || Math.round(nomH) !== Math.round(p.heightMm));
  const ordered = hasNominal ? `ordered ${Math.round(nomW!)}×${Math.round(nomH!)} mm` : null;
  const parts = [p.elementTitle, cut, ordered, p.rotated ? 'rotated' : null].filter(Boolean);
  return parts.join(' — ');
}

interface GlassNestSvgProps {
  layout: GlassLayout;
  elementsMap: Record<string, GlazingElement>;
  elementFilter: string;
  svgClassName?: string;
  svgStyle?: React.CSSProperties;
}

const GlassNestSvg: React.FC<GlassNestSvgProps> = ({
  layout,
  elementsMap,
  elementFilter,
  svgClassName = '',
  svgStyle,
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

  const stockStroke = Math.max(1, Math.min(w, h) * 0.0012);
  const stockLabelFs = STOCK_DIM_FONT_MM;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className={svgClassName}
      style={{ aspectRatio: `${w} / ${h}`, ...svgStyle }}
      aria-hidden
    >
      <rect x={0} y={0} width={w} height={h} fill="#E5E7EB" stroke="#6B7280" strokeWidth={stockStroke} />

      {ordered.map((p, i) => {
        const isPiece = p.kind === 'piece';
        const element = p.elementId ? elementsMap[p.elementId] : undefined;
        const match =
          elementFilter === 'all' || !isPiece || !p.elementId || p.elementId === elementFilter;
        const opacity = match ? 1 : 0.28;
        const fill = isPiece ? element?.color ?? DEFAULT_PIECE_FILL : WASTE_FILL;
        const strokeW = Math.max(1, Math.min(w, h) * 0.0015);

        const dimW = Math.round(p.widthMm);
        const dimH = Math.round(p.heightMm);
        const visibleLabel =
          isPiece && (element?.title || p.elementId)
            ? element?.title ?? p.elementId ?? ''
            : '';

        const titleText = isPiece
          ? buildPieceTitle({
              widthMm: p.widthMm,
              heightMm: p.heightMm,
              nominalWidthMm: p.nominalWidthMm,
              nominalHeightMm: p.nominalHeightMm,
              rotated: p.rotated,
              elementTitle: element?.title ?? p.elementId,
            })
          : `Waste ${dimW}×${dimH} mm`;

        const fsDim = PIECE_WALL_FONT_MM;
        const fsLabel = PIECE_LABEL_FONT_MM;
        const shortSide = Math.min(p.widthMm, p.heightMm);
        const edgePad = Math.min(
          DIM_EDGE_INSET_TARGET_MM,
          Math.max(14, shortSide * 0.2)
        );

        const showCenterLabel = isPiece && Boolean(visibleLabel);
        const labelMargin = edgePad + fsDim * 0.45;
        const maxLabelChars = Math.max(
          6,
          Math.floor((p.widthMm - labelMargin * 2) / (fsLabel * 0.52))
        );

        const cx = p.xMm + p.widthMm / 2;
        const cy = p.yMm + p.heightMm / 2;
        const topY = p.yMm + edgePad + fsDim * 0.32;
        const leftX = p.xMm + edgePad + fsDim * 0.32;

        return (
          <g key={`${p.kind}-${i}-${p.xMm}-${p.yMm}`} opacity={opacity}>
            <rect
              x={p.xMm}
              y={p.yMm}
              width={p.widthMm}
              height={p.heightMm}
              fill={fill}
              stroke="#4B5563"
              strokeWidth={strokeW}
            />
            {isPiece && (
              <>
                <text
                  x={cx}
                  y={topY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fsDim}
                  fill="#111827"
                  fontWeight={500}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {dimW}
                </text>
                <text
                  x={leftX}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fsDim}
                  fill="#111827"
                  fontWeight={500}
                  transform={`rotate(-90 ${leftX} ${cy})`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {dimH}
                </text>
                {showCenterLabel && (
                  <text
                    x={cx}
                    y={cy + fsDim * 0.55}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fsLabel}
                    fill="#1F2937"
                    fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {truncateLabel(visibleLabel, maxLabelChars)}
                  </text>
                )}
              </>
            )}
            <title>{titleText}</title>
          </g>
        );
      })}

      <text
        x={w / 2}
        y={h - stockLabelFs * 0.35}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize={stockLabelFs}
        fill="#374151"
        fontWeight={600}
        stroke="#F9FAFB"
        strokeWidth={stockLabelFs * 0.14}
        paintOrder="stroke fill"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {Math.round(w)}
      </text>
      <text
        x={stockLabelFs * 0.35}
        y={h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={stockLabelFs}
        fill="#374151"
        fontWeight={600}
        stroke="#F9FAFB"
        strokeWidth={stockLabelFs * 0.14}
        paintOrder="stroke fill"
        transform={`rotate(-90 ${stockLabelFs * 0.35} ${h / 2})`}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {Math.round(h)}
      </text>
    </svg>
  );
};

const GlassCuttingNest: React.FC<GlassCuttingNestProps> = ({
  layout,
  elementsMap,
  elementFilter,
  className = '',
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const close = useCallback(() => setFullscreen(false), []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen, close]);

  const { stock } = layout;
  const sw = stock.widthMm;
  const sh = stock.heightMm;

  const modal =
    fullscreen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex flex-col bg-black/80"
        role="dialog"
        aria-modal="true"
        aria-label="Glass layout full screen"
      >
        <div className="flex shrink-0 items-center justify-end gap-2 px-3 py-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Close
          </button>
        </div>
        <div
          className="flex min-h-0 flex-1 cursor-pointer items-center justify-center p-4"
          onClick={close}
          role="presentation"
        >
          <div
            className="flex max-h-[calc(100vh-5rem)] max-w-[96vw] w-full cursor-default items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {sw > 0 && sh > 0 ? (
              <GlassNestSvg
                layout={layout}
                elementsMap={elementsMap}
                elementFilter={elementFilter}
                svgClassName="max-h-[calc(100vh-5rem)] w-full border-2 border-gray-300 bg-gray-200 shadow-2xl rounded-sm"
              />
            ) : null}
          </div>
        </div>
      </div>,
      document.body
    );

  if (sw <= 0 || sh <= 0) {
    return <GlassNestSvg layout={layout} elementsMap={elementsMap} elementFilter={elementFilter} />;
  }

  return (
    <div className={`group relative ${className}`}>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="w-full rounded-lg text-left transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
        aria-label="Open glass layout in full screen for inspection"
      >
        <GlassNestSvg
          layout={layout}
          elementsMap={elementsMap}
          elementFilter={elementFilter}
          svgClassName="h-auto w-full max-w-full border-2 border-gray-400 bg-gray-200"
        />
      </button>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:text-xs">
        Click to expand
      </span>
      {modal}
    </div>
  );
};

export default GlassCuttingNest;
