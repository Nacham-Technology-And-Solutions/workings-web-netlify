# Frontend: Calculation Result Integration (Post–Engine Rebuild)

This document lists **API fields and UI gaps** after the calculation engine rebuild (Modules 1–8). Use it when updating the “Project Calculation Results” screen and related tabs.

**Related:** `docs/ENGINE-REBUILD-CHECKLIST.md` (backend), `POST /api/v1/calculations/calculate`, `POST /api/v1/projects/:id/calculate`, `GET /api/v1/projects/:id`.

---

## 1. Full result shape

Every successful calculation returns (or should expose) this object — either as `response.result` (calculate) or `response.lastCalculationResult` (GET project, **after re-calculate**):

```ts
{
  materialList: MaterialListItem[];   // Profiles (unit: "lengths"), glass sheets (unit: "sheets")
  cuttingList: CuttingListItem[];     // Per-profile stock plans
  glassList: { sheet_type, total_sheets?, cuts, layouts? };
  netList?: { cuts: { w, h, qty }[], roll_type?, total_rolls?, total_area_m2?, required_length_m? };
  rubberTotals: { name, total_meters }[];
  accessoryTotals: { name, qty, unit }[];
  screwTotals: { name, qty }[];       // NEW — often empty for net-only modules
  warnings: string[];                 // NEW — engine notices
  elements?: { id, title, color }[]; // el_0, el_1, …
}
```

### UI sections to wire

| API field                                 | Suggested UI section       | Notes                                           |
| ----------------------------------------- | -------------------------- | ----------------------------------------------- |
| `materialList` where `type === 'Profile'` | **Profiles**               | Stock bar counts (`units`); display `unit`: **`lengths`** |
| `materialList` where `type === 'Sheet'`   | **Glass sheets**           | From glass optimizer                            |
| `accessoryTotals`                         | **Accessories**            | Handles, rollers, cleats, etc.                  |
| `rubberTotals`                            | **Rubber / seal / spline** | **Was missing on M8 screen**                    |
| `screwTotals`                             | **Screws**                 | Module 1, M3 attachment screws                  |
| `netList.cuts`                            | **Net cutting list**       | Pane sizes & qty — **not** “Net Mesh” accessory |
| `cuttingList`                             | **Cutting plans** tab      | Per profile                                     |
| `glassList`                               | **Glass cutting** tab      | 2D nest when present                            |
| `warnings`                                | Banner or list             | Non-fatal messages                              |

---

## 2. Module 8 — EBM Net (U-Channel)

### Cart payload (outer frame mm)

Use **`width`** and **`height`** (not only `in_to_in_*`):

```json
{
  "module_id": "M8_EBM_Net_UChannel",
  "width": 1200,
  "height": 1300,
  "qty": 10
}
```

Aliases accepted: `M8_EBM_Net_U_Channel`, `W`/`H`, `in_to_in_width`/`in_to_in_height` (mapped to outer frame for M8).

### What the backend returns (your regression cart)

| Item                      | Value                                       |
| ------------------------- | ------------------------------------------- |
| EBM-Net U-Channel Profile | 16 units (stock bars)                       |
| EBM-net Panel Profile     | 22 units                                    |
| 25-25 Angle Profile       | 1 unit (96 pieces @ 20 mm in `cuttingList`) |
| Roller / Angle Set        | 48                                          |
| Handle                    | 48                                          |
| **Net Spline / Rubber**   | **128.36 m** in `rubberTotals`              |
| **Net panes**             | **48** in `netList.cuts` (grouped sizes)    |

### What is **not** sent for Module 8

- **No `"Net Mesh"`** line in `accessoryTotals` or `materialList` (by design).
- Net quantity is **`netList.cuts`** (sum of `qty`), not a separate mesh SKU.

### UI action items for M8

1. Render **`rubberTotals`** — show `Net Spline / Rubber` with `total_meters` (3 dp if you match glazing rubber rules; engine uses 2 dp for this name).
2. Add a **Net** tab/section from **`netList.cuts`** (width × height × qty table).
3. Do **not** wait for a “Net Mesh” accessory row.

---

## 3. Module 7 — EBM Net (1125/26 frame)

- Profiles: **1125**, **1126**, **EBM-net Panel** (separate lines — never merged “1125/26”).
- `rubberTotals`: **`Net Spline / Rubber`** (panel-based, not frame-only).
- `accessoryTotals`: Roller / Angle Set, Handle, Frame Screw.
- `netList`: 2 panes per cart line (`qty` × cart item qty).

