# Frontend: Calculation Result Integration (Post–Engine Rebuild)

This document lists **API fields and UI gaps** after the calculation engine rebuild (Modules 1–8). Use it when updating the “Project Calculation Results” screen and related tabs.

**Related:** `docs/ENGINE-REBUILD-CHECKLIST.md` (backend), `POST /api/v1/calculations/calculate`, `POST /api/v1/projects/:id/calculate`, `GET /api/v1/projects/:id`.

---

## 1. Full result shape

Every successful calculation returns (or should expose) this object — either as `response.result` (calculate) or `response.lastCalculationResult` (GET project, **after re-calculate**):

```ts
{
  materialList: MaterialListItem[];   // type: Profile | Accessory (with explicit unit)
  cuttingList: CuttingListItem[];     // Per-profile stock plans
  glassList: { sheet_type, total_sheets?, cuts, layouts? };
  netList?: { cuts: { w, h, qty }[], roll_type?, total_rolls?, total_area_m2?, required_length_m? };
  rubberTotals: { name, total_meters }[];
  accessoryTotals: { name, qty, unit, pieceQty? }[];  // pieceQty e.g. Rollers sets → pcs
  screwTotals: { name, qty }[];       // NEW — often empty for net-only modules
  warnings: string[];                 // NEW — engine notices
  elements?: { id, title, color }[]; // el_0, el_1, …
}
```

### UI sections to wire

| API field                             | Suggested UI section       | Notes                                                               |
| ------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `materialList` `type === 'Profile'`   | **Profiles**               | `units` = stock bars; `unit`: **`length`** if 1, else **`lengths`** |
| `materialList` `type === 'Accessory'` | **Accessories**            | Filter/group by `unit`: sheets, rolls, pcs, pairs, sets, m, …       |
| `accessoryTotals`                     | *(deprecated — empty)*   | Use `materialList` instead                                          |
| `rubberTotals`                        | *(deprecated — empty)*   | Rubber lines are `materialList` accessories with `unit: "m"`        |
| `screwTotals`                         | *(deprecated — empty)*   | Screw lines are `materialList` accessories with `unit: "pcs"`       |
| `netList.cuts`                        | **Net cutting list**       | Pane sizes & qty — **not** “Net Mesh” accessory                     |
| `cuttingList`                         | **Cutting plans** tab      | Per profile                                                         |
| `glassList`                           | **Glass cutting** tab      | 2D nest when present                                                |
| `warnings`                            | Banner or list             | Non-fatal messages                                                  |

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

**Projects:** same numbers in `glazingDimensions[].parameters` — see **§8b** (`moduleId` + positive `width`/`height`; `title` is display-only).

### What the backend returns (your regression cart)

| Item                      | Value                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------- |
| EBM-Net U-Channel Profile | 16 lengths (`units` + `unit: "lengths"`)                                              |
| EBM-Net Panel Profile     | 22 lengths                                                                            |
| 25-25 Angle Profile       | 1 length (96 pieces @ 20 mm in `cuttingList`)                                         |
| Roller / Angle Set        | 48 sets                                                                               |
| Handle                    | 48 pcs                                                                                |
| Frame Screw               | 384 pcs (`accessoryTotals` + `materialList`)                                          |
| **Net Spline / Rubber**   | **128.36 m** in `rubberTotals`                                                        |
| **Net panes**             | **48** in `netList.cuts` (grouped sizes)                                              |
| **Net purchase**          | `materialList` — **`Net Mesh Roll (1.5m x 25m)`**, `type: 'Roll'`                     |
| **Frame Screw purchase**  | `materialList` — **`Frame Screw`**, `type: 'Accessory'`, `unit`: **`pc`** / **`pcs`** |

Profile material units: **`length`** when `units === 1`, else **`lengths`** (e.g. 16 U-Channel lengths on the PDF cart).

### What is **not** sent for Module 8

- **No `"Net Mesh"`** line in `accessoryTotals` (by design).
- Net pane sizes live in **`netList.cuts`**; roll count in **`netList.total_rolls`** and **`materialList`**.

### UI action items for M8

1. Render **`rubberTotals`** — show `Net Spline / Rubber` with `total_meters` (3 dp if you match glazing rubber rules; engine uses 2 dp for this name).
2. Add a **Net** tab/section from **`netList.cuts`** (width × height × qty table).
3. Show **`Net Mesh Roll`** on the materials tab from `materialList` (same as M4/M6/M7).
4. Show **`Frame Screw`** on materials from `materialList` (`type: 'Accessory'`); keep `accessoryTotals` in sync for qty.

