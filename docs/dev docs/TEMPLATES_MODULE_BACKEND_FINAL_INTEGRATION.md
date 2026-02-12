# Templates Module: Backend Final Integration & Alignment

**Document version:** 1.0  
**Last updated:** February 2025  
**Purpose:** Single instruction for backend to align and complete the **Export Settings**, **Saved Templates**, and **Pre-Built Templates** features after frontend structural changes.  
**Status:** Export settings backend **not yet implemented**. Pre-built template config APIs may have been partially or fully implemented under the previous “Pre-Built Templates” naming.

---

## 1. Executive Summary

The frontend has been restructured. The following table is the **source of truth** for what each term means and which backend APIs serve it.

| Frontend concept | User-facing location | What it is | Backend API (or note) |
|------------------|----------------------|------------|------------------------|
| **Export settings** | Settings → Export settings | Full configuration UI: Quote Format, Payment Methods, PDF Export, Material Prices. One config per user. | **GET/PUT `/api/v1/templates`** + payment-methods and material-prices sub-routes. **Not yet implemented** (see Section 3). |
| **Saved templates** | Templates (sidebar) → **Saved Templates** tab | User-created presets (snapshots of quote format and/or PDF export). List, create, delete, apply. | **New API required:** **GET/POST/DELETE `/api/v1/saved-templates`** (see Section 4). |
| **Pre-built templates** | Templates (sidebar) → **Pre-built Templates** tab | App-provided preset templates (same shape as saved templates; read-only list, apply only). | **Optional:** **GET `/api/v1/prebuilt-templates`**. If not implemented, frontend uses a built-in list (see Section 5). |

**Naming alignment:**  
- Previous backend work described as “Pre-Built Templates” (template config, payment methods, material prices) is the **Export Settings** API. That API should remain as specified in `PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md` and `PREBUILT_TEMPLATES_BACKEND_INTEGRATION.md`; only the *purpose* is renamed to “Export settings” (current user config).  
- “Pre-built templates” in the UI now means **app default presets** (list of apply-only templates), not the configuration screen.

---

## 2. Current Frontend Structure (Post–Structural Changes)

### 2.1 Navigation and screens

- **Sidebar → Templates**  
  Opens the **Templates** page with two tabs:
  - **Pre-built Templates:** List of app default presets. User can only **Apply** (no create/delete).
  - **Saved Templates:** List of user-created presets. User can **Save current as template**, **Apply**, and **Delete**.
- **Templates page header**  
  Contains an **Export settings** button that navigates to **Settings → Export settings**.
- **Settings → Export settings**  
  Full configuration: Quote Format, Payment Method, PDF Export, Material Prices (tabs). Load/save use **GET/PUT `/api/v1/templates`** and related endpoints.

### 2.2 Data flow (high level)

- **Current template config** (what you edit in Export settings):  
  - Load: **GET `/api/v1/templates`**.  
  - Save: **PUT `/api/v1/templates`** with full config.  
  - Payment methods and material prices use their own sub-routes under `/api/v1/templates`.
- **Saved templates (user presets):**  
  - Today: Stored only in frontend (Zustand + localStorage).  
  - Target: **GET** (list), **POST** (create), **DELETE** (delete). Apply is done on the frontend (overwrite store; optionally then **PUT /api/v1/templates** to persist).
- **Pre-built templates (app presets):**  
  - Today: Hard-coded list in frontend (e.g. “Standard”, “Minimal”).  
  - Optional: **GET `/api/v1/prebuilt-templates`** to supply list from backend; same shape as saved template presets, with `source: 'system'`.

---

## 3. Export Settings API (Template Config) — To Be Implemented

**Note:** The Export settings backend has **not** been implemented. The contract below is the one to implement.

Export settings is the **current user template configuration**: quote format, PDF export, payment methods, material prices. It is **not** the list of “pre-built” or “saved” presets.

### 3.1 Reference documents

- **PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md** – Full request/response shapes, validation, DB schema for:
  - **GET/PUT `/api/v1/templates`** (main template config)
  - **GET/POST/PATCH/DELETE** `/api/v1/templates/payment-methods` and `/api/v1/templates/payment-methods/:id`
  - **GET/POST/PATCH/DELETE** `/api/v1/templates/material-prices` and `/api/v1/templates/material-prices/:id`
- **PREBUILT_TEMPLATES_BACKEND_INTEGRATION.md** – Integration guide and default values.

