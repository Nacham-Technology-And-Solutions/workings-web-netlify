# Frontend API Optimization — Backend Feedback

Backend changes shipped to support the [API optimization audit](.cursor/plans/api_optimization_audit_786fead5.plan.md). This document tells the frontend what changed, what to adopt, and what remains a client-side fix.

**Base URL:** `/api/v1`  
**Auth:** All endpoints below require session + access token (same as today).

---

## Summary

| Priority | Backend change | Frontend action | Replaces |
|----------|----------------|-----------------|----------|
| **P0** | — | Stop debounced auto-preview in `ProjectEstimationPricingScreen` | 10+ `POST /estimation/preview` per edit session |
| **P0** | `GET /material-lists` (new) | Replace N+1 list loading in `MaterialListScreen` | `GET /projects` + N × `GET /material-lists/project/:id` |
| **P1** | Catalog `catalogVersion` + `ETag` | Session-cache material catalog | Repeated `GET /estimation/material-catalog` |
| **P1** | Enriched `GET /templates/material-prices` | Drop catalog pairing in `loadMaterialPrices` | Catalog + prices on every price load |
| **P1** | — | Remove extra `getMaterialPrices()` after `user_library` price-fill | Redundant second HTTP call (backend already resolves library) |
| **P2** | `POST /calculate?includePriceFill=true` | Skip separate price-fill after calculate | 1 `GET /estimation/price-fill` RTT |
| **P2** | `GET /projects` + `materialListId` | Use list summary fields on project cards | Extra `getById` / per-project list fetches |
| **P2** | `POST /quotes` + `clientReference` | Send stable draft id on create | `PATCH` → 404 → `POST` fallback |
| **P2** | — | Call `POST /subscriptions/verify-payment` once on payment callback | 10× polling `GET /subscriptions/current` |
| **P3** | — | Cache `getById` in App project flow handlers | 4× identical `GET /projects/:id` |

---

## P0 — Do first (highest impact)

### 1. Stop the preview POST storm (frontend-only)

**No backend change.** This is still the single worst API pattern in the estimation flow.

**Current behaviour:** `ProjectEstimationPricingScreen` debounces `POST /estimation/preview` every 500ms on every price edit. `EstimationQuotePreviewModal` fires again on open.

**Recommended fix:**
- Remove the auto-preview `useEffect` on `pricingSnapshot` changes.
- Show materials subtotal from local `pricingInputs` math while editing.
- Call preview only on explicit user action (e.g. “Update quote preview”) or once when opening the modal — and skip if `previewResult` is still valid for the current inputs hash.

---

### 2. `GET /api/v1/material-lists` — replace N+1 list loading

**Problem today:** `MaterialListScreen` loads `GET /projects?page=1&limit=100`, filters to calculated projects, then calls `GET /material-lists/project/:projectId` per project (**1 + N requests**).

**New endpoint:**

```
GET /api/v1/material-lists?page=1&limit=20&status=calculated&search=lagos
```

| Query param | Type | Default | Notes |
|-------------|------|---------|-------|
| `page` | int | `1` | |
| `limit` | int | `20` | Max `100` |
| `status` | `draft` \| `calculated` \| `archived` | — | Filters via joined project status |
| `search` | string | — | Matches `projectName`, `siteAddress` (case-insensitive) |

**Response:**

```json
{
  "responseMessage": "Material lists retrieved successfully",
  "response": {
    "materialLists": [
      {
        "id": 42,
        "projectId": 7,
        "projectName": "Lagos Villa",
        "siteAddress": "12 Admiralty Way",
        "projectStatus": "calculated",
        "calculated": true,
        "lastCalculatedAt": "2026-06-01T10:00:00.000Z",
        "itemCount": 18,
        "itemsTotal": 1250000,
        "pointsCost": 10,
        "createdAt": "2026-06-01T10:00:00.000Z",
        "updatedAt": "2026-06-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Field notes:**
- `itemsTotal` — sum of line `totalPrice`, or `units × unitPrice` when `totalPrice` is absent.
- `itemCount` — number of lines in the stored material list (summary only; full JSON is not returned).
- `projectStatus` — from `Project.status` (not a material-list status).

**Frontend changes:**
1. Add `materialListsService.list(page, limit, { status, search })`.
2. Replace the projects + N+1 fan-out in `MaterialListScreen`.
3. Keep `GET /material-lists/:id` for detail view (list cards already have `id`).
4. Optional: use client-side filter on `search` only if you prefer; server `search` is supported.

**Unchanged endpoints:**
- `GET /material-lists/project/:projectId` — single-project lookup
- `GET /material-lists/:materialListId` — full detail with `materialList` JSON

---

## P1 — Settings & estimation bootstrap

### 3. Material catalog caching (`GET /estimation/material-catalog`)

**Response now includes:**

```json
{
  "response": {
    "catalogVersion": "2026.06.1",
    "items": [ /* ItemKeyEntry[] */ ],
    "total": 59,
    "totalUnfiltered": 59
  }
}
```

**HTTP caching:**
- Response header: `ETag: "2026.06.1"`
- Send `If-None-Match: "2026.06.1"` (or the stored ETag) on subsequent requests.
- Server returns **`304 Not Modified`** with empty body when unchanged.

**Recommended `templateStore` pattern:**

```ts
type CatalogCache = {
  version: string;
  etag: string;
  items: MaterialCatalogItem[];
  loadedAt: number;
};

