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

## Related docs

- [FRONTEND-CALCULATION-RESULT-INTEGRATION.md](./FRONTEND-CALCULATION-RESULT-INTEGRATION.md) — calculation result shapes
- [ADMIN-CONSOLE-PRD.md](./ADMIN-CONSOLE-PRD.md) — admin catalog UX (§6.7)