Treat these as the **Export settings** API. No change to URLs or payloads; only the *feature name* is “Export settings” (and “current template config”), not “Pre-Built Templates configuration”.

### 3.2 Contract summary (Export settings)

- **Base URL:** `/api/v1/templates`
- **Auth:** All requests require authenticated user (e.g. Bearer token). Config is per user.
- **GET `/api/v1/templates`**  
  Returns the current user’s full template config: `quoteFormat`, `paymentMethods`, `paymentMethodConfig`, `pdfExport`, `materialPrices`, `materialPricesConfig`. If none exists, return the same structure with defaults (see PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md / BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md).
- **PUT `/api/v1/templates`**  
  Body: full `TemplateConfig` (same shape as GET response). Create or update the user’s config. Frontend sends entire config on each save.
- **Payment methods and material prices:**  
  As in PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md (sub-routes under `/api/v1/templates`).

### 3.3 Checklist (Export settings)

- [ ] **GET `/api/v1/templates`** returns full template config for the current user (or defaults).
- [ ] **PUT `/api/v1/templates`** accepts full `TemplateConfig` and saves per user.
- [ ] Payment-method and material-price sub-routes work and stay consistent with the main config.
- [ ] All routes require authentication and are scoped to the current user.

---

## 4. Saved Templates API (User Presets) — New API Required

Saved templates are **user-created presets**: snapshots of `quoteFormat` and/or `pdfExport`. They are listed on the **Templates → Saved Templates** tab. Users can create (Save current as template), delete, and apply them. Apply is client-side (overwrite store; frontend may then call **PUT `/api/v1/templates`** to persist).

### 4.1 Resource model

Same shape as in **BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md** Section 3, with one addition:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (e.g. UUID) | Yes (server-generated) | Unique id. |
| `userId` | — | Implicit (from auth) | Owner. |
| `name` | string | Yes | User-facing name (e.g. “Standard Quote”). |
| `type` | enum | Yes | `"quoteFormat"` \| `"pdfExport"` \| `"full"`. |
| `quoteFormat` | object (QuoteFormatConfig) | If type is `quoteFormat` or `full` | Snapshot of quote format. |
| `pdfExport` | object (PDFExportConfig) | If type is `pdfExport` or `full` | Snapshot of PDF export config. |
| `createdAt` | string (ISO 8601) | Yes | Creation time. |
| `source` | enum | Optional | If present, must be `"user"` for saved-templates API. (Frontend uses `source: 'user'` for user-created; backend may omit or set to `"user"`.) |

- **type**
  - `quoteFormat`: preset has only `quoteFormat` (no `pdfExport`).
  - `pdfExport`: preset has only `pdfExport` (no `quoteFormat`).
  - `full`: preset has both `quoteFormat` and `pdfExport`.

Do **not** include payment methods or material prices in saved templates; only quote format and PDF export.

### 4.2 Endpoints

Base path: **`/api/v1/saved-templates`** (or `/api/v1/templates/presets`). All require auth; all operate on the current user’s presets.

#### 4.2.1 List saved templates

- **GET `/api/v1/saved-templates`**
- **Response (200):**  
  `{ "responseMessage": "Success", "response": { "savedTemplates": [ ... ] } }`  
  Each item: `id`, `name`, `type`, `quoteFormat` (if applicable), `pdfExport` (if applicable), `createdAt`, and optionally `source: "user"`.  
  Return only presets owned by the current user. Order e.g. by `createdAt` descending. If none: `"savedTemplates": []`.

#### 4.2.2 Create saved template

- **POST `/api/v1/saved-templates`**
- **Body:** `{ "name": "...", "type": "quoteFormat"|"pdfExport"|"full", "quoteFormat": { ... }, "pdfExport": { ... } }`  
  Include `quoteFormat` when type is `quoteFormat` or `full`; include `pdfExport` when type is `pdfExport` or `full`.
- **Validation:** `name` required, non-empty, reasonable max length (e.g. 100). `type` required, one of the three. Enforce presence of `quoteFormat`/`pdfExport` by type. Optional: per-user limit (e.g. 20).
- **Response (201):** Return the created resource with server-generated `id` and `createdAt` (and optionally `source: "user"`).

#### 4.2.3 Delete saved template

- **DELETE `/api/v1/saved-templates/:id`**
- **Response (200):** Success body (e.g. `{ "responseMessage": "Deleted", "response": { "success": true } }`).
- **404** if `id` does not exist or does not belong to the current user.

