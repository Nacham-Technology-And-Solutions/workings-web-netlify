# Frontend Estimation Integration

This document describes how the frontend should integrate with the **Project Estimation Engine** API after a project calculation completes.

## Overview

| Quote type | `quoteSource` | Purpose |
|------------|---------------|---------|
| **Project Cart Quote** | `project_cart` | Sell price per finished window (build-up from per-line raw requirements) |
| **Material List Quote** | `material_list` | Buy price for whole project (consolidated material list × unit prices) |

**Price fill sources** (at populate time only):

| Source | API value | Description |
|--------|-----------|-------------|
| System catalog | `system` | Admin-managed global prices |
| My Material Prices | `user_library` | User's saved `MaterialPrice` rows |
| Last used | `last_used` | Per-user memory from last saved quote |

`LastUsedPrice` is updated **only** when a quote is saved via `POST /api/v1/estimation/quotes` — not on preview or keystrokes.

Every saved quote stores an immutable `estimationSnapshot` on the `Quote` record.

---

## Flow (sequence)

1. User runs **Calculate** → `POST /api/v1/projects/:id/calculate`
2. User picks price fill source → `GET /api/v1/estimation/price-fill?projectId=&source=last_used`
3. User edits prices and quote settings in UI
4. User previews quote → `POST /api/v1/estimation/preview`
5. User confirms → `POST /api/v1/estimation/quotes` (optional `generatePdf: true`)
6. Optional: existing `POST /api/v1/quotes/:id/generate-pdf` and `POST /api/v1/quotes/:id/send`

---

## Endpoints

### `GET /api/v1/estimation/price-fill`

**Auth:** session + access token

**Query:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | number | yes | Project with calculated results |
| `source` | `system` \| `user_library` \| `last_used` | no (default `last_used`) | Price fill source |

**Response:**

```json
{
  "responseMessage": "Price fill retrieved successfully",
  "response": {
    "fillSource": "last_used",
    "itemKeys": [{ "itemKey": "profile.track", "itemName": "Track Profile", "category": "Profile", "unit": "length" }],
    "pricingInputs": [
      {
        "itemKey": "profile.track",
        "itemName": "Track Profile",
        "category": "Profile",
        "unit": "length",
        "unitPrice": 18000,
        "source": "last_used"
      }
    ],
    "projectId": 42
  }
}
```

`source: "empty"` means no price found — show editable zero in UI.

---

### `POST /api/v1/estimation/preview`

**Auth:** required | **Points:** none

Dry-run quote without persisting or updating last-used prices.

**Body:**

```json
{
  "quoteSource": "project_cart",
  "projectId": 42,
  "pricingInputs": [
    { "itemKey": "profile.track", "itemName": "Track Profile", "category": "Profile", "unit": "length", "unitPrice": 18000 }
  ],
  "quoteSettings": {
    "stockLength": 6000,
    "kerf": 5,
    "offcutMarkup": 500,
    "glassSheetWidth": 3310,
    "glassSheetHeight": 2140,
    "netRollHeightMm": 1500,
    "extraCharges": { "labour": 0, "profitPercent": 10 }
  }
}
```

Alternatively pass inline calculation (no `projectId`):

```json
{
  "quoteSource": "material_list",
  "projectCart": [{ "module_id": "M2_Sliding_2Sash", "W": 1500, "H": 1500, "qty": 1 }],
  "calculationSettings": { "stockLength": 6, "bladeKerf": 5 },
  "pricingInputs": [ ... ]
}
```

**`project_cart` response** includes `cartLines` with `calculatedUnitPrice`, `finalUnitPrice`, `costBreakdown`.

**`material_list` response** includes `lines`; net mesh appears as **metres**, not rolls.

---

### `POST /api/v1/estimation/quotes`

**Auth:** required | **Points:** 3 (same as legacy quote create)

Persists quote, `estimationSnapshot`, and updates `LastUsedPrice`.

**Body:** same as preview plus:

```json
{
  "quoteType": "from_project",
  "customerName": "Acme Ltd",
  "customerEmail": "billing@acme.com",
  "tax": 0,
  "status": "draft",
  "generatePdf": true,
  "itemOverrides": [{ "lineIndex": 0, "finalUnitPrice": 250000, "manualOverride": true }]
}
```

