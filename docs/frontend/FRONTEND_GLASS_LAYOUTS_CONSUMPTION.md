# Frontend guide — consuming `glassList.layouts`

This document explains how to use the **2D glass nest** data returned on project calculation and on stored glass cutting lists. For the full contract and rationale, see [GLASS_CUTTING_LIST_LAYOUTS_API.md](./GLASS_CUTTING_LIST_LAYOUTS_API.md).

---

## Where this data appears

| Source | Notes |
|--------|--------|
| **Calculate project** | `calculationResult.glassList` includes `layouts` when the engine produced glass nesting (same payload shape you persist). |
| **GET glass cutting list** | `glassCuttingList.glassList` (JSON) — includes `layouts` **after** projects are recalculated on a backend that ships this feature. Older stored rows may omit `layouts`. |
| **Project detail** (if you embed latest glass list) | Same `glassList` object as above. |

Treat `layouts` as **optional** for backward compatibility: if it is missing or empty, fall back to your existing BOM view using only `cuts`, `sheet_type`, and `total_sheets`.

---

## What changed in `glassList`

Existing fields are unchanged:

- `sheet_type` — e.g. `"3310x2140mm"`
- `total_sheets` — number of physical sheets
- `cuts[]` — summary BOM: `{ h, w, qty, elementId? }` (still the source of truth for quantities and sizes in aggregate form)

**New (optional):**

- `layouts[]` — distinct cutting **patterns**; each pattern may apply to more than one physical sheet via `repeatCount`.

---

## TypeScript-friendly shapes

```ts
type GlassList = {
  sheet_type: string;
  total_sheets?: number;
  cuts: Array<{ h: number; w: number; qty: number; elementId?: string }>;
  layouts?: GlassLayout[];
};

type GlassLayout = {
  layoutId: string; // e.g. "L1", "L2" — stable key for React
  repeatCount: number; // physical sheets that use this exact pattern
  stock: { widthMm: number; heightMm: number };
  placements: GlassPlacement[];
};

type GlassPlacement = {
  kind: 'piece' | 'waste';
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  elementId?: string; // present for `kind: 'piece'` when element-aware
  rotated?: boolean;
  nominalWidthMm?: number;
  nominalHeightMm?: number;
};
```

**`elements[]`** on the same calculation response (see glazing elements doc) maps `elementId` → `title` and `color` for UI.

---

## Coordinate system (important for drawing)

| Rule | Value |
|------|--------|
| Origin | Top-left of the stock sheet |
| +X | Right |
| +Y | Down (same as SVG / HTML / Canvas) |
| Units | Millimetres for all `*Mm` fields |

Each placement is an axis-aligned rectangle: top-left `(xMm, yMm)`, size `(widthMm, heightMm)`.

---

## Rendering recipe (SVG or Canvas)

1. **Pick a layout**  
   User selects a pattern index `i` in `layouts[i]`, or you derive “physical sheet #N” by walking layouts and consuming `repeatCount` (see below).

2. **Define scale**  
   `scale = containerWidth / layout.stock.widthMm` (or fit both dimensions with letterboxing).  
   Pixel size: `rectWidth = placement.widthMm * scale`, etc.

3. **Draw in order**  
   - Draw **waste** first (e.g. neutral grey) so pieces sit on top, **or** draw a full-sheet background then waste then pieces — both work if you draw waste rects explicitly.  
   - Draw **pieces** on top; fill/stroke using `elements.find(e => e.id === placement.elementId)?.color`.

4. **Labels (shop-style)**  
   - **Cut dimensions on walls:** show **width** (`widthMm`, rounded) centered along the **top** interior edge of the piece; show **height** (`heightMm`) centered along the **left** interior edge, rotated to read parallel to that wall (same idea as optiCutter-style panel plans).  
   - **Center label:** show glazing **`elements[].title`** for that `elementId` (this text should match the hover / `<title>` summary).  
   - **Tooltip / `<title>`:** include element title, cut size, and when useful `nominalWidthMm` × `nominalHeightMm` plus `rotated` — same facts as the visible label set.  
   - **Stock sheet:** optional overall width along the bottom edge and height along the left edge of the stock rectangle.

5. **No layout math on the client**  
   Do not re-run nesting from `cuts[]` for the diagram when `layouts` is present — use placements as authoritative geometry.

---

## Physical sheet index ↔ layout

`total_sheets` should equal **`sum(layouts[j].repeatCount)`** when `layouts` is populated.

Example: layouts `[{ layoutId: 'L1', repeatCount: 2 }, { layoutId: 'L2', repeatCount: 1 }]` → 3 physical sheets: sheets 0–1 are `L1`, sheet 2 is `L2`.

Helper sketch:

```ts
function layoutIndexForPhysicalSheet(layouts: GlassLayout[], physicalIndex: number): number {
  let remaining = physicalIndex;
  for (let i = 0; i < layouts.length; i++) {
    const c = layouts[i].repeatCount;
    if (remaining < c) return i;
    remaining -= c;
  }
  return 0;
}
```

---

## Highlighting / filtering by window (element)

- **Do not** remove placements from the array when the user focuses one window.  
- Prefer **opacity**, **stroke**, or **z-index** so other pieces stay visible (per product spec in the backend doc).  
- Resolve color: `elements` array + `placement.elementId`.

If a legacy path returns a `piece` without `elementId`, still draw the rect; use a default fill until data is fully element-aware.

---

## `cuts[]` vs `placements[]`

| `cuts[]` | `placements[]` |
|----------|----------------|
| Aggregated BOM (`qty`, grouped by size / element) | One rect per **instance** on a sheet |
| Fields `h`, `w` | Fields `widthMm`, `heightMm` |
| Good for tables and totals | Good for the nest diagram |

Use both: tables from `cuts`, diagram from `layouts[].placements`.

---

## Validation you can optionally assert in dev

When `layouts` is present and non-empty:

- Every placement satisfies `xMm >= 0`, `yMm >= 0`, `xMm + widthMm <= stock.widthMm`, `yMm + heightMm <= stock.heightMm`.
- `sum(repeatCount) === total_sheets` (if `total_sheets` is defined).

---

## Related documentation

- [GLASS_CUTTING_LIST_LAYOUTS_API.md](../backend/GLASS_CUTTING_LIST_LAYOUTS_API.md) — full backend contract, examples, consistency rules  
- [MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md](../backend/MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md) — `elements[]` and glass summary context  

---

## Document history

| Date | Change |
|------|--------|
| 2026-03-21 | Initial frontend consumption guide for `glassList.layouts`. |