#### 4.2.4 (Optional) Update saved template

- **PATCH `/api/v1/saved-templates/:id`**  
  Body (all optional): `{ "name": "..." }` and/or `quoteFormat` / `pdfExport` to replace snapshot.
- Frontend does not use this today; can be added later for rename/update.

### 4.3 Frontend type reference (SavedTemplate)

Backend payloads should align with:

```ts
type SavedTemplateType = 'quoteFormat' | 'pdfExport' | 'full';
type SavedTemplateSource = 'system' | 'user';

interface SavedTemplate {
  id: string;
  name: string;
  type: SavedTemplateType;
  quoteFormat?: QuoteFormatConfig;  // required if type is quoteFormat or full
  pdfExport?: PDFExportConfig;     // required if type is pdfExport or full
  createdAt: string;               // ISO 8601
  source?: SavedTemplateSource;   // for saved-templates API, omit or "user"
}
```

`QuoteFormatConfig` and `PDFExportConfig` are in `src/types/templates.ts` and in PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md.

### 4.4 Database schema (saved templates)

As in BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md Section 3.3 (e.g. `saved_templates` with `user_id`, `name`, `type`, `quote_format` JSONB, `pdf_export` JSONB, `created_at`). No need to store `source` if you only store user presets here.

### 4.5 Checklist (Saved templates)

- [ ] **GET `/api/v1/saved-templates`** returns list of user presets only.
- [ ] **POST `/api/v1/saved-templates`** creates a preset; validates `name`, `type`, and required `quoteFormat`/`pdfExport`.
- [ ] **DELETE `/api/v1/saved-templates/:id`** deletes only if owned by current user; 404 otherwise.
- [ ] (Optional) **PATCH `/api/v1/saved-templates/:id`** for rename/update.
- [ ] All routes require authentication; responses scoped to current user.

---

## 5. Pre-Built Templates (App Presets) — Optional Backend

**Pre-built templates** in the UI are **app-provided presets** (same data shape as saved templates). They are read-only: user can only **Apply**. The frontend currently uses a **built-in list** (e.g. “Standard”, “Minimal”) and does **not** call any backend for this list.

### 5.1 Option A: No backend (current behaviour)

- Frontend keeps using a client-side constant list.
- No backend endpoint required for pre-built templates.

### 5.2 Option B: Backend-supplied list (optional)

If you want pre-built presets to be manageable on the server (e.g. add/change without a frontend release):

- **GET `/api/v1/prebuilt-templates`**
- **Auth:** Required (same as rest of app).
- **Response (200):**  
  `{ "responseMessage": "Success", "response": { "prebuiltTemplates": [ ... ] } }`  
  Each item has the same shape as a saved template: `id`, `name`, `type`, `quoteFormat` (if applicable), `pdfExport` (if applicable), `createdAt`. Include **`source: "system"`** so the frontend can distinguish from user presets.
- **Semantics:** List is **global** (same for all users) or per-tenant; not per-user. Read-only for the app; no POST/PATCH/DELETE from the frontend.
- **If you add this:** Frontend can be updated to call **GET `/api/v1/prebuilt-templates`** and use `response.prebuiltTemplates` instead of the built-in list when the endpoint is available.

### 5.3 Checklist (Pre-built templates)

- [ ] **Either:** No backend (frontend uses built-in list).
- [ ] **Or:** **GET `/api/v1/prebuilt-templates`** returns a list of app presets (same shape as SavedTemplate, with `source: "system"`).

---

## 6. Correction and Alignment With Previous “Pre-Built” Work

### 6.1 What “Pre-Built” meant before vs now

- **Previously (backend docs):** “Pre-Built Templates” referred to the **configuration feature**: GET/PUT template config, payment methods, material prices. That is exactly what the frontend now calls **Export settings**.
- **Now (frontend):** “Pre-built templates” in the UI means the **list of app default presets** on the **Templates → Pre-built Templates** tab (apply-only). The **configuration UI** is **Export settings** under Settings.

### 6.2 What to keep from previous backend work

- Any **GET/PUT `/api/v1/templates`** and **payment-methods** / **material-prices** sub-routes already implemented are the **Export settings** API. **Keep them.** Ensure they match the contract in PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md and that Export settings (Settings screen) is the only consumer of this config.
- Do **not** remove or rename these endpoints; only align naming in your docs to “Export settings” / “current template config”.

### 6.3 What to add or clarify

