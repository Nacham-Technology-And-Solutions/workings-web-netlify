# Backend Instructions: Export Settings & Saved Templates

**Document version:** 1.0  
**Last updated:** February 2025  
**Related frontend:** Export settings (Settings area), Saved Templates screen

---

## 1. Overview of Frontend Changes

The frontend has been restructured as follows:

| Before | After |
|--------|--------|
| **Pre-Built Templates** page = Quote Format, PDF Export, Payment Method, Material Prices configuration | **Settings → Export settings** = same configuration (Quote Format, PDF Export, Payment Method, Material Prices) |
| N/A | **Pre-Built Templates** (main nav) = **Saved Templates** screen: list of user-saved presets with “Apply” and “Save current as template” |

### 1.1 Where Things Live Now

- **Export settings (configuration)**  
  - **Location:** Settings → Export settings tab.  
  - **Purpose:** Configure quote format, PDF export, payment methods, and material prices (current “template” config).  
  - **Backend:** Uses existing **template config** API: `GET /api/v1/templates`, `PUT /api/v1/templates`, plus payment-methods and material-prices sub-resources.  
  - **Flow:** Load config on enter → user edits → Save changes → `PUT /api/v1/templates` with full config.

- **Saved Templates (presets)**  
  - **Location:** Main nav → Pre-built Templates (Saved Templates screen).  
  - **Purpose:** User-defined named presets (e.g. “Standard Quote”, “Minimal PDF”). One click **Apply** overwrites current export settings with that preset; **Save current as template** creates a new preset from current config.  
  - **Backend:** **New API required** – see Section 3. Saved templates are currently stored only in the frontend (localStorage). Backend should provide CRUD so presets are per-user and synced across devices.

### 1.2 Data Flow Summary

- **Current template config** (what you edit in Export settings):  
  - **Load:** `GET /api/v1/templates` → one config per user (quoteFormat, pdfExport, paymentMethods, paymentMethodConfig, materialPrices, materialPricesConfig).  
  - **Save:** `PUT /api/v1/templates` with full `TemplateConfig` body.

- **Saved template presets** (list on Saved Templates screen):  
  - **Current (frontend only):** Stored in localStorage; no API.  
  - **Target (backend):** `GET` list, `POST` create, `DELETE` remove. Optional: `PATCH` to rename. Apply is done on the frontend by copying preset’s `quoteFormat`/`pdfExport` into local state and optionally calling `PUT /api/v1/templates` to persist.

---

## 2. Existing API Contract (Export Settings)

These endpoints are used by **Settings → Export settings**. Ensure they remain supported and compatible with the following.

### 2.1 Base and Auth

- **Base URL:** `/api/v1/templates`  
- **Auth:** All requests require authenticated user (e.g. JWT/Bearer or session). Config is **per user**.

### 2.2 Get Current Template Config

**Request**

- `GET /api/v1/templates`
- Headers: `Authorization: Bearer <token>` (or equivalent), `Content-Type: application/json`

**Response (200)**

- Body must expose the current user’s template config under a `response` (or equivalent) field that the frontend maps to `TemplateConfig`:

```json
{
  "responseMessage": "Success",
  "response": {
    "quoteFormat": { /* QuoteFormatConfig */ },
    "paymentMethods": [ /* PaymentMethod[] */ ],
    "paymentMethodConfig": {
      "methods": [ /* PaymentMethod[] */ ],
      "displayOptions": {
        "showInPreview": true,
        "showInPDF": true,
        "customInstructions": null
      }
    },
    "pdfExport": { /* PDFExportConfig */ },
    "materialPrices": [ /* MaterialPrice[] */ ],
    "materialPricesConfig": {
      "prices": [ /* MaterialPrice[] */ ],
      "defaultMarkup": 0,
      "categoryMarkups": {}
    }
  }
}
```

- If the user has no config yet, return the same structure with sensible defaults (or empty arrays/objects). Frontend uses this for “Load” and “Discard changes”.

### 2.3 Save Template Config (Export Settings Save)

**Request**

- `PUT /api/v1/templates`
- Body: full `TemplateConfig` (same shape as `response` above):

```json
{
  "quoteFormat": { /* QuoteFormatConfig */ },
  "paymentMethods": [ /* PaymentMethod[] */ ],
  "paymentMethodConfig": { /* PaymentMethodConfig */ },
  "pdfExport": { /* PDFExportConfig */ },
  "materialPrices": [ /* MaterialPrice[] */ ],
  "materialPricesConfig": { /* MaterialPricesConfig */ }
}
```

**Response (200)**

- Success: e.g. `{ "responseMessage": "Saved", "response": { "success": true } }` or equivalent so the frontend can treat it as success.

**Notes**

- Frontend sends the **entire** config on each save (no partial PATCH).
- Payment methods and material prices can be embedded in this payload; the frontend also uses dedicated payment-method and material-price endpoints for create/update/delete. Backend should keep template config and payment-methods/material-prices consistent (e.g. same source of truth or sync logic).

