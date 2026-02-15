# Material Types & Glazing Elements — API Response Formats

This document describes the API response shapes for all **material-related** endpoints: material list, cutting list, and glass cutting list. It also defines the **glazing elements** format used to attribute cuts to specific items (e.g. Window 1, Window 2) with a title and color for the UI.

---

## Short description

- **Material list**: Consolidated “what to buy” (profiles, sheets, accessories, etc.) with quantities and optional pricing.
- **Cutting list**: Smart 1D cutting plan per profile (stock length, bar-by-bar plan). Each cut can be attributed to a **glazing element** (Window 1, Window 2, …) via `elementId`.
- **Glass cutting list**: 2D nesting plan for glass (sheet type, total sheets, cuts with dimensions). Each cut can carry an `elementId` so the UI can show “Window 1 glass”, “Window 2 glass”, etc. The same response includes rubber totals and accessory totals for glazing.
- **Glazing elements**: One entry per cart item (e.g. Window 1, Window 2). Each has `id`, `title`, and `color` (hex). Used by the frontend to label and color-code cuts in both the cutting list and the glass cutting list.

---

## 1. Glazing elements format (shared)

Used in **cutting list** and **glass cutting list** responses. Look up by `elementId` to get title and color for each cut.

```ts
// Array of glazing elements (one per project cart item)
GlazingElement[] = Array<{
  id: string;    // e.g. "el_0", "el_1"
  title: string; // e.g. "Window 1", "Window 2"
  color: string; // Hex, e.g. "#3B82F6"
}>;
```

**Example**

```json
[
  { "id": "el_0", "title": "Window 1", "color": "#3B82F6" },
  { "id": "el_1", "title": "Window 2", "color": "#10B981" }
]
```

---

## 2. Material list API

### Request

Material list is **retrieved** only (no body). The list is produced when you run **Project calculate** (see §5); these GET endpoints return the stored result.

| Endpoint            | Method | Path params               | Body |
| ------------------- | ------ | ------------------------- | ---- |
| By project (latest) | `GET`  | `projectId` (number)      | —    |
| By ID               | `GET`  | `materialListId` (number) | —    |

- **Auth:** Required (session).
- **Path:** `/api/v1/material-lists/project/:projectId` or `/api/v1/material-lists/:materialListId`.

### Response

```json
{
  "responseMessage": "Material list retrieved successfully",
  "response": {
    "materialList": {
      "id": 1,
      "projectId": 1,
      "userId": 1,
      "materialList": [
        {
          "item": "Width Profile",
          "units": 2,
          "type": "Profile",
          "unitPrice": null,
          "totalPrice": null
        },
        {
          "item": "Glass Sheet (3310x2140mm)",
          "units": 1,
          "type": "Sheet"
        }
      ],
      "pointsCost": 10,
      "createdAt": "2025-02-12T10:00:00.000Z",
      "updatedAt": "2025-02-12T10:00:00.000Z",
      "project": {
        "id": 1,
        "projectName": "Office Windows",
        "calculated": true,
        "lastCalculatedAt": "2025-02-12T10:00:00.000Z"
      }
    }
  }
}
```

**Material list item shape** (`response.materialList.materialList[]`)

| Field        | Type    | Description                                                             |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `item`       | string  | e.g. "Transom (55x55mm)", "Glass Sheet (...)"                           |
| `units`      | number  | Total quantity needed                                                   |
| `type`       | string  | `"Profile"` \| `"Accessory_Pair"` \| `"Sheet"` \| `"Roll"` \| `"Meter"` |
| `unitPrice`  | number? | Optional (quotes)                                                       |
| `totalPrice` | number? | Optional (quotes)                                                       |

---

## 3. Cutting list API

### Request

Cutting list is **retrieved** only. It is produced when you run **Project calculate** (see §5); these GET endpoints return the stored result (including `elements`).

| Endpoint            | Method | Path params              | Body |
| ------------------- | ------ | ------------------------ | ---- |
| By project (latest) | `GET`  | `projectId` (number)     | —    |
| By ID               | `GET`  | `cuttingListId` (number) | —    |