Input: `in_to_in_width`, `in_to_in_height` (aliases: `width`, `height`, `W`, `H`).

---

## 4. Module 6 — 1125/26 (1132 panel)

- Profiles: **1125**, **1126**, **1132** (three lines).
- `rubberTotals`: **`1132 Rubber Spline`** (metres).
- `netList`: 2 panes per item.
- Accessories: 1132 Angle, Handle, Frame Screw (not optimized profile stock).

---

## 5. Module 3 — Sliding 2-sash + fixed net

- Implemented as **`M2_Sliding_2Sash`** with `options: { fixedNet: true }` or module id **`M3_Sliding_2Sash_FixedNet`** / **`M3_Sliding_2Sash_Net`**.
- **Net panes** → `netList` (1 per window), **not** `accessoryTotals.Net Mesh`.
- `rubberTotals`: **`Net Spline`** (metres).
- `accessoryTotals`: **Corner Cleats**.
- **`screwTotals`**: **Attachment Screws** (8 per window).

---

## 6. Module 1 — Casement (D/Curve)

### New / changed behaviour

| Topic            | Detail                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Opening vs fixed | `O` opening panels (default `O = N`). Fixed panels use **Bead Profile**, opening use **D/curve**. |
| Accessories      | Handles (`pcs`), **Hinges** (`pairs`), **Stoppers** (`pairs`, 2 per pair) — only for **`O`** panels. |
| Profile units    | `materialList[].unit` = **`lengths`** (stock bar count in `units`).                               |
| Angles           | **40/40 Angle Profile** appears in **`cuttingList`** @ 35 mm — **not** in `accessoryTotals`.      |
| Rubber           | **Glazing Rubber** + **Brush / Wool Pile** in `rubberTotals`.                                     |
| Screws           | **`screwTotals`**: `4mm Screw`, `Coupling / Mullion Screw`.                                       |

---

## 7. Modules 2, 4, 5 — Sliding windows

- **Module 4**: `netList` (1 net pane per window) + glass in `glassList`; accessories include rollers and key/handle sets. Net mesh is **not** an accessory.
- **Module 5**: All glass — **no** `netList`.
- **Module 2 + fixedNet**: Same net rules as Module 3.

---

## 8. Settings & cart fields (API validation)

`POST .../calculate` and project calculate accept:

```ts
settings: {
  stockLength?: 6 | 5.58 | 5.85 | 6000 | 5850;  // metres if ≤20, else mm
  bladeKerf?: number;
  wasteThreshold?: number;
  netMargin?: number;
  netRoll?: { widthMm, lengthMm };  // optional net roll summary on netList
}
```

Cart item extras:

- `width`, `height` — required for **M8** (outer frame).
- `in_to_in_width`, `in_to_in_height` — **M6 / M7**.
- `options.fixedNet` — **M2 / M3** fixed net.
- `O` — **M1** opening panel count.

---

## 9. Saved projects vs live calculate

| Source                                                      | Includes `netList` / `screwTotals` / `warnings`?         |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `POST /calculations/calculate` → `response.result`          | Yes (always)                                             |
| `POST /projects/:id/calculate` → `calculationResult.result` | Yes                                                      |
| `GET /projects/:id` → `lastCalculationResult`               | **Yes after backend fix** — stored on `GlassCuttingList` |

**Important:** Projects calculated **before** the DB migration may have `netList: null` until the user runs **Calculate** again.

---

## 10. Quick checklist for the results screen

- [ ] **Rubber / spline** section bound to `rubberTotals` (all modules with rubber).
- [ ] **Net** section bound to `netList.cuts` (M3, M4, M6, M7, M8) — show total pane count.
- [ ] **Screws** section bound to `screwTotals` (M1, M3).
- [ ] **Warnings** banner from `warnings[]`.
- [ ] M8: use `width`/`height` on cart; show 3 profile lines + spline + net cuts.
- [ ] M1: do not expect 40/40 Angle in accessories — use `cuttingList` or material list for angle profile bars.
- [ ] Do not rely on **“Net Mesh”** accessory for any module.

---

## 11. Example: reading net pane total (Module 8)

```ts
const netPaneCount = result.netList?.cuts?.reduce((sum, c) => sum + c.qty, 0) ?? 0;
// Module 8 regression cart → 48
```

```ts
const splineMeters = result.rubberTotals?.find((r) => r.name.includes('Spline'))?.total_meters;
// Module 8 regression cart → 128.36
```

---

_Last updated: calculation result persistence (`netList`, `screwTotals`, `warnings` on project GET)._
