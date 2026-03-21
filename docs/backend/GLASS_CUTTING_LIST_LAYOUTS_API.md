# Glass Cutting List — 2D Layouts & Placements (Backend Spec)

This document specifies how the **glass cutting list** portion of the project calculation response should be extended so the frontend can render **accurate nested sheet diagrams** (per-sheet placement, waste regions, rotation), instead of inferring layout from aggregate `cuts[]` only.

**Audience:** backend / calculation engine implementers.  
**Related:** [MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md](./MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md) (glazing elements, existing `glassList.cuts` summary).

---

## 1. Problem statement

### Current shape (insufficient for nesting UI)

```json
{
  "glassList": {
    "cuts": [
      { "h": 1120, "w": 439, "qty": 20, "elementId": "el_0" }
    ],
    "sheet_type": "3310x2140mm",
    "total_sheets": 2
  }
}
```

`cuts[]` answers **how many** pieces of each size exist and which `elementId` they belong to. It does **not** answer:

- On **which** physical sheet (or pattern) each piece appears  
- **Position** `(x, y)` and **size** on that sheet  
- **Rotation** relative to nominal glazing dimensions  
- **Waste / offcut** regions as explicit geometry  

The frontend cannot reconstruct a valid 2D nest from aggregates alone without duplicating the optimizer.

### Goal

Return **machine-readable geometry** produced by the same 2D nesting / cutting logic that computes `total_sheets` and `cuts[]`, so the web app can draw one diagram per distinct sheet pattern and support element highlighting without hiding other pieces.

---

## 2. Coordinate system (contract)

| Rule | Value |
|------|--------|
| Origin | **Top-left** corner of the stock sheet |
| +X | Right |
| +Y | **Down** (same as SVG / HTML) |
| Units | **Millimetres (`mm`)** for all placement fields |
| Rectangle | `xMm`, `yMm` = top-left; `widthMm`, `heightMm` = size after rotation |

Document this in API docs; clients will scale to pixels or normalized SVG as needed.

### 2.1 Placement quality (neatness & alignment)

Shop-style diagrams read best when geometry is **crisp and flush**:

- Keep all rectangles **axis-aligned** and snapped to a consistent grid (e.g. **integer mm**). Adjacent pieces and waste that share an edge should use the **exact same** boundary coordinate on both sides — avoid sub-millimetre drift that shows as hairline gaps in SVG/PDF.
- Emit `placements` in a **deterministic order** (recommended: sort by `yMm` ascending, then `xMm`) so the UI and exports are stable between runs.
- Prefer **fewer, larger waste rectangles** that exactly tile leftover area (or one combined offcut) instead of many tiny fragments, when the optimizer allows — easier to read and label.

The frontend draws **width along the top interior edge** and **height along the left interior edge** of each piece, with the glazing **element title** in the center; accurate shared edges from the backend keep that layout looking aligned (similar to common panel-nesting UIs).

---

## 3. Extended `glassList` shape

### 3.1 Top-level `glassList` fields