- **Auth:** Required (session).
- **Path:** `/api/v1/cutting-lists/project/:projectId` or `/api/v1/cutting-lists/:cuttingListId`.

### Response

```json
{
  "responseMessage": "Cutting list retrieved successfully",
  "response": {
    "cuttingList": {
      "id": 1,
      "projectId": 1,
      "userId": 1,
      "cuttingList": [
        {
          "profile_name": "Width Profile",
          "stock_length": 6000,
          "plan": [
            {
              "cut_1900mm": [
                { "cut": "cut_1900mm", "elementId": "el_0" },
                { "cut": "cut_1900mm", "elementId": "el_1" }
              ],
              "offcut_2055mm": [{ "cut": "offcut_2055mm" }]
            }
          ]
        }
      ],
      "elements": [
        { "id": "el_0", "title": "Window 1", "color": "#3B82F6" },
        { "id": "el_1", "title": "Window 2", "color": "#10B981" }
      ],
      "createdAt": "2025-02-12T10:00:00.000Z",
      "updatedAt": "2025-02-12T10:00:00.000Z",
      "project": {
        "id": 1,
        "projectName": "Office Windows",
        "calculated": true,
        "lastCalculatedAt": "2025-02-12T10:00:00.000Z"
      }
    }
  }
}
```

**Cutting list item shape** (`response.cuttingList.cuttingList[]`)

| Field          | Type   | Description                               |
| -------------- | ------ | ----------------------------------------- |
| `profile_name` | string | e.g. "Width Profile", "Transom (Sliding)" |
| `stock_length` | number | Stock length in mm (e.g. 6000, 5850)      |
| `plan`         | array  | One entry per bar; see below              |

**Plan entry** (one object per bar): keys are cut labels, values are arrays of pieces.

- **With glazing elements**: value is `CuttingPlanPiece[]`:
  - `cut`: string — e.g. `"cut_1900mm"`, `"offcut_2055mm"`, `"waste_120mm"`
  - `elementId`: string (optional) — e.g. `"el_0"`. Omitted for offcut/waste.
- **Legacy**: value can be `string[]` (e.g. `["cut_1900mm", "cut_1900mm"]`). No per-cut attribution.

Use `elementId` to look up title and color in `response.cuttingList.elements`.

---

## 4. Glass cutting list API

### Request

Glass cutting list is **retrieved** only. It is produced when you run **Project calculate** (see §5); these GET endpoints return the stored result (including `elements`).

| Endpoint            | Method | Path params                   | Body |
| ------------------- | ------ | ----------------------------- | ---- |
| By project (latest) | `GET`  | `projectId` (number)          | —    |
| By ID               | `GET`  | `glassCuttingListId` (number) | —    |

- **Auth:** Required (session).
- **Path:** `/api/v1/glass-cutting-lists/project/:projectId` or `/api/v1/glass-cutting-lists/:glassCuttingListId`.

### Response

```json
{
  "responseMessage": "Glass cutting list retrieved successfully",
  "response": {
    "glassCuttingList": {
      "id": 1,
      "projectId": 1,
      "userId": 1,
      "glassList": {
        "sheet_type": "3310x2140mm",
        "total_sheets": 2,
        "cuts": [
          { "h": 450, "w": 320, "qty": 2, "elementId": "el_0" },
          { "h": 450, "w": 320, "qty": 2, "elementId": "el_1" },
          { "h": 1200, "w": 600, "qty": 1, "elementId": "el_0" }
        ]
      },
      "elements": [
        { "id": "el_0", "title": "Window 1", "color": "#3B82F6" },
        { "id": "el_1", "title": "Window 2", "color": "#10B981" }
      ],
      "rubberTotals": [{ "name": "Frame rubber (Transom)", "total_meters": 12.5 }],
      "accessoryTotals": [{ "name": "Tapping screw", "qty": 24, "unit": "pcs" }],
      "createdAt": "2025-02-12T10:00:00.000Z",
      "updatedAt": "2025-02-12T10:00:00.000Z",
      "project": {
        "id": 1,
        "projectName": "Office Windows",
        "calculated": true,
        "lastCalculatedAt": "2025-02-12T10:00:00.000Z"
      }
    }
  }
}
```

**Glass list shape** (`response.glassCuttingList.glassList`)