**Quote item fields (cart):**

| Field | Description |
|-------|-------------|
| `calculatedUnitPrice` | Engine build-up |
| `finalUnitPrice` | Client-facing unit price (PDF uses this) |
| `manualOverride` | User edited final price |
| `costBreakdown` | Internal lines (optional collapsible in UI) |
| `moduleId`, `width`, `height` | Line attribution |

**`estimationSnapshot` shape:**

```json
{
  "pricingInputs": [],
  "quoteSettings": {},
  "pricesUsed": [],
  "quoteSource": "project_cart",
  "generatedAt": "2026-06-16T12:00:00.000Z"
}
```

---

## Admin: System Material Prices

Base path: `/api/v1/admin/system-material-prices` (admin users only)

| Method | Path | Action |
|--------|------|--------|
| GET | `/` | List (optional `category`, `search`) |
| POST | `/` | Create |
| GET | `/:id` | Get one |
| PATCH | `/:id` | Update |
| DELETE | `/:id` | Delete |

**Create body:**

```json
{
  "itemKey": "profile.track",
  "itemName": "Track Profile",
  "category": "Profile",
  "unit": "length",
  "unitPrice": 18000,
  "metadata": { "stockLengthMm": 6000 }
}
```

---

## UI recommendations

### Price fill toolbar

Dropdown: **System prices** / **My prices** / **Last used** → calls `price-fill`, populates editable pricing table.

### Pricing table

One row per `itemKey`: name, unit, price, source badge (`system`, `user_library`, `last_used`, `empty`).

### Quote settings panel

- Stock length (6000 / 5850 mm or 6 / 5.85 m)
- Kerf (default 5 mm)
- Offcut markup (default ₦500)
- Net roll height: 1220 / 1500 / 1800 / custom
- Extras: labour, installation, transport, miscellaneous, profit %, discount %

### Generate Quote modal

- Radio: **Project Cart** vs **Material List**
- Preview table from `/preview`
- Override `finalUnitPrice` per cart line before save

### Material list tab

When estimation is active, show `unitPrice` / `totalPrice` columns from preview or user edits.

### Net mesh labelling

- **Engine / material list buy view:** rolls (`Net Mesh Roll`)
- **Estimation / material list quote:** running **metres** (`Net Mesh 1500mm — X metres`)

---

## `itemKey` conventions

Stable keys for price matching:

| Pattern | Example |
|---------|---------|
| `profile.*` | `profile.track`, `profile.jamb` |
| `glass.sheet.{W}x{H}` | `glass.sheet.3310x2140` |
| `accessory.*` | `accessory.rollers`, `accessory.lockset` |
| `rubber.*` | `rubber.glazing`, `rubber.wool_pile` |
| `net.mesh.{heightMm}` | `net.mesh.1500` |

User `MaterialPrice` rows can include `itemKey` and `source` (`user` | `system`) for library matching.

---

## Error handling

| Code | When |
|------|------|
| 400 | Validation (e.g. profile cut too long, glass won't fit sheet, net won't fit roll) |
| 402 | Insufficient points on quote save |
| 403 | Admin routes without `isAdmin` |

Validation errors use `EstimationValidationError` messages — show in UI toast/modal.

---

## Client state

Keep a **draft estimation session** in frontend state between calculate and quote save. Do not rely on `LastUsedPrice` until save succeeds.

---

## TypeScript contracts

Copy these types into the frontend (or generate from them). Source of truth: `src/domains/estimation/types.ts` and `src/domains/estimation/schema/estimation.schema.ts`.

### Shared types

```ts
type PriceFillSource = 'system' | 'user_library' | 'last_used';

type PricingInput = {
  itemKey: string;
  itemName: string;
  category: string;
  unit: string;
  unitPrice: number;
  source?: PriceFillSource | 'manual' | 'empty';
};

type ExtraCharges = {
  labour?: number;
  installation?: number;
  transport?: number;
  miscellaneous?: number;
  profitFixed?: number;
  profitPercent?: number;
  discountFixed?: number;
  discountPercent?: number;
};

type QuoteSettings = {
  stockLength: number;       // mm if > 20, metres if ≤ 20 — see § Backend clarifications
  kerf: number;
  offcutMarkup: number;
  rounding: 'nearest_100';
  glassSheetWidth: number;
  glassSheetHeight: number;
  netRollHeightMm: number;
  extraCharges?: ExtraCharges;
};

type CostBreakdownLine = {
  itemKey: string;
  itemName: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  formula?: string;
};

type EstimationSnapshot = {
  pricingInputs: PricingInput[];
  quoteSettings: QuoteSettings;
  pricesUsed: PricingInput[];
  quoteSource: 'project_cart' | 'material_list';
  generatedAt: string; // ISO 8601
};
```

