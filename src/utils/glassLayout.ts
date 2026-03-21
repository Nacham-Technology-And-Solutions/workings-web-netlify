import type { GlassLayout, GlassListResult, GlassPlacement } from '@/types/calculations';

const emptyGlassList = (): GlassListResult => ({
  sheet_type: '',
  total_sheets: 0,
  cuts: [],
});

/** Map physical sheet index (0-based) to index in `layouts[]` using repeatCount bands. */
export function layoutIndexForPhysicalSheet(layouts: GlassLayout[], physicalIndex: number): number {
  let remaining = physicalIndex;
  for (let i = 0; i < layouts.length; i++) {
    const c = Math.max(0, layouts[i].repeatCount);
    if (remaining < c) return i;
    remaining -= c;
  }
  return Math.max(0, layouts.length - 1);
}

export function pieceCountOnLayout(layout: GlassLayout): number {
  return layout.placements.filter((p) => p.kind === 'piece').length;
}

/** True when API sent nest geometry we can draw (non-empty placements). */
export function hasUsableGlassLayouts(glassList: GlassListResult | null | undefined): boolean {
  const layouts = glassList?.layouts;
  if (!Array.isArray(layouts) || layouts.length === 0) return false;
  return layouts.some((L) => Array.isArray(L.placements) && L.placements.length > 0);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePlacement(p: Record<string, unknown>): GlassPlacement {
  const kindRaw = p.kind;
  const kind = kindRaw === 'waste' ? 'waste' : 'piece';
  return {
    kind,
    xMm: num(p.xMm ?? p.x_mm),
    yMm: num(p.yMm ?? p.y_mm),
    widthMm: num(p.widthMm ?? p.width_mm),
    heightMm: num(p.heightMm ?? p.height_mm),
    elementId: (p.elementId ?? p.element_id) as string | undefined,
    rotated: Boolean(p.rotated),
    nominalWidthMm: p.nominalWidthMm != null || p.nominal_width_mm != null
      ? num(p.nominalWidthMm ?? p.nominal_width_mm)
      : undefined,
    nominalHeightMm: p.nominalHeightMm != null || p.nominal_height_mm != null
      ? num(p.nominalHeightMm ?? p.nominal_height_mm)
      : undefined,
  };
}

function normalizeLayout(L: Record<string, unknown>): GlassLayout {
  const stock = (L.stock as Record<string, unknown>) || {};
  const placementsRaw = L.placements;
  const placements: GlassPlacement[] = Array.isArray(placementsRaw)
    ? placementsRaw.map((item) => normalizePlacement(item as Record<string, unknown>))
    : [];

  return {
    layoutId: String(L.layoutId ?? L.layout_id ?? ''),
    repeatCount: Math.max(1, num(L.repeatCount ?? L.repeat_count, 1)),
    stock: {
      widthMm: num(stock.widthMm ?? stock.width_mm),
      heightMm: num(stock.heightMm ?? stock.height_mm),
    },
    placements,
  };
}

/**
 * Coerce API glassList (camelCase or snake_case) into GlassListResult.
 * Preserves unknown fields on the root object only via spread for debugging — prefer typed access.
 */
export function normalizeGlassListResult(data: unknown): GlassListResult {
  if (!data || typeof data !== 'object') return emptyGlassList();
  const o = data as Record<string, unknown>;

  const cutsRaw = o.cuts;
  const cuts = Array.isArray(cutsRaw)
    ? cutsRaw.map((c) => {
        const row = c as Record<string, unknown>;
        return {
          h: num(row.h),
          w: num(row.w),
          qty: num(row.qty),
          elementId: (row.elementId ?? row.element_id) as string | undefined,
        };
      })
    : [];

  const layoutsRaw = o.layouts;
  const layouts: GlassLayout[] | undefined =
    Array.isArray(layoutsRaw) && layoutsRaw.length > 0
      ? layoutsRaw.map((item) => normalizeLayout(item as Record<string, unknown>))
      : undefined;

  return {
    sheet_type: String(o.sheet_type ?? ''),
    total_sheets: num(o.total_sheets, 0),
    cuts,
    layouts,
  };
}