### 2.4 Payment Methods and Material Prices

- **Payment methods:**  
  - `GET /api/v1/templates/payment-methods`  
  - `POST /api/v1/templates/payment-methods` (body: one payment method without `id`/timestamps)  
  - `PATCH /api/v1/templates/payment-methods/:id`  
  - `DELETE /api/v1/templates/payment-methods/:id`  

- **Material prices:**  
  - `GET /api/v1/templates/material-prices`  
  - `POST /api/v1/templates/material-prices` (body: one material price without `id`/timestamps)  
  - `PATCH /api/v1/templates/material-prices/:id`  
  - `DELETE /api/v1/templates/material-prices/:id`  

Detailed request/response shapes are in `PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md`. Export settings relies on these plus `GET/PUT /api/v1/templates` as above.

---

## 3. New API: Saved Templates (Presets)

Saved templates are **named presets** of quote format and/or PDF export config. The frontend currently stores them only in localStorage. Backend should provide APIs so presets are stored per user and synced across devices.

### 3.1 Resource Model

Each saved template is a **preset** with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes (server-generated) | Unique id. |
| `userId` | number / string | Yes | Owner (from auth). |
| `name` | string | Yes | User-facing name (e.g. “Standard Quote”). |
| `type` | enum | Yes | `"quoteFormat"` \| `"pdfExport"` \| `"full"`. |
| `quoteFormat` | object (QuoteFormatConfig) | If type is `quoteFormat` or `full` | Snapshot of quote format. |
| `pdfExport` | object (PDFExportConfig) | If type is `pdfExport` or `full` | Snapshot of PDF export config. |
| `createdAt` | string (ISO 8601) | Yes | Creation time. |

- **type**
  - `quoteFormat`: preset only includes `quoteFormat` (no `pdfExport`).
  - `pdfExport`: preset only includes `pdfExport` (no `quoteFormat`).
  - `full`: preset includes both `quoteFormat` and `pdfExport`.

Frontend does **not** send or store payment methods / material prices in saved templates; only quote format and PDF export are preset.

### 3.2 API Endpoints

Base path suggested: **`/api/v1/saved-templates`** (or `/api/v1/templates/presets`). All require auth; all operate on the current user’s presets.

#### 3.2.1 List Saved Templates

**Request**

- `GET /api/v1/saved-templates`

**Response (200)**

```json
{
  "responseMessage": "Success",
  "response": {
    "savedTemplates": [
      {
        "id": "uuid",
        "name": "Standard Quote",
        "type": "full",
        "quoteFormat": { /* QuoteFormatConfig */ },
        "pdfExport": { /* PDFExportConfig */ },
        "createdAt": "2025-02-07T12:00:00.000Z"
      }
    ]
  }
}
```

- Return array in a stable order (e.g. by `createdAt` descending).  
- If there are none: `"savedTemplates": []`.

#### 3.2.2 Create Saved Template

**Request**

- `POST /api/v1/saved-templates`
- Body:

```json
{
  "name": "Standard Quote",
  "type": "full",
  "quoteFormat": { /* QuoteFormatConfig, required if type is quoteFormat or full */ },
  "pdfExport": { /* PDFExportConfig, required if type is pdfExport or full */ }
}
```

**Validation**

- `name`: required, non-empty string; reasonable max length (e.g. 100 chars).  
- `type`: required, one of `"quoteFormat"`, `"pdfExport"`, `"full"`.  
- If `type` is `"quoteFormat"` or `"full"`: require `quoteFormat`.  
- If `type` is `"pdfExport"` or `"full"`: require `pdfExport`.  
- Optional: per-user limit on number of saved templates (e.g. 20).

**Response (201)**

```json
{
  "responseMessage": "Saved template created",
  "response": {
    "savedTemplate": {
      "id": "uuid",
      "name": "Standard Quote",
      "type": "full",
      "quoteFormat": { /* ... */ },
      "pdfExport": { /* ... */ },
      "createdAt": "2025-02-07T12:00:00.000Z"
    }
  }
}
```

- Return the created resource with server-generated `id` and `createdAt`.

#### 3.2.3 Delete Saved Template

**Request**

- `DELETE /api/v1/saved-templates/:id`
- `id`: UUID of the saved template.

**Response (200)**

- Success: e.g. `{ "responseMessage": "Deleted", "response": { "success": true } }` or similar.

**Errors**

- **404** if `id` does not exist or does not belong to the current user.

#### 3.2.4 (Optional) Update Saved Template

If you want to support renaming (or updating snapshot) without breaking the frontend:

**Request**

- `PATCH /api/v1/saved-templates/:id`
- Body (all optional): `{ "name": "New name" }` and/or `quoteFormat` / `pdfExport` to replace snapshot.

**Response (200)**

- Return updated saved template in same shape as in list/create.

Frontend can be extended later to call this; it is not required for the current “Save current as template” and “Apply” flows.

### 3.3 Database Schema Suggestion

Example schema for saved templates (adjust to your DB and naming):

