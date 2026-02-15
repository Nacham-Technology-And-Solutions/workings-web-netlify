# Templates Module Backend Response (Frontend Use)

**Purpose:** Backend response contract for Templates module alignment.  
**Scope:** Export settings (`/api/v1/templates`) and Saved templates (`/api/v1/saved-templates`).  
**Pre-built templates:** No backend endpoint (frontend uses built-in list).

---

## 1) Export Settings (Current Template Config)

**Base:** `/api/v1/templates`  
**Auth:** Required (same as app).  
**Status:** Implemented.

### GET `/api/v1/templates`
Returns current user’s template config. If no record exists, returns defaults.

**Response (200):**
```json
{
  "responseMessage": "Templates retrieved successfully",
  "response": {
    "quoteFormat": { /* ... */ },
    "paymentMethods": [],
    "paymentMethodConfig": { /* ... */ },
    "pdfExport": { /* ... */ },
    "materialPrices": [],
    "materialPricesConfig": { /* ... */ }
  }
}
```

### PUT `/api/v1/templates`
Saves full template config (Export settings).

**Response (200):**
```json
{
  "responseMessage": "Templates saved successfully",
  "response": { "success": true }
}
```

### Sub-routes
- `/api/v1/templates/payment-methods`
- `/api/v1/templates/material-prices`

These are unchanged and follow the existing contract.

---

## 2) Saved Templates (User Presets)

**Base:** `/api/v1/saved-templates`  
**Auth:** Required.  
**Limit:** Max 3 saved templates per user.

### Model
```ts
type SavedTemplateType = 'quoteFormat' | 'pdfExport' | 'full';

interface SavedTemplate {
  id: string;
  name: string;
  type: SavedTemplateType;
  quoteFormat?: QuoteFormatConfig;
  pdfExport?: PDFExportConfig;
  createdAt: string; // ISO 8601
  source?: 'user';   // always user
}
```

### GET `/api/v1/saved-templates`
**Response (200):**
```json
{
  "responseMessage": "Saved templates retrieved successfully",
  "response": {
    "savedTemplates": [ /* SavedTemplate[] */ ]
  }
}
```

### POST `/api/v1/saved-templates`
**Body:**
```json
{
  "name": "Standard Quote",
  "type": "full",
  "quoteFormat": { /* required if type is quoteFormat or full */ },
  "pdfExport": { /* required if type is pdfExport or full */ }
}
```

**Validation:**
- `name` required, max 100
- `type` required
- `quoteFormat`/`pdfExport` required per `type`
- Max 3 saved templates per user (400 if exceeded)

**Response (201):**
```json
{
  "responseMessage": "Saved template created successfully",
  "response": {
    "savedTemplate": { /* SavedTemplate */ }
  }
}
```

### PATCH `/api/v1/saved-templates/:id`
Allows rename and/or snapshot updates.

**Body (any of):**
```json
{
  "name": "Updated Name",
  "quoteFormat": { /* optional */ },
  "pdfExport": { /* optional */ }
}
```

**Notes:**
- Template `type` is fixed.
- `quoteFormat` cannot be updated for `pdfExport` type and vice versa.
- Both can be updated only if `type` is `full`.

**Response (200):**
```json
{
  "responseMessage": "Saved template updated successfully",
  "response": {
    "savedTemplate": { /* SavedTemplate */ }
  }
}
```

### DELETE `/api/v1/saved-templates/:id`
**Response (200):**
```json
{
  "responseMessage": "Saved template deleted successfully",
  "response": { "success": true }
}
```

---

## 3) Error Format

Errors follow the app’s standard style:
```json
{
  "responseMessage": "Error message",
  "message": "Detailed error message",
  "errors": [
    { "field": "name", "message": "Name is required" }
  ]
}
```