- **Export settings:** If not yet implemented, implement as in Section 3 and PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md.
- **Saved templates:** Implement **GET/POST/DELETE `/api/v1/saved-templates`** (and optional PATCH) as in Section 4 and BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md Section 3. This is **new** and not the same as the template config API.
- **Pre-built templates:** Either leave frontend with built-in list (no backend) or add optional **GET `/api/v1/prebuilt-templates`** (Section 5).

---

## 7. Response and Error Format

Use the same style as the rest of the app so the frontend can reuse existing handling:

- **Success:** e.g. `{ "responseMessage": "...", "response": { ... } }`.
- **Error:** e.g. `{ "responseMessage": "...", "message": "...", "errors": [ { "field": "...", "message": "..." } ] }`.
- **Status codes:** 200/201 for success, 400 for validation, 401 for auth, 403/404 as appropriate.

---

## 8. Frontend Integration Notes

### 8.1 Export settings

- **Settings → Export settings** calls **GET `/api/v1/templates`** on load and **PUT `/api/v1/templates`** on save. Payment methods and material prices use the sub-routes. See `src/stores/templateStore.ts` (`loadTemplates`, `saveTemplates`) and `src/components/features/settings/ExportSettingsSection.tsx`.

### 8.2 Saved templates

- **Today:** All data is in the template store (Zustand) and persisted to **localStorage** only. No saved-templates API calls yet.
- **After backend:** Frontend will:
  - On load (Templates → Saved Templates): **GET `/api/v1/saved-templates`** and set store’s `savedTemplates` from `response.savedTemplates` (only user presets; frontend filters `source !== 'system'` for display).
  - Save current as template: **POST `/api/v1/saved-templates`** with `name`, `type`, and current `quoteFormat`/`pdfExport`; on success add returned preset to store.
  - Delete: **DELETE `/api/v1/saved-templates/:id`**; on success remove from store.
  - Apply: unchanged (local store update; optionally **PUT `/api/v1/templates`** to persist as current config).

### 8.3 Pre-built templates

- **Today:** List is a constant in `src/stores/templateStore.ts` (`PREBUILT_TEMPLATES`). Apply runs locally (`applyPrebuiltTemplate`).
- **If backend adds GET prebuilt-templates:** Frontend can be updated to fetch that list when available and use it instead of the constant.

---

## 9. Master Checklist for Backend

- [ ] **Export settings (template config)**
  - [ ] **GET `/api/v1/templates`** returns full template config for the current user (or defaults).
  - [ ] **PUT `/api/v1/templates`** accepts full `TemplateConfig` and saves per user.
  - [ ] Payment-method and material-price sub-routes implemented and consistent with main config.
- [ ] **Saved templates (user presets)**
  - [ ] **GET `/api/v1/saved-templates`** returns list of presets for the current user.
  - [ ] **POST `/api/v1/saved-templates`** creates a preset; validates `name`, `type`, and required `quoteFormat`/`pdfExport`.
  - [ ] **DELETE `/api/v1/saved-templates/:id`** deletes only if owned by current user; 404 otherwise.
  - [ ] (Optional) **PATCH `/api/v1/saved-templates/:id`** for rename/update.
- [ ] **Pre-built templates (app presets)**
  - [ ] **Either:** No backend (frontend uses built-in list).
  - [ ] **Or:** **GET `/api/v1/prebuilt-templates`** returns list of system presets (same shape as SavedTemplate, `source: "system"`).
- [ ] **Auth and format**
  - [ ] All above routes require authentication; data scoped to current user (except prebuilt list if global).
  - [ ] Success/error responses follow existing API style for frontend compatibility.

---

## 10. Related Documents

| Document | Use |
|----------|-----|
| **PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md** | Full Export settings API: GET/PUT templates, payment methods, material prices (schemas, validation, defaults). |
| **PREBUILT_TEMPLATES_BACKEND_INTEGRATION.md** | Export settings integration guide and defaults. |
| **BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md** | Export settings contract summary and **Saved Templates** API spec (Section 3). Not yet implemented. |
| **Frontend types** | `src/types/templates.ts` (QuoteFormatConfig, PDFExportConfig, SavedTemplate, SavedTemplateSource). |
| **Frontend store / API** | `src/stores/templateStore.ts`, `src/services/api/templates.service.ts`. |

---

**Document end.**  
This document is the single reference for aligning and completing the Templates module backend. If you implement with different paths or payloads, document them so the frontend can be adapted.