| Field          | Type   | Description               |
| -------------- | ------ | ------------------------- |
| `sheet_type`   | string | e.g. "3310x2140mm"        |
| `total_sheets` | number | Number of sheets needed   |
| `cuts`         | array  | See glass cut shape below |

**Glass cut shape** (`glassList.cuts[]`)

| Field       | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| `h`         | number  | Height (mm)                                 |
| `w`         | number  | Width (mm)                                  |
| `qty`       | number  | Quantity of this size                       |
| `elementId` | string? | e.g. "el_0" for "Window 1 glass". Optional. |

**Rubber total shape** (`response.glassCuttingList.rubberTotals[]`)

| Field          | Type   |
| -------------- | ------ |
| `name`         | string |
| `total_meters` | number |

**Accessory total shape** (`response.glassCuttingList.accessoryTotals[]`)

| Field  | Type   |
| ------ | ------ | ------------------ |
| `name` | string |
| `qty`  | number |
| `unit` | string | e.g. "pcs", "pair" |

Use `elementId` on each glass cut to look up title and color in `response.glassCuttingList.elements`.

---

## 5. Project calculate (produces all material types + elements)

This is the **request** that creates/updates the material list, cutting list, and glass cutting list. The server uses the project’s stored **glazing dimensions** and **calculation settings** to run the calculation.

### Request

| Item            | Value                                   |
| --------------- | --------------------------------------- |
| **Method**      | `POST`                                  |
| **Path**        | `/api/v1/projects/:projectId/calculate` |
| **Path params** | `projectId` (number)                    |
| **Body**        | None                                    |

- **Auth:** Required (session).
- The project must already exist and have **glazingDimensions** (and optionally **calculationSettings**) set, e.g. via `POST /api/v1/projects` (create) or `PATCH /api/v1/projects/:projectId` (update).

**Project input that drives the result** (set on the project before calling calculate):

**Glazing dimensions** (array, one entry per glazing item — each becomes a glazing element). The backend assigns **id** (`el_0`, `el_1`, …). The frontend can optionally supply **title** and **color** per item; if omitted, backend uses default title (“Window 1”, …) and a default color palette.

```ts
glazingDimensions = Array<{
  glazingCategory: 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall';
  glazingType: string; // e.g. "Casement D/Curve"
  moduleId: string; // e.g. "M1_Casement_DCurve", "M2_Sliding_2Sash"
  parameters: {
    W?: number; // Width (mm)
    H?: number; // Height (mm)
    N?: number; // Panels (1–5)
    O?: number; // Opening panels
    qty?: number; // Quantity
    N_v?: number; // Vertical panels (curtain wall)
    N_h?: number; // Horizontal panels (curtain wall)
    in_to_in_width?: number;
    in_to_in_height?: number;
    cell_heights?: number[];
    cell_width?: number[];
  };
  title?: string;  // Optional: frontend label (e.g. "Living room", "Bedroom 1"); max 100 chars
  color?: string;  // Optional: hex color (e.g. "#3B82F6"); backend uses default palette if omitted
}>;
```

**Calculation settings** (optional):

```ts
calculationSettings = {
  stockLength?: 6 | 5.58;   // meters (6000 or 5850 mm)
  bladeKerf?: number;       // mm (default 5)
  wasteThreshold?: number;  // mm (default 200)
};
```

**Example project payload** (for create/update) with optional frontend **title** and **color** per element:

```json
{
  "projectName": "Office Windows",
  "customer": { "name": "Acme Ltd", "email": "acme@example.com" },
  "siteAddress": "123 Site St",
  "glazingDimensions": [
    {
      "glazingCategory": "Window",
      "glazingType": "Casement D/Curve",
      "moduleId": "M1_Casement_DCurve",
      "parameters": { "W": 1200, "H": 900, "N": 2, "qty": 1 },
      "title": "Living room",
      "color": "#3B82F6"
    },
    {
      "glazingCategory": "Window",
      "glazingType": "Sliding 2 Sash",
      "moduleId": "M2_Sliding_2Sash",
      "parameters": { "W": 1500, "H": 1000, "qty": 1 },
      "title": "Bedroom 1",
      "color": "#10B981"
    }
  ],
  "calculationSettings": { "stockLength": 6 }
}
```

