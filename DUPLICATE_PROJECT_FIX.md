# Duplicate Project Creation Fix

## Problem Identified

Projects were being created with **three duplicate copies** when reaching the calculation/solution screen.

## Root Cause Analysis

### Multiple Save Points

1. **Draft Save** (App.tsx, line 295):
   - When user completes project description step
   - Creates a draft project with minimal data
   - This is the **1st project creation**

2. **Full Save** (ProjectSolutionScreen.tsx, line 222):
   - After calculation completes successfully
   - Creates a project with full data (including glazingDimensions)
   - This is the **2nd project creation**

3. **React StrictMode Duplicate** (ProjectSolutionScreen.tsx):
   - React StrictMode in development runs effects twice
   - The `useEffect` that triggers calculation runs twice
   - Each run calls `handleCalculate()` → `handleSaveProject()`
   - This causes the **3rd project creation**

### Why It Happens

```typescript
// In index.tsx
<React.StrictMode>  // ← Causes effects to run twice in dev
  <App />
</React.StrictMode>

// In ProjectSolutionScreen.tsx
useEffect(() => {
  if (previousData) {
    handleCalculate(); // ← Runs twice due to StrictMode
  }
}, []);

// Inside handleCalculate()
await handleSaveProject(); // ← Called twice, creates duplicate projects
```

## Solution Implemented

### 1. Added Refs to Track State

```typescript
// Refs to prevent duplicate calculations and saves
const calculationInProgressRef = useRef(false);
const saveInProgressRef = useRef(false);
const hasCalculatedRef = useRef(false);
const hasSavedRef = useRef(false);
```

### 2. Guard in useEffect

```typescript
useEffect(() => {
  // Prevent duplicate calculations (React StrictMode runs effects twice in dev)
  if (hasCalculatedRef.current || calculationInProgressRef.current) {
    return;
  }
  
  if (previousData) {
    handleCalculate();
  }
}, []);
```

### 3. Guard in handleCalculate

```typescript
const handleCalculate = async () => {
  // Prevent duplicate calculations
  if (calculationInProgressRef.current || hasCalculatedRef.current) {
    console.log('[ProjectSolutionScreen] Calculation already in progress or completed, skipping');
    return;
  }
  
  calculationInProgressRef.current = true;
  // ... rest of calculation logic
  hasCalculatedRef.current = true;
  // ...
  calculationInProgressRef.current = false;
};
```

### 4. Guard in handleSaveProject

```typescript
const handleSaveProject = async () => {
  // Prevent duplicate saves (React StrictMode or multiple calls)
  if (saveInProgressRef.current || hasSavedRef.current || projectSaved) {
    console.log('[ProjectSolutionScreen] Project already saved or save in progress, skipping');
    return;
  }
  
  saveInProgressRef.current = true;
  // ... save logic
  hasSavedRef.current = true;
  // ...
  saveInProgressRef.current = false;
};
```

## Result

✅ **Fixed**: React StrictMode duplicate saves (3rd duplicate)  
⚠️ **Remaining**: Still creates 2 projects (draft + full save)

## Remaining Issue

The application still creates **2 projects**:
1. Draft project (when description is completed)
2. Full project (when calculation completes)

### Why This Happens

- Draft save doesn't store the project ID
- Solution screen can't update the draft (no ID available)
- Solution screen creates a new project with full data

### Potential Future Improvement

**Option 1: Store Project ID from Draft Save**
```typescript
// In App.tsx - handleProjectDescriptionNext
const response = await projectsService.create(projectData);
const projectId = response.response.id;
// Store projectId in state/store
// Pass to ProjectSolutionScreen
// Use projectsService.update(projectId, fullData) instead of create
```

**Option 2: Skip Draft Save**
- Only save when calculation completes
- Risk: User loses data if they navigate away before calculation

**Option 3: Backend Deduplication**
- Backend checks for existing draft with same projectName/customer
- Updates instead of creating duplicate

## Testing

To verify the fix:

1. **Create a new project**:
   - Complete project description → Draft saved (1 project)
   - Complete all steps to solution screen → Full project saved (2 projects total)
   - ✅ Should NOT create a 3rd duplicate

2. **Check console logs**:
   - Should see: `[ProjectSolutionScreen] Calculation already in progress or completed, skipping`
   - Should see: `[ProjectSolutionScreen] Project already saved or save in progress, skipping`

3. **Check database**:
   - Should see maximum 2 projects per flow (draft + full)
   - Should NOT see 3 identical projects

## Files Modified

- `src/components/features/projects/ProjectSolutionScreen.tsx`
  - Added `useRef` import
  - Added refs to track calculation/save state
  - Added guards in `useEffect`, `handleCalculate`, and `handleSaveProject`

## Notes

- React StrictMode is intentional for development (helps catch bugs)
- The fix works in both development and production
- Refs persist across re-renders but reset on component unmount
- The guards prevent duplicate API calls even if component re-renders


