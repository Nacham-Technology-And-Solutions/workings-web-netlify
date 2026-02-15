# Frontend: Use Project Calculate So Results Are Saved

Use the **project calculate** endpoint when running calculations for a project so that results are stored and returned with the project.

## Use project calculate (recommended for projects)

- **Endpoint:** `POST /projects/:projectId/calculate`
- **Auth:** Required (project must belong to the authenticated user)
- **Body:** None — the backend uses the project’s stored `glazingDimensions` and `calculationSettings`
- **Response:** Includes `calculationResult.result` (full calculation) and the updated project. A later `GET /projects/:projectId` will include `lastCalculationResult` with the same data

**Why:** `lastCalculationResult` on GET project is only populated when the project has stored calculation records (material list, cutting list, glass cutting list). Only this endpoint writes those records.

### Request sample — POST /projects/:projectId/calculate

**Method:** `POST`  
**Path:** `/api/v1/projects/42/calculate` (use the real project id)  
**Headers:** `Content-Type: application/json`, plus auth (e.g. session cookie or Bearer token)  
**Body:** None. Send an empty body `{}` or omit the body.

```http
POST /api/v1/projects/42/calculate HTTP/1.1
Host: your-api.example.com
Content-Type: application/json
Cookie: session=...

{}
```

### Response sample — POST /projects/:projectId/calculate

```json
{
  "responseMessage": "Project calculation completed successfully",
  "response": {
    "project": {
      "id": 42,
      "projectName": "Office Windows",
      "calculated": true,
      "lastCalculatedAt": "2025-02-12T10:00:00.000Z",
      "status": "calculated",
      "glazingDimensions": [...],
      "materialLists": [{ "id": 1, "materialList": [...], "pointsCost": 10, ... }],
      "cuttingLists": [{ "id": 1, "cuttingList": [...], "elements": [...] }],
      "glassCuttingLists": [{ "id": 1, "glassList": {...}, "rubberTotals": [...], "accessoryTotals": [...], "elements": [...] }]
    },
    "calculationResult": {
      "materialList": { "id": 1, "materialList": [...], "pointsCost": 10 },
      "cuttingList": { "id": 1, "cuttingList": [...], "elements": [...] },
      "glassCuttingList": { "id": 1, "glassList": {...}, "rubberTotals": [...], "accessoryTotals": [...], "elements": [...] },
      "result": {
        "materialList": [
          { "item": "Width Profile", "units": 1, "type": "Profile" },
          { "item": "Glass Sheet (3310x2140mm)", "units": 1, "type": "Sheet" }
        ],
        "cuttingList": [{ "profile_name": "Width Profile", "stock_length": 6000, "plan": [...] }],
        "glassList": { "sheet_type": "3310x2140mm", "total_sheets": 1, "cuts": [{ "h": 1320, "w": 439, "qty": 2, "elementId": "el_0" }] },
        "rubberTotals": [{ "name": "Glazing Rubber", "total_meters": 13.91 }],
        "accessoryTotals": [{ "name": "Handle", "qty": 6, "unit": "pcs" }, ...],
        "elements": [
          { "id": "el_0", "title": "Living room", "color": "#3B82F6" },
          { "id": "el_1", "title": "Bedroom 1", "color": "#10B981" }
        ]
      }
    },
    "pointsDeducted": 10,
    "balanceAfter": 990
  }
}
```

- Use `response.calculationResult.result` for the full in-memory result (material list, cutting list, glass list, rubbers, accessories, elements). Stored lists are in `materialList`, `cuttingList`, `glassCuttingList` (with DB ids).

### Request/response — GET /projects/:projectId (after calculate)

**Method:** `GET`  
**Path:** `/api/v1/projects/42`

**Response (when the project has been calculated at least once):**

```json
{
  "responseMessage": "Project retrieved successfully",
  "response": {
    "project": { "id": 42, "projectName": "Office Windows", "glazingDimensions": [...], ... },
    "lastCalculationResult": {
      "materialList": [...],
      "cuttingList": [...],
      "glassList": { "sheet_type": "3310x2140mm", "total_sheets": 1, "cuts": [...] },
      "rubberTotals": [...],
      "accessoryTotals": [...],
      "elements": [
        { "id": "el_0", "title": "Living room", "color": "#3B82F6" },
        { "id": "el_1", "title": "Bedroom 1", "color": "#10B981" }
      ]
    }
  }
}
```

When the project has never been calculated, `lastCalculationResult` is `null`.

## Recommended flow

1. Create or update the project with `glazingDimensions` (and optional `title` / `color` per element) so the project is saved.
2. Call **POST /projects/:projectId/calculate**.
3. Use the response, or call **GET /projects/:projectId** — the response will include `lastCalculationResult` (material list, cutting list, glass list, rubbers, accessories, `elements` with titles/colors if saved on the project).

## Standalone calculate (optional)

- **Endpoint:** `POST /api/v1/calculations/calculate`
- **Use for:** One-off calculations not tied to a project (e.g. quick quote or preview). Request body: `projectCart`, optional `settings`, optional `elementDisplayOverrides` (title/color per element).
- **Note:** The result is **not** saved to any project. If you only use this endpoint, `GET /projects/:projectId` will always have `lastCalculationResult: null`.

### Request sample — POST /api/v1/calculations/calculate

**Body:**

```json
{
  "projectCart": [
    { "module_id": "M1_Casement_DCurve", "W": 1200, "H": 1500, "N": 2, "qty": 1 },
    { "module_id": "M1_Casement_DCurve", "W": 800, "H": 800, "N": 2, "qty": 1 }
  ],
  "settings": { "stockLength": 6 },
  "elementDisplayOverrides": [
    { "title": "Living room", "color": "#3B82F6" },
    { "title": "Kitchen", "color": "#10B981" }
  ]
}
```

**Response:** Same calculation result shape as `calculationResult.result` above (materialList, cuttingList, glassList, rubberTotals, accessoryTotals, elements). Nothing is persisted to a project.

## Summary

| Goal                               | Endpoint                            |
|------------------------------------|-------------------------------------|
| Run calculation and save on project | `POST /projects/:projectId/calculate` |
| One-off calculation (no save)      | `POST /api/v1/calculations/calculate` |
