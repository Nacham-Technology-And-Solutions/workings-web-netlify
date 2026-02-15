# Frontend implementation plan: Glazing element title & color

**Reference:** [MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md](../backend/MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md) (backend contract)  
**Purpose:** Support optional **title** and **color** per glazing element so the backend can use them in calculation results and the UI can display user-defined labels and colors.

---

## 1. Backend changes (summary)

The backend now supports:

- **On project create/update:** Each item in `glazingDimensions` may include:
  - `title?: string` — optional label (e.g. "Living room", "Bedroom 1"); max 100 chars.
  - `color?: string` — optional hex (e.g. `"#3B82F6"`). If omitted, backend uses default title ("Window 1", …) and default palette.
- **On calculation result:** `result.elements` (and stored cutting/glass list `elements`) still have `{ id, title, color }`. Backend fills these from the submitted `title`/`color` when provided, otherwise uses defaults.
- **IDs** remain backend-assigned (`el_0`, `el_1`, …).

No change to how the frontend consumes the calculation response: we already read `result.elements` and use `id`/`title`/`color` for display and export.

---

## 2. Frontend scope

- **Add optional title and color to the measurement flow** so users can label and color elements (e.g. "Living room", "#3B82F6").
- **Persist title/color** in project data and send them when creating/updating the project so the backend can use them.
- **Restore title/color** when loading a project so they appear when re-editing dimensions.
- **No change** to calculation result handling: we already use `elements[].title` and `elements[].color` in ProjectSolutionScreen and exports.

---

## 3. Implementation plan (phases)

### Phase 1: Types and data flow

**Goal:** Types and transformers support optional `title` and `color`; they are sent to the API when present and restored when loading a project.

| Step | File | Change |
|------|------|--------|
| 1.1 | `src/types/project.ts` | Add to `DimensionItem`: `title?: string;` and `color?: string;`. Add to `GlazingDimension`: `title?: string;` and `color?: string;`. |
| 1.2 | `src/utils/dataTransformers.ts` | In `convertDimensionItemToGlazingDimension`, after building the return object, add `...(item.title !== undefined && item.title !== '' && { title: item.title })` and `...(item.color !== undefined && item.color !== '' && { color: item.color })` (or equivalent) so optional title/color are passed through to `GlazingDimension`. |
| 1.3 | `src/app/App.tsx` | Where `projectData.glazingDimensions` is mapped to `newMeasurementData.dimensions` (reconstructing dimension items from API), add `title: (dim as any).title` and `color: (dim as any).color` to each mapped dimension item so loaded projects show existing labels and colors. (After 1.1, type `GlazingDimension` with `title?`/`color?` and use `dim.title` / `dim.color`.) |
| 1.4 | — | Confirm `projects.service` and PATCH/POST project payloads send the full `GlazingDimension` object (they already use `GlazingDimension[]`). Once the type includes `title` and `color`, they will be sent automatically. No change needed unless the API client strips unknown fields. |

**Outcome:** Creating/updating a project with dimensions that have title/color will send them to the backend. Loading a project will populate dimension items with title/color for the measurement screen.

---

### Phase 2: Measurement UI – capture title and color

**Goal:** In the measurement step, users can optionally set a label and color per dimension. Values are stored in `DimensionItem` and flow through to `GlazingDimension` via existing converters.

| Step | File | Change |
|------|------|--------|
| 2.1 | `src/components/features/projects/ProjectMeasurementScreen.tsx` | Add state for optional **label (title)** and **color** in the add/edit dimension form: e.g. `title` (string), `color` (string, hex). Initialize from existing dimension when editing; clear when form is cleared. |
| 2.2 | Same | In **handleEditDimension**, set `title` and `color` from `dimension.title` and `dimension.color` (with fallbacks to `''`). |
| 2.3 | Same | In **handleAddDimension**, include `title` and `color` in `dimensionData` (only if non-empty, or always as optional fields). When clearing the form after add/update, reset title and color. |
| 2.4 | Same | In the **dimension form** (e.g. after Quantity or before Add/Update button), add: (1) Optional text input "Label" (placeholder e.g. "e.g. Living room"), max length 100, value `title`, onChange updates title state. (2) Optional **color** control: either a color picker `<input type="color">` plus optional hex text input, or a small palette of preset hex colors (e.g. 6–8 options). Value `color`, onChange updates color state. |
| 2.5 | Same | In the **Preview** table, optionally show the label (e.g. a "Label" column or subtitle under dimension) and a small color swatch if `dim.title` or `dim.color` is set, so users can see at a glance which element has which label/color. |