If `title` or `color` are omitted for an item, the backend uses defaults (“Window 1”, “Window 2”, … and a palette color).

After this project is created/updated, `POST /api/v1/projects/:projectId/calculate` uses it to produce the material list, cutting list (with elements), and glass cutting list (with elements).

### Response

```json
{
  "responseMessage": "Project calculation completed successfully",
  "response": {
    "project": { ... },
    "calculationResult": {
      "materialList": { "id": 1, "materialList": [...], "pointsCost": 10, ... },
      "cuttingList": { "id": 1, "cuttingList": [...], "elements": [...], ... },
      "glassCuttingList": { "id": 1, "glassList": {...}, "elements": [...], "rubberTotals": [...], "accessoryTotals": [...], ... },
      "result": {
        "materialList": [...],
        "cuttingList": [...],
        "glassList": { "sheet_type": "...", "total_sheets": 1, "cuts": [...] },
        "rubberTotals": [...],
        "accessoryTotals": [...],
        "elements": [
          { "id": "el_0", "title": "Window 1", "color": "#3B82F6" },
          { "id": "el_1", "title": "Window 2", "color": "#10B981" }
        ]
      }
    },
    "pointsDeducted": 10,
    "balanceAfter": 990
  }
}
```

- `calculationResult.materialList` / `cuttingList` / `glassCuttingList`: same shapes as in sections 2–4.
- `calculationResult.result`: in-memory calculation result; `result.elements` and the stored `cuttingList.elements` / `glassCuttingList.elements` are the same glazing elements format.

---

## 6. GET project (with optional last calculation result)

**Endpoint:** `GET /api/v1/projects/:projectId`

The response always includes `project`. When the project has been calculated at least once, the response also includes **`lastCalculationResult`** — a single object in **CalculationResult** shape (materialList, cuttingList, glassList, rubberTotals, accessoryTotals, elements). The frontend can use this when the user chooses “View results” without a separate request.

- **When calculated:** `response.lastCalculationResult` is `{ materialList, cuttingList, glassList, rubberTotals, accessoryTotals, elements }` (same shape as §1–4).
- **When not calculated (draft):** `response.lastCalculationResult` is `null`.

**Example response (project already calculated):**

```json
{
  "responseMessage": "Project retrieved successfully",
  "response": {
    "project": { "id": 1, "projectName": "...", "glazingDimensions": [...], "materialLists": [...], "cuttingLists": [...], "glassCuttingLists": [...] },
    "lastCalculationResult": {
      "materialList": [...],
      "cuttingList": [...],
      "glassList": { "sheet_type": "3310x2140mm", "total_sheets": 2, "cuts": [...] },
      "rubberTotals": [...],
      "accessoryTotals": [...],
      "elements": [{ "id": "el_0", "title": "Window 1", "color": "#3B82F6" }, ...]
    }
  }
}
```

---

## Summary table

| API                | Request                                                                                                                        | Response: main data                                                       | Response: glazing elements         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------- |
| Material list      | GET by `projectId` or `materialListId` (no body)                                                                               | `materialList` (array)                                                    | —                                  |
| Cutting list       | GET by `projectId` or `cuttingListId` (no body)                                                                                | `cuttingList` (array), plan with `elementId` per piece                    | `elements` (array)                 |
| Glass cutting list | GET by `projectId` or `glassCuttingListId` (no body)                                                                           | `glassList`, `rubberTotals`, `accessoryTotals`; cuts may have `elementId` | `elements` (array)                 |
| **GET project**    | GET `/projects/:projectId` (no body)                                                                                          | `project`; `lastCalculationResult` (CalculationResult shape or `null`)    | `lastCalculationResult.elements`   |
| Project calculate  | POST `/projects/:projectId/calculate` (no body). Project must have `glazingDimensions` (+ optional `calculationSettings`) set. | All of the above in `calculationResult` + `result`                        | `result.elements` and on each list |

All glazing elements use the same format: `{ id, title, color }`. Use `id` (e.g. `"el_0"`) to match `elementId` on cutting plan pieces and glass cuts.