---

## 3. Module 7 — EBM Net (1125/26 frame)

- Profiles: **1125**, **1126**, **`EBM-net Panel Profile`** (separate lines — never merged “1125/26”).
- `rubberTotals`: **`Net Spline / Rubber`** (panel-based, not frame-only).
- `accessoryTotals`: **Roller / Angle Set** (`unit`: **`set`** if qty 1, **`sets`** if qty &gt; 1), Handle, Frame Screw.
- **Frame Screw purchase:** `materialList` — **`Frame Screw`**, `type: 'Accessory'` (same consolidation as M8).
- **Net cutting:** `netList.cuts` — 2 panes per line (`H_panel = in_to_in_height − 20`, `W_panel = (in_to_in_width + 20) / 2`). Use **`w`**, **`h`**, **`qty`** from API (not UI `title` text).
- **Net purchase:** `materialList` — **`Net Mesh Roll (1.5m x 25m)`**, `type: 'Roll'`, `unit`: **`roll`** / **`rolls`** from `units`.
- **Cutting off-cuts:** `CuttingPlanPiece.cut` e.g. **`540mm / 0.54m`** plus `lengthMm` (do not show only rounded metres like `0.6m`).

Input: `in_to_in_width`, `in_to_in_height` (aliases: `width`, `height`, `W`, `H`).

---

## 4. Module 6 — 1125/26 (1132 panel)

- Profiles: **1125**, **1126**, **1132** (three lines).
- `rubberTotals`: **`1132 Rubber Spline`** (metres).
- **Net cutting:** `netList.cuts` — 2 panes per cart line (`H_panel = in_to_in_height − 20`, `W_panel = in_to_in_width / 2`).
- **Net purchase:** `materialList` — **`Net Mesh Roll (1.5m x 25m)`**, `type: 'Roll'`, `unit`: **`roll`** / **`rolls`** (`units` = `netList.total_rolls`). Default roll when `settings.netRoll` omitted: **1.5m × 25m**.
- **Frame Screw purchase:** `materialList` — **`Frame Screw`**, `type: 'Accessory'` (when totals include Frame Screw).
- Accessories: 1132 Angle, Handle, Frame Screw (not optimized profile stock).
- **Cutting list off-cuts:** use `CuttingPlanPiece.cut` (e.g. `540mm / 0.54m`) and `lengthMm`; do not round off-cuts to one decimal metre only.

---

## 5. Module 3 — Sliding 2-sash + fixed net

Same calculator as Module 2 with fixed net enabled:

- Cart: **`M3_Sliding_2Sash_Net`** / **`M3_Sliding_2Sash_FixedNet`**, or **`M2_Sliding_2Sash`** with `options: { fixedNet: true }` (all resolve to the same engine path).
- **Net panes** → `netList` (1 per window). Do **not** use a “Net Mesh” accessory row.
- **All Module 2 accessories** still apply (`Rollers`, `Lockset/Key`, track/coupling screws) — see §7.
- **Module 3–only additions:**

| API field         | Name                  | Unit / notes                                         |
| ----------------- | --------------------- | ---------------------------------------------------- |
| `accessoryTotals` | **Net Angle**         | `pcs` (4 per fixed net; legacy name `Corner Cleats`) |
| `rubberTotals`    | **Net Rubber**        | metres (legacy name `Net Spline`; formula unchanged) |
| `rubberTotals`    | **Wool Pile / Brush** | metres (from M2 sliding sash)                        |
| `screwTotals`     | **Attachment Screws** | 8 per window (unchanged)                             |

**Rollers (M2 & M3):** `qty` in **`set`**, optional **`pieceQty`** for total pieces — display e.g. `24 sets (96 pcs)`.

---

## 6. Module 1 — Casement (D/Curve)

### New / changed behaviour

| Topic            | Detail                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Opening vs fixed | `O` opening panels (default `O = N`). Fixed panels use **Bead Profile**, opening use **D/curve**.    |
| Accessories      | Handles (`pcs`), **Hinges** (`pairs`), **Stoppers** (`pairs`, 2 per pair) — only for **`O`** panels. |
| Profile units    | `materialList[].unit` = **`length`** / **`lengths`** from `units` (stock bar count).                 |
| Angles           | **40/40 Angle Profile** appears in **`cuttingList`** @ 35 mm — **not** in `accessoryTotals`.         |
| Rubber           | **Glazing Rubber** + **Brush / Wool Pile** in `rubberTotals`.                                        |
| Screws           | **`screwTotals`**: `4mm Screw`, `Coupling / Mullion Screw`.                                          |