**Outcome:** Users can set an optional label and color per dimension. These are stored in `dimensions` and sent to the backend on project save.

---

### Phase 3: Backend response and loading (verification)

**Goal:** Ensure that when the backend returns projects with `glazingDimensions` including `title` and `color`, the frontend restores them everywhere we use project data.

| Step | File | Change |
|------|------|--------|
| 3.1 | `src/app/App.tsx` | Confirm the mapping from `apiProject.glazingDimensions` to `projectMeasurementData.dimensions` (used when opening a project for edit) includes `title` and `color` (done in Phase 1). |
| 3.2 | Any other place that builds or reads `dimensions` from API | Grep for `glazingDimensions` and ensure no code path strips or ignores `title`/`color` when reconstructing dimension items. |

**Outcome:** No regression when backend sends title/color; they are preserved in UI state and when re-saving.

---

### Phase 4: Optional enhancements (post-MVP)

- **Default titles:** If the backend does not send a title, the UI could show a generated label (e.g. "Window 1") in the preview or in the solution screen only for display; the implementation plan above does not require this.
- **Color palette:** Define a small set of hex colors (e.g. in a constant array) for the preset palette to match backend default palette or branding.
- **Validation:** If we want to enforce max length 100 for title, add a `maxLength={100}` on the label input and optionally trim on submit.
- **Project detail / quote views:** If we show glazing dimensions elsewhere (e.g. ProjectDetailScreen), consider displaying title and color there for consistency.

---

## 4. Files to touch (summary)

| File | Phase | Purpose |
|------|--------|---------|
| `src/types/project.ts` | 1 | Add `title?`, `color?` to `DimensionItem` and `GlazingDimension`. |
| `src/utils/dataTransformers.ts` | 1 | Pass through `title` and `color` in `convertDimensionItemToGlazingDimension`. |
| `src/app/App.tsx` | 1, 3 | Restore `title` and `color` when mapping `glazingDimensions` → dimension items; verify no path drops them. |
| `src/components/features/projects/ProjectMeasurementScreen.tsx` | 2 | Form state, edit/add handlers, Label + Color inputs, preview table columns/swatch. |

No changes required to:

- `src/types/calculations.ts` (GlazingElement already has id, title, color).
- `src/components/features/projects/ProjectSolutionScreen.tsx` (already uses `elementsMap` and element title/color for display and export).
- Calculation or export services (they consume `result.elements` as today).

---

## 5. Assumptions and open points

- **API usage:** The doc describes project-based calculate (`POST /api/v1/projects/:projectId/calculate` with no body). The frontend currently uses `POST /api/v1/calculations/calculate` with `projectCart`. Assumption: either (a) the frontend will send `glazingDimensions` (with title/color) on project create/update, and the backend will use them when running calculation (e.g. via project), or (b) the calculation endpoint will be aligned to accept or resolve title/color the same way. Implementation only needs to send title/color on glazing dimensions when creating/updating the project.
- **Backend defaults:** If `title` or `color` is omitted, the backend supplies defaults. Frontend may send empty string or omit the key; recommend omitting the key when empty so backend clearly applies defaults.
- **Existing projects:** Projects created before this change will not have `title`/`color` on dimensions. UI should treat missing values as empty (optional fields); no migration needed.

---

## 6. Testing checklist (for reviewer)

- [ ] Add a new dimension with label "Living room" and a chosen color; save project; run calculation; cutting list and glass list show "Living room" and the color where expected.
- [ ] Add a dimension with no label/color; backend returns default title (e.g. "Window 1") and a default color; UI displays them.
- [ ] Load an existing project that has title/color on dimensions; measurement screen shows the label and color; re-saving keeps them.
- [ ] Load an old project without title/color; no errors; user can add title/color and save.
- [ ] Export cutting list PDF/Excel: element titles (and colors if applicable) match the chosen or backend-default values.

---

*Plan prepared for review. After approval, implementation can proceed phase by phase.*