### Price fill — `GET /estimation/price-fill`

```ts
type PriceFillResponse = {
  responseMessage: string;
  response: {
    fillSource: PriceFillSource;
    itemKeys: Array<{
      itemKey: string;
      itemName: string;
      category: string;
      unit: string;
    }>;
    pricingInputs: PricingInput[];
    projectId: number;
  };
};
```

### Preview — `POST /estimation/preview`

**Request** (both quote types):

```ts
type EstimationPreviewRequest = {
  quoteSource: 'project_cart' | 'material_list';
  projectId?: number;
  projectCart?: Array<{ module_id: string; W?: number; H?: number; qty?: number; [key: string]: unknown }>;
  calculationResult?: object; // CalculationResult — see calculation integration doc
  calculationSettings?: { stockLength?: number; bladeKerf?: number; wasteThreshold?: number };
  pricingInputs: PricingInput[];
  quoteSettings?: Partial<QuoteSettings>;
  elementDisplayOverrides?: Array<{ title?: string; color?: string }>;
};
```

**Response — `quoteSource: "project_cart"`**

```ts
type CartQuoteLine = {
  description: string;
  quantity: number;
  moduleId: string;
  width?: number;
  height?: number;
  calculatedUnitPrice: number;
  finalUnitPrice: number;
  manualOverride: boolean;
  unitPrice: number;       // mirrors finalUnitPrice
  totalPrice: number;      // finalUnitPrice × quantity
  costBreakdown: CostBreakdownLine[];
};

type EstimationCartQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;       // = finalUnitPrice (PDF uses this)
  totalPrice: number;
  calculatedUnitPrice: number;
  finalUnitPrice: number;
  manualOverride: boolean;
  costBreakdown: CostBreakdownLine[];
  moduleId: string;
  width?: number;
  height?: number;
};

type EstimationPreviewProjectCartResponse = {
  responseMessage: string;
  response: {
    quoteSource: 'project_cart';
    items: EstimationCartQuoteItem[];
    cartLines: CartQuoteLine[];
    subtotal: number;
    grandTotal: number;
    pricesUsed: PricingInput[];
    quoteSettings: QuoteSettings;
  };
};
```

**Response — `quoteSource: "material_list"`**

```ts
type MaterialListQuoteLine = {
  itemKey: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

type EstimationMaterialQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemKey: string;
};

type EstimationPreviewMaterialListResponse = {
  responseMessage: string;
  response: {
    quoteSource: 'material_list';
    lines: MaterialListQuoteLine[];
    items: EstimationMaterialQuoteItem[];
    subtotal: number;
    grandTotal: number;
    pricesUsed: PricingInput[];
    quoteSettings: QuoteSettings;
  };
};
```

**Totals on preview**

| Field | Meaning |
|-------|---------|
| `subtotal` | Sum of line `totalPrice` values |
| `grandTotal` | `subtotal` + project extras (labour, profit %, discount, etc.) |

Preview does **not** return `tax` or `total`. Apply tax only on save.

### Save — `POST /estimation/quotes`

**Request** — same as preview, plus:

```ts
type CartQuoteItemOverride = {
  lineIndex: number;        // 0-based index into cartLines — see § Backend clarifications
  finalUnitPrice: number;
  manualOverride?: boolean; // default true
};

type EstimationQuoteRequest = EstimationPreviewRequest & {
  quoteType?: 'from_project' | 'standalone';
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  tax?: number;             // default 0
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  paymentInfo?: { accountName?: string; accountNumber?: string; bankName?: string } | null;
  itemOverrides?: CartQuoteItemOverride[]; // project_cart only
  generatePdf?: boolean;
};
```

**Response**