---

## 7. Modules 2, 4, 5 — Sliding windows

### Module 2 — Standard 2-Sash (display labels)

| API `accessoryTotals.name` | `unit` | Also                                                    |
| -------------------------- | ------ | ------------------------------------------------------- |
| `Rollers`                  | `set`  | `pieceQty` = total roller pieces (4 per set per window) |
| `Lockset/Key`              | `set`  |                                                         |
| `Track Screw (Long 4mm)`   | `pcs`  |                                                         |
| `Coupling Screw`           | `pcs`  |                                                         |

Display rollers as: **`{qty} {unit} ({pieceQty} pcs)`** when `pieceQty` is present.

**Purchase vs calculation:** the engine still uses **4 pcs/window** (M2/M3) or **6 pcs/window** (M4/M5). **`pieceQty`** is the **total calculated pieces**. **`qty` + `set`** is **how many 4‑piece packs to buy**: `ceil(pieceQty / 4)` (e.g. M2 regression: 16 pcs → **4 sets**; M4 regression: 24 pcs → **6 sets**).

- Profiles: `materialList[].unit` = **`length`** / **`lengths`** from `units`.
- Wool pile: `rubberTotals` name **`Wool Pile / Brush`** (`total_meters`, display as **m**).

### Module 3 — 2-Sash + fixed net

Uses the **Module 2 rows above**, plus §5 (Net Angle, Net Rubber, Attachment Screws).  
**Do not** expect `Corner Cleats` or `Net Spline` on new calculations (legacy names are normalized on GET when possible).

### Modules 4 & 5

| Module | Rollers (calc)   | Purchase display                                                         | Net                                                                 |
| ------ | ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **4**  | **6 pcs/window** | **`Rollers`**, `set` + `pieceQty` (6 sets for 24 pcs on regression cart) | `netList.cuts` (panes) + **`materialList`** `Net Mesh Roll` (rolls) |
| **5**  | **6 pcs/window** | same as M4                                                               | no `netList` (all glass)                                            |

**Module 4 accessories (per window, × cart qty):**

| `accessoryTotals.name`   | `unit` | Per window            |
| ------------------------ | ------ | --------------------- |
| `Key/lock`               | `sets` | 2 (glass sashes only) |
| `Track Screw (Long 4mm)` | `pcs`  | 8                     |
| `Coupling Screw`         | `pcs`  | 12 (3 panels × 4)     |

**Module 4 `rubberTotals`:** `Glazing Rubber` (glass panes only), `Wool Pile / Brush` (3 sashes).

**Module 5 accessories (per window, × cart qty):**

| `accessoryTotals.name`   | `unit` | Per window | Notes                                                                      |
| ------------------------ | ------ | ---------- | -------------------------------------------------------------------------- |
| `Key/lock`               | `sets` | 1          | `pieceQty` = 2 physical pcs/set (2 pcs/window → 24 sets on 24-window cart) |
| `Track Screw (Long 4mm)` | `pcs`  | 8          |                                                                            |
| `Coupling Screw`         | `pcs`  | 12         | 3 panels × 4                                                               |

**Module 5 `rubberTotals`:** `Glazing Rubber` (3 glass panes), `Wool Pile / Brush` (3 sliding panels). No `netList`.

**Do not** use `Net Mesh` in `accessoryTotals` for M4 — net **purchase** is `materialList` roll line; net **cuts** are `netList.cuts`. Default roll size when `settings.netRoll` is omitted: **1.5m × 25m** (1500×25000 mm).

---

## 8. Settings & cart fields (API validation)

### 8a. `POST /api/v1/calculations/calculate` (and engine on project calculate)

```ts
settings: {
  stockLength?: 6 | 5.58 | 5.85 | 6000 | 5850;  // values ≤20 treated as metres (×1000 → mm)
  bladeKerf?: number;
  wasteThreshold?: number;
  netMargin?: number;
  netRoll?: { widthMm, lengthMm };
}
```

Cart uses **`module_id`** plus dimension fields:

- `width`, `height` — **M8** outer frame (mm); aliases `W`/`H`, `in_to_in_*` mapped in engine.
- `in_to_in_width`, `in_to_in_height` — **M6 / M7** (aliases: `width`, `height`, `W`, `H`).
- `options.fixedNet` — **M2 / M3** fixed net.
- `O` — **M1** opening panel count.

### 8b. Saved project — `PATCH /api/v1/projects/:id`

**`glazingDimensions`** (not `projectCart`):

```json
{
  "moduleId": "M8_EBM_Net_UChannel",
  "glazingCategory": "Net",
  "glazingType": "EBM-Net (U-Channel)",
  "parameters": { "qty": 10, "width": 1200, "height": 1300 },
  "title": "1200×1300",
  "color": "#3B82F6"
}
```

- Use **`moduleId`** on each row; dimensions live in **`parameters`**.
- **`width` / `height` must be &gt; 0** if sent (`0` fails Zod → **400**). Do not rely on `title` for sizing.
- **`calculationSettings.stockLength`** on PATCH accepts only **`6`** or **`5.58`** (metres), not `6000`/`5850`.

Project calculate reads stored `glazingDimensions` + `calculationSettings` and maps `moduleId` → engine `module_id`.

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
- [ ] M8: **`parameters.width` / `parameters.height` &gt; 0** on project save; show profiles + spline + net cuts + roll + Frame Screw on materials.
- [ ] Materials: show **`Roll`** and **`Accessory`** rows on `materialList`, not only Profile/Sheet.
- [ ] M1: do not expect 40/40 Angle in accessories — use `cuttingList` or material list for angle profile bars.
- [ ] M1: **Hinges** / **Stoppers** use `pairs` (stoppers: `qty` is pair count, not single pieces).
- [ ] M2/M3: **Rollers** use `set` + `pieceQty`; do not show as plain `pcs` only.
- [ ] M3: **Net Angle** / **Net Rubber** (not Corner Cleats / Net Spline).
- [ ] M4/M5: **Rollers** — 6 pcs/window in calc; display **`set`** + **`pieceQty`** (pack size 4).
- [ ] Profiles: render `units` + `unit` (`length` / `lengths`, etc.), not the word “units”.
- [ ] Do not rely on **“Net Mesh”** accessory for any module.

---

## 11. Example: reading net pane total (Module 8)

Use **`netList.cuts[].w`**, **`h`**, **`qty`** from the API (orientation as stored by the engine).

```ts
const netPaneCount = result.netList?.cuts?.reduce((sum, c) => sum + c.qty, 0) ?? 0;
// Module 8 regression cart → 48
```

```ts
// Prefer exact names; fallback for older stored rows
const splineMeters = result.rubberTotals?.find(
  (r) => r.name === 'Net Spline / Rubber' || r.name === 'Net Rubber' || r.name === 'Net Spline'
)?.total_meters;
// Module 8 regression cart → 128.36
```

---

## 12. Legacy display names (normalized on API read)

| Endpoint                                      | Normalization                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `POST /calculations/calculate`                | Raw engine output (current modules already use new names).                                                                  |
| `GET /projects/:id` → `lastCalculationResult` | `buildCalculationResultView` runs **`normalizeAccessoryTotalRow`** and **`normalizeRubberDisplay`** for legacy stored rows. |

Fresh **re-calculate** persists new names; GET may still remap old DB strings until recalculated.

| Legacy                                    | Current (module)                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `Friction Stay` / `pair`                  | **Hinges** / `pairs` (M1)                                               |
| `Corner Cleats`                           | **Net Angle** (M3)                                                      |
| `Net Spline`                              | **Net Rubber** (M3)                                                     |
| `Wool Pile`                               | **Wool Pile / Brush** (M2/M3)                                           |
| `Lock Set`, `Track Screws`, `Sash Screws` | **Lockset/Key**, **Track Screw (Long 4mm)**, **Coupling Screw** (M2/M3) |
| `Key/Handle Sets`                         | **Key/lock** / `sets` (M4/M5)                                           |
| `Roller` / `Rollers` stored as `pcs`      | **`Rollers`**, **`set`** + **`pieceQty`** (`sets = ceil(pcs / 4)`)      |

---

_Off-cuts: engine returns `cut` (e.g. `540mm / 0.54m`), optional `lengthMm` / `classification` on plan pieces — client Zod verify schema may lag runtime._

_Last updated: M4–M8 (net roll, Frame Screw on `materialList`, plural units, project PATCH validation §8b)._