Keep existing fields for backward compatibility and summaries:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sheet_type` | `string` | Yes | Human-readable, e.g. `"3310x2140mm"` (may duplicate `layouts[].stock`). |
| `total_sheets` | `number` | Yes | Total physical sheets (see §5 for consistency with `layouts`). |
| `cuts` | `array` | Yes | **Summary** BOM: `{ w, h, qty, elementId? }[]` — unchanged semantics. |
| `layouts` | `array` | **Yes** (new) | Distinct nesting patterns; see §3.2. |

### 3.2 Layout object

Each entry describes **one unique cutting pattern** on a stock rectangle. Multiple physical sheets may share the same pattern.

```ts
type GlassLayout = {
  layoutId: string;        // Stable id, e.g. "L1", "L2"
  repeatCount: number;     // How many physical sheets use this exact pattern (>= 1)
  stock: {
    widthMm: number;       // Sheet width in mm
    heightMm: number;      // Sheet height in mm
  };
  placements: GlassPlacement[];
};
```

| Field | Description |
|--------|-------------|
| `layoutId` | Stable string; frontend uses it for keys and optional deep links. |
| `repeatCount` | If all sheets are identical, send **one** layout with `repeatCount === total_sheets`. |
| `stock` | Must match the stock size used for nesting (should align with `sheet_type` when parsed). |
| `placements` | Ordered list of axis-aligned rectangles to draw (pieces + optional waste). |

### 3.3 Placement object

```ts
type GlassPlacement = {
  kind: "piece" | "waste";
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;

  // Present when kind === "piece"
  elementId?: string;      // Matches GlazingElement.id (e.g. "el_0")
  rotated?: boolean;       // true if nominal W/H were swapped to fit (default false)

  // Optional — improves labels and QA
  nominalWidthMm?: number;
  nominalHeightMm?: number;
  glazingDimensionsIndex?: number;  // Index into request/context glazingDimensions[] if useful
};
```

| Field | Required | Description |
|--------|----------|-------------|
| `kind` | Yes | `"piece"` = customer glass; `"waste"` = unused stock region the UI shows as offcut. |
| `xMm`, `yMm`, `widthMm`, `heightMm` | Yes | Geometry on sheet in mm. |
| `elementId` | If `kind === "piece"` | Required for pieces so the UI can color/label by glazing element. |
| `rotated` | No | If true, UI may show nominal vs cut or a rotation indicator. |
| `nominalWidthMm` / `nominalHeightMm` | No | “Ordered” size vs actual cut size (kerf, grind). |
| `glazingDimensionsIndex` | No | Extra traceability to input line items. |

**Waste:** Prefer emitting explicit `kind: "waste"` rectangles for every scrap region the product should visualize. If the engine only outputs pieces, document that the client will show “implicit” waste only as the complement of the union of pieces (harder and error-prone for complex nests).

---

## 4. JSON examples

### 4.1 Two distinct patterns (`total_sheets` = 2)

```json
{
  "glassList": {
    "sheet_type": "3310x2140mm",
    "total_sheets": 2,
    "cuts": [
      { "h": 1120, "w": 439, "qty": 20, "elementId": "el_0" },
      { "h": 720, "w": 268, "qty": 4, "elementId": "el_3" }
    ],
    "layouts": [
      {
        "layoutId": "L1",
        "repeatCount": 1,
        "stock": { "widthMm": 3310, "heightMm": 2140 },
        "placements": [
          {
            "kind": "piece",
            "elementId": "el_0",
            "xMm": 0,
            "yMm": 0,
            "widthMm": 439,
            "heightMm": 1120,
            "rotated": false,
            "nominalWidthMm": 1200,
            "nominalHeightMm": 1300
          },
          {
            "kind": "waste",
            "xMm": 3073,
            "yMm": 0,
            "widthMm": 237,
            "heightMm": 1120
          }
        ]
      },
      {
        "layoutId": "L2",
        "repeatCount": 1,
        "stock": { "widthMm": 3310, "heightMm": 2140 },
        "placements": []
      }
    ]
  }
}
```

> **Note:** `placements` in `L2` are empty only as a placeholder; production responses must include the full list of pieces and waste for that pattern.

### 4.2 Identical sheets (single layout, repeated)

```json
{
  "glassList": {
    "sheet_type": "3310x2140mm",
    "total_sheets": 49,
    "cuts": [{ "h": 1120, "w": 439, "qty": 343, "elementId": "el_0" }],
    "layouts": [
      {
        "layoutId": "L1",
        "repeatCount": 49,
        "stock": { "widthMm": 3310, "heightMm": 2140 },
        "placements": []
      }
    ]
  }
}
```

Here `repeatCount` must equal `49` and the single `placements` array is the diagram for **any** of those 49 sheets.

---

## 5. Consistency and validation rules

1. **`total_sheets`**  
   Should equal **sum of `layouts[].repeatCount`** (recommended invariant). If you ever need “placeholder” layouts, document the exception.

2. **`stock` per layout**  
   For a given project, if all layouts use the same sheet size, `stock` may be identical across layouts; still repeat it per layout for clarity and future multi-stock support.

3. **`cuts[]` vs `layouts`**  
   Total area or piece counts derived from `layouts` (expanded by `repeatCount`) should be **reconcilable** with `cuts[]` (same totals per `w`, `h`, `elementId` within rounding). Helps catch serialization bugs.

4. **Bounds**  
   For every placement:  
   `xMm >= 0`, `yMm >= 0`, `xMm + widthMm <= stock.widthMm`, `yMm + heightMm <= stock.heightMm` (tolerance: document if sub-mm rounding is allowed).

5. **No overlaps for `piece`**  
   Pieces should not overlap. Waste may abut pieces; waste regions may be merged into fewer rects or split into many—both are fine if non-overlapping with pieces.

6. **`elementId`**  
   Every `kind: "piece"` placement must reference an `elementId` that exists in the calculation response’s glazing **`elements`** array (see existing glazing elements doc).

---

## 6. Optional: normalized coordinates (alternative)

If the engine prefers **normalized** geometry (e.g. 0–1000 like some cutting UIs), you may add **either**:

- `coordinateSpace: "mm"` (default) with fields as above, or  
- `coordinateSpace: "normalized"` with `x`, `y`, `width`, `height` in 0–1 or 0–1000 **relative to `stock`**, **plus** `stock.widthMm` / `stock.heightMm` for dimension labels.

The frontend can support one canonical form first (`mm`); normalized can be a later optimization.

---

## 7. Migration checklist for backend

- [ ] Extend nesting pipeline to serialize **per-layout** `placements` (pieces + waste).  
- [ ] Assign stable `layoutId` and correct `repeatCount`.  
- [ ] Keep existing `cuts`, `sheet_type`, `total_sheets` for backward compatibility.  
- [ ] Validate invariants in §5 in tests or CI.  
- [ ] Update OpenAPI / internal API docs and notify frontend when deployed.

---

## 8. Frontend usage (summary)

- Render diagram from `layouts[selected].placements` scaled by `layouts[selected].stock`.  
- Sheet selector: choose layout index or “physical sheet index” mapped to `(layoutId, instance)` via `repeatCount`.  
- Element filter: adjust **opacity/highlight** only; **do not** remove placements from the payload for the nest view.

---

## Document history

| Date | Change |
|------|--------|
| 2025-03-21 | Initial spec for nested `glassList.layouts` and `placements`. |