```sql
CREATE TABLE saved_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('quoteFormat', 'pdfExport', 'full')),
  quote_format JSONB,
  pdf_export JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_templates_type_check
    CHECK (
      (type = 'quoteFormat' AND quote_format IS NOT NULL AND pdf_export IS NULL) OR
      (type = 'pdfExport' AND pdf_export IS NOT NULL AND quote_format IS NULL) OR
      (type = 'full' AND quote_format IS NOT NULL AND pdf_export IS NOT NULL)
    )
);

CREATE INDEX idx_saved_templates_user_id ON saved_templates(user_id);
CREATE INDEX idx_saved_templates_user_created ON saved_templates(user_id, created_at DESC);
```

- `quote_format` / `pdf_export`: store JSON that matches frontend’s `QuoteFormatConfig` and `PDFExportConfig`.

### 3.4 TypeScript Types (Frontend Reference)

Backend payloads should align with these frontend types:

```ts
type SavedTemplateType = 'quoteFormat' | 'pdfExport' | 'full';

interface SavedTemplate {
  id: string;
  name: string;
  type: SavedTemplateType;
  quoteFormat?: QuoteFormatConfig;  // required if type is quoteFormat or full
  pdfExport?: PDFExportConfig;      // required if type is pdfExport or full
  createdAt: string;                // ISO 8601
}
```

`QuoteFormatConfig` and `PDFExportConfig` are defined in the frontend in `src/types/templates.ts`; see that file (or PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md) for full structures.

---

## 4. Frontend Integration Notes

### 4.1 Current Behaviour (No Saved-Templates API Yet)

- **Saved Templates screen:** Reads/writes `savedTemplates` from the template store, which is persisted to **localStorage** only (Zustand persist).  
- **Apply:** Frontend copies `quoteFormat` and/or `pdfExport` from the chosen preset into the template store and sets “unsaved changes”; user can then go to Settings → Export settings and save to persist to `PUT /api/v1/templates`.  
- **Save current as template:** Frontend pushes a new preset (with client-generated `id` and `createdAt`) into `savedTemplates` and persists to localStorage.  
- **Delete:** Frontend removes the preset from `savedTemplates` and persists to localStorage.

### 4.2 After Backend Implements Saved-Templates API

The frontend can be updated to:

1. **On load (Saved Templates screen):**  
   - Call `GET /api/v1/saved-templates`.  
   - Replace store’s `savedTemplates` with `response.savedTemplates` (and optionally keep localStorage as cache/offline fallback).

2. **Save current as template:**  
   - Call `POST /api/v1/saved-templates` with `name`, `type`, and the relevant `quoteFormat`/`pdfExport` from current config.  
   - On success, append the returned `savedTemplate` to the store (and optionally persist to localStorage).

3. **Delete:**  
   - Call `DELETE /api/v1/saved-templates/:id`.  
   - On success, remove that id from the store.

4. **Apply:**  
   - No change: still only local (overwrite store and optionally navigate to Export settings). Optionally after apply, frontend can call `PUT /api/v1/templates` so the applied preset is persisted as the current config.

### 4.3 Error Handling and Fallback

- If saved-templates API is unavailable, frontend can continue to use localStorage-only behaviour (as today).  
- Recommended: use the same `ApiResponse`/error shape as the rest of the app (e.g. `responseMessage`, `message`, optional `errors` array) so the frontend can show consistent error messages.

---

## 5. Checklist for Backend

- [ ] **Export settings**
  - [ ] `GET /api/v1/templates` returns full template config for the current user (or defaults).
  - [ ] `PUT /api/v1/templates` accepts full `TemplateConfig` and saves per user.
  - [ ] Payment-methods and material-prices sub-routes work and stay consistent with main config.
- [ ] **Saved templates**
  - [ ] `GET /api/v1/saved-templates` returns list of presets for the current user.
  - [ ] `POST /api/v1/saved-templates` creates a preset; validates `name`, `type`, and required `quoteFormat`/`pdfExport`.
  - [ ] `DELETE /api/v1/saved-templates/:id` deletes only if owned by current user; returns 404 otherwise.
  - [ ] (Optional) `PATCH /api/v1/saved-templates/:id` for rename/update.
- [ ] **Auth**
  - [ ] All above routes require authentication; responses are scoped to the current user.
- [ ] **Response format**
  - [ ] Success/error responses follow the existing API style (`responseMessage`, `response`, etc.) so the frontend can reuse existing handling.

---

## 6. Related Docs

- **PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md** – Full template config, payment methods, material prices (DB schema, request/response details).  
- **WORKINGS-ARCHITECTURE-PLAN.md** – Overall backend structure and domains.  
- Frontend types: `src/types/templates.ts` (QuoteFormatConfig, PDFExportConfig, SavedTemplate, etc.).  
- Frontend API usage: `src/services/api/templates.service.ts`, `src/stores/templateStore.ts`.

---

**Document end.**  
If you implement the saved-templates API with a different path or payload shape, document it and the frontend can be adapted to match.