```ts
type EstimationSaveResponse = {
  responseMessage: string;
  response: {
    quote: {
      id: number;
      quoteNumber: string;
      quoteType: 'from_project' | 'standalone';
      quoteSource: 'project_cart' | 'material_list';
      projectId: number | null;
      customerName: string;
      customerAddress: string | null;
      customerEmail: string | null;
      items: EstimationCartQuoteItem[] | EstimationMaterialQuoteItem[];
      subtotal: number;
      tax: number;
      total: number;        // grandTotal + tax
      status: string;
      estimationSnapshot: EstimationSnapshot;
      pdfUrl?: string | null;
      paymentInfo?: object | null;
      createdAt: string;
      updatedAt: string;
    };
    pointsDeducted: number;
    balanceAfter: number;
    pdfUrl?: string | null;
  };
};
```

### Read saved quote — `GET /api/v1/quotes/:id`

Returns the full `Quote` row. For estimation quotes:

- `quoteSource` — `'project_cart'` \| `'material_list'`
- `estimationSnapshot` — frozen pricing/settings at save time
- `items` — enriched shape as stored (cart quotes include `costBreakdown`, `calculatedUnitPrice`, etc.)

`cartLines` is **preview-only** and is not returned on GET. Rebuild UI from `items` + `estimationSnapshot`.

Legacy quotes (`quoteSource: null`, no `estimationSnapshot`) have flat `items` only.

---

## Backend clarifications

Answers to common frontend integration questions.

### Price sources: `templates/material-prices` vs `user_library`

| Concept | Storage | API |
|---------|---------|-----|
| User library | `MaterialPrice` (per user) | `GET/POST/PATCH/DELETE /api/v1/templates/material-prices` |
| `user_library` fill | Same `MaterialPrice` rows, matched by `itemKey` | `GET /api/v1/estimation/price-fill?source=user_library` |
| System prices | `SystemMaterialPrice` (global) | `GET /api/v1/admin/system-material-prices` |
| Last used | `LastUsedPrice` (per user) | `GET /api/v1/estimation/price-fill?source=last_used` |

No migration required. Matching requires `itemKey` on `MaterialPrice` rows; older rows without `itemKey` will not auto-fill.

**Fallback order** when the chosen source has no price for a key:

- `system` → `user_library` → `last_used`
- `user_library` → `last_used` → `system`
- `last_used` → `user_library` → `system`

### `stockLength` units (`6000` vs `6`)

Both are valid. Values **≤ 20** are treated as **metres** (× 1000); values **> 20** are **millimetres**.

```ts
normalizeStockLength(6)     // → 6000 mm
normalizeStockLength(6000)  // → 6000 mm
normalizeStockLength(5.85)  // → 5850 mm
```

Two separate request fields:

| Field | Purpose |
|-------|---------|
| `calculationSettings.stockLength` | Calculation engine (cutting / stored project settings) |
| `quoteSettings.stockLength` | Profile offcut **pricing** in estimation |

When only `projectId` is sent, the backend loads stored calculation results but **`quoteSettings` defaults to `stockLength: 6000`** unless the client sends `quoteSettings` in the body. It does **not** auto-copy `project.calculationSettings.stockLength`.

**Recommendation:** always send `quoteSettings.stockLength` aligned with the project stock length.

### Legacy `POST /api/v1/quotes`

Still active for `standalone` and `from_project` manual quotes (flat `items[]`, no estimation).

| Endpoint | Use for |
|----------|---------|
| `POST /api/v1/quotes` | Ad-hoc / manual quotes |
| `POST /api/v1/estimation/quotes` | Quotes from calculation + pricing engine |

### `itemOverrides.lineIndex`

Applies to **`project_cart` saves only**. Index is **0-based** into the cart quote lines — one line per **cart row** (`glazingDimensions` entry), not per physical window unit.

```json
{ "lineIndex": 0, "finalUnitPrice": 250000, "manualOverride": true }
```

Ignored for `material_list` quotes. After overrides, `subtotal` is recalculated from line totals; `grandTotal` then applies project-level extras.

---

## Related docs

- [FRONTEND-CALCULATION-RESULT-INTEGRATION.md](./FRONTEND-CALCULATION-RESULT-INTEGRATION.md) — calculation result shapes
- [ADMIN-CONSOLE-PRD.md](./ADMIN-CONSOLE-PRD.md) — admin catalog UX (§6.7)