async function loadCatalog(): Promise<MaterialCatalogItem[]> {
  const cached = get().catalogCache;
  const headers = cached?.etag ? { 'If-None-Match': cached.etag } : {};

  const res = await api.get('/estimation/material-catalog', { headers, validateStatus: (s) => s === 200 || s === 304 });

  if (res.status === 304 && cached) return cached.items;

  const { catalogVersion, items } = res.data.response;
  set({ catalogCache: { version: catalogVersion, etag: res.headers.etag, items, loadedAt: Date.now() } });
  return items;
}
```

**Remove:**
- Component-level `loadCatalog()` in `MaterialPricesSection` when store already holds catalog.
- Catalog fetch inside debounced `loadMaterialPrices` — prices filter should not re-fetch catalog.

---

### 4. Enriched material prices (`GET /templates/material-prices`)

Backend now resolves `name`, `category`, and `unit` from the itemKey registry when possible, and can auto-assign `itemKey` for legacy rows.

**New query params (optional):**

| Param | Default | Description |
|-------|---------|-------------|
| `enrich` | `true` | Resolve display fields from catalog |
| `autoMigrate` | `true` | Persist matched `itemKey` + fields for legacy rows missing `itemKey` |

To read-only enrich without DB writes: `?autoMigrate=false`

**Frontend changes:**
1. In `templateStore.loadMaterialPrices`, call **only** `GET /templates/material-prices` — stop pairing with `GET /estimation/material-catalog` for table display.
2. Remove the `Promise.allSettled` loop of `PATCH /material-prices/:id` for missing `itemKey` — backend auto-migrates on GET (or do it once with `autoMigrate=true`, then cache).

---

### 5. Remove redundant `user_library` material-prices fetch (frontend-only)

**No backend change needed.** `GET /estimation/price-fill?source=user_library` already resolves user library prices server-side via `resolvePrices`.

**Current bug:** `estimationStore` calls `getPriceFill`, then **`GET /templates/material-prices`** and merges client-side.

**Fix:** Delete the second fetch in `estimationStore.ts` when `fillSource === 'user_library'`. Use `pricingInputs` from price-fill directly.

---

## P2 — Flow improvements

### 6. Bundled price-fill on calculate

```
POST /api/v1/projects/:projectId/calculate?includePriceFill=true&priceFillSource=last_used
```

| Query param | Default | Values |
|-------------|---------|--------|
| `includePriceFill` | `false` | `true` \| `false` |
| `priceFillSource` | `last_used` | `system` \| `user_library` \| `last_used` |

**When `includePriceFill=true`**, calculate response includes:

```json
{
  "response": {
    "project": { /* ... */ },
    "calculationResult": { /* ... */ },
    "pointsDeducted": 10,
    "balanceAfter": 90,
    "estimationBootstrap": {
      "fillSource": "last_used",
      "itemKeys": [ /* ItemKeyEntry[] */ ],
      "pricingInputs": [ /* same shape as GET /price-fill */ ],
      "projectId": 7
    }
  }
}
```

**Frontend changes:**
- After calculate, if you used `includePriceFill=true`, seed `estimationStore` from `estimationBootstrap` and **skip** `GET /estimation/price-fill` on `ProjectEstimationPricingScreen` mount.
- Default `priceFillSource` should match your UI default (likely `last_used`).

---

### 7. Project list summary fields

`GET /api/v1/projects` list rows now include:

```json
{
  "id": 7,
  "projectName": "...",
  "status": "calculated",
  "calculated": true,
  "lastCalculatedAt": "2026-06-01T10:00:00.000Z",
  "materialListId": 42,
  "hasMaterialList": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `materialListId` | `number \| null` | Latest material list id for the project |
| `hasMaterialList` | `boolean` | `true` when a list exists |

**Use for:** project cards, navigation to material list, filtering calculated projects — without `getById` or per-project material-list calls.

**TypeScript:** extend `ProjectListItem` (or equivalent) in `projects.service.ts`.

---

### 8. Idempotent quote create (`clientReference`)

```
POST /api/v1/quotes
```

**New optional body field:**

```json
{
  "clientReference": "550e8400-e29b-41d4-a716-446655440000",
  "quoteType": "from_project",
  "customerName": "...",
  "items": [ /* ... */ ]
}
```

| Scenario | Status | Behaviour |
|----------|--------|-----------|
| First create with `clientReference` | `201` | New quote created |
| Duplicate `clientReference` for same user | `200` | Returns existing quote; `response.idempotent: true` |
| No `clientReference` | `201` | Unchanged behaviour |

**Frontend changes:**
1. Generate a stable UUID when starting a quote draft (store in component state or quote flow context).
2. Send `clientReference` on every `POST /quotes` for that draft.
3. Remove or narrow the `PATCH` → 404 → `POST` fallback in `handleQuoteExtrasNotesSaveDraft` / `handleQuoteExtrasNotesPreview` when `clientReference` is present.
4. Clear `clientReference` when starting a genuinely new quote.

**Migration:** run `npx prisma migrate deploy` on the API before relying on this in production.

---

### 9. Payment callback — use verify-payment (frontend-only)

**No new endpoint.** Use existing:

```
POST /api/v1/subscriptions/verify-payment
```

```json
{
  "reference": "paystack_ref_xxx",
  "provider": "paystack"
}
```

**Replace** `PaymentCallbackScreen` polling `GET /subscriptions/current` up to 10× every 2s with a **single** verify call (retry with backoff only on network error, not as the primary path).

See also: `docs/integration/SUBSCRIPTION_MANUAL_VERIFY_FALLBACK.md`

---

## P3 — Caching & cleanup (no new backend work)

| Area | File(s) | Action |
|------|---------|--------|
| Repeated `getById` | `App.tsx` handlers | Extract `hydrateProjectFlow(projectId)` or `projectCacheStore` with invalidation on update/delete |
| Estimation store leak | `estimationStore` | Call `reset()` when leaving estimation pricing or starting a new project |
| Export Settings refetch | `ExportSettingsSection`, `templateStore` | Session cache `loadTemplates()` with `lastLoadedAt` |
| Quote extras profile fetch | `QuoteExtrasNotesScreen` | Use payment methods from already-loaded templates; drop redundant `getProfile` |
| Dead code | `GenerateQuoteModal`, `EstimationPricingPanel` | Remove or wire; active flow uses `quotesService`, not `estimationStore.saveQuote` |

---

## Suggested TypeScript additions (frontend)

```ts
// material-lists.service.ts
export interface MaterialListSummary {
  id: number;
  projectId: number;
  projectName: string;
  siteAddress: string | null;
  projectStatus: 'draft' | 'calculated' | 'archived';
  calculated: boolean;
  lastCalculatedAt: string | null;
  itemCount: number;
  itemsTotal: number;
  pointsCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialListListResponse {
  materialLists: MaterialListSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// estimation types
export interface EstimationBootstrap {
  fillSource: 'system' | 'user_library' | 'last_used';
  itemKeys: ItemKeyEntry[];
  pricingInputs: PricingInput[];
  projectId: number;
}

// projects.service.ts — extend list item
export interface ProjectListItem {
  // ...existing fields
  materialListId: number | null;
  hasMaterialList: boolean;
}

// material catalog
export interface MaterialCatalogResponse {
  catalogVersion: string;
  items: ItemKeyEntry[];
  total: number;
  totalUnfiltered: number;
}
```

---

## What we intentionally did not ship (yet)

| Item | Reason |
|------|--------|
| `GET /settings/bootstrap` | Defer until frontend session cache is in place |
| `GET /subscriptions/plans-page` | Same — `Promise.all` on 3 calls is acceptable short-term |
| Preview server cache / subtotal endpoint | Fix frontend debounce first; backend cache is optional |
| `GET /projects/:id?include=flow` | `lastCalculationResult` already returned; frontend cache is enough |

---

## Deployment checklist

**API (before frontend adopts new fields):**
```bash
npx prisma migrate deploy   # adds Quote.clientReference
npm run build
```

**Frontend rollout order:**
1. Preview storm fix + remove `user_library` double fetch (no API dependency)
2. `GET /material-lists` list endpoint
3. Catalog cache + enriched material-prices
4. `includePriceFill` on calculate + project list `materialListId`
5. `clientReference` on quote create + verify-payment on callback
6. App-level project cache + estimation store reset

---

## Questions / contact

If response shapes need adjustment (e.g. extra summary fields on `GET /material-lists`, or `estimationBootstrap` on `GET /projects/:id`), open a backend ticket with the screen and payload you need — prefer extending list/summary endpoints over new per-entity fan-out.

**Related docs:**
- `docs/FRONTEND-ESTIMATION-INTEGRATION.md` — estimation flow (update step 2 after adopting `includePriceFill`)
- `docs/integration/FRONTEND-PAYMENT-SUBSCRIPTION-INTEGRATION.md` — subscriptions
- `.cursor/plans/api_optimization_audit_786fead5.plan.md` — full audit + trimmed backend checklist
