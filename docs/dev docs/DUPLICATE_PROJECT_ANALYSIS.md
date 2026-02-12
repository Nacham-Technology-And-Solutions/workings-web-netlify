# Duplicate Project Creation - Detailed Analysis

## Current Flow Analysis

### Step 1: Project Description Screen → Draft Save
**Location**: `src/app/App.tsx` - `handleProjectDescriptionNext()` (line 269-319)

**What Happens**:
1. User completes project description form
2. Data is stored in state: `setProjectDescriptionData(data)`
3. **Draft project is created** via `projectsService.create()` (line 295)
   - Project data includes:
     - `projectName`
     - `customer.name`
     - `siteAddress`
     - `description` (optional)
     - `glazingDimensions: []` (empty - this is a draft)
     - `calculationSettings` (defaults)
4. **Project ID is returned but NOT stored** ❌
5. User navigates to next screen: `navigate('selectProject')`

**Code**:
```typescript
const handleProjectDescriptionNext = async (data: any) => {
  setProjectDescriptionData(data);
  
  // Save project as draft when user completes project description
  try {
    const projectData: any = {
      projectName: data.projectName.trim(),
      customer: { name: data.customerName.trim() },
      siteAddress: data.siteAddress.trim(),
      glazingDimensions: [], // Empty array for draft
      // ...
    };
    
    await projectsService.create(projectData); // ← Creates Project #1
    // ❌ Project ID is NOT stored anywhere
  } catch (error) {
    // Silently fail
  }
  
  navigate('selectProject');
};
```

---

### Step 2: Select Project → Measurement → Solution Screen
**Location**: `src/app/App.tsx` - Navigation flow

**What Happens**:
1. User selects project type → `handleSelectProjectNext()` → `navigate('projectMeasurement')`
2. User enters measurements → `handleProjectMeasurementNext()` → `navigate('projectSolution')`
3. Data flows through state (projectStore) but **no project ID is passed**

---

### Step 3: Project Solution Screen → Full Save
**Location**: `src/components/features/projects/ProjectSolutionScreen.tsx`

**What Happens**:
1. Component mounts with `previousData` (description, select, measurement data)
2. `useEffect` triggers `handleCalculate()` (line 73-78)
3. Calculation API is called
4. After successful calculation, `handleSaveProject()` is called (line 184)
5. **New project is created** via `projectsService.create()` (line 222)
   - Project data includes:
     - All the same fields as draft
     - **PLUS**: `glazingDimensions` (full data from measurements)
     - **PLUS**: `calculationSettings` (from measurements)
6. This creates **Project #2** (duplicate of Project #1, but with full data)

**Code**:
```typescript
const handleSaveProject = async () => {
  // ... guards to prevent React StrictMode duplicates ...
  
  const projectData = createProjectData(
    previousData.projectDescription,
    previousData.selectProject,
    previousData.projectMeasurement
  );
  
  // ❌ Always uses create() - doesn't know about draft project
  const response = await projectsService.create({
    projectName: projectData.projectName,
    customer: projectData.customer,
    siteAddress: projectData.siteAddress,
    description: projectData.description,
    glazingDimensions: projectData.glazingDimensions, // ← Full data
    calculationSettings: projectData.calculationSettings,
  });
  // ← Creates Project #2 (duplicate)
};
```

---

## Root Cause

### The Problem
1. **Draft project is created** but its ID is **not stored**
2. **Solution screen doesn't know** about the draft project
3. **Solution screen always creates** a new project instead of updating the draft
4. Result: **2 separate projects** in database (draft + full)

### Why This Design?
Looking at the comment in `App.tsx` line 296-297:
```typescript
// Note: We don't show error to user here as this is a background save
// The project will be saved again later with full data
```

This suggests the original design was:
- Draft save = backup/autosave (can fail silently)
- Full save = final save with complete data

But this creates duplicates!

---

## Current State After Previous Fix

✅ **Fixed**: React StrictMode duplicate (3rd duplicate) - eliminated  
❌ **Still Exists**: Draft save + Full save = 2 projects

---

## Solution Options

### Option 1: Store Draft Project ID and Update Instead of Create ⭐ (Recommended)

**Approach**:
1. Store the draft project ID when it's created
2. Pass the draft project ID to ProjectSolutionScreen
3. Use `projectsService.update()` if draft ID exists, otherwise `create()`

**Changes Required**:

**A. Store Draft Project ID** (`App.tsx`):
```typescript
// Add state to store draft project ID
const [draftProjectId, setDraftProjectId] = useState<number | null>(null);

const handleProjectDescriptionNext = async (data: any) => {
  setProjectDescriptionData(data);
  
  try {
    const projectData = { /* ... */ };
    const response = await projectsService.create(projectData);
    
    // ✅ Store the draft project ID
    const projectId = response.response.id;
    setDraftProjectId(projectId);
  } catch (error) {
    // Handle error
  }
  
  navigate('selectProject');
};
```

**B. Pass Draft ID to Solution Screen** (`App.tsx`):
```typescript
if (currentView === 'projectSolution') {
  return (
    <ProjectSolutionScreen
      draftProjectId={draftProjectId} // ✅ Pass draft ID
      previousData={combinedData}
      // ...
    />
  );
}
```

**C. Update Instead of Create** (`ProjectSolutionScreen.tsx`):
```typescript
interface ProjectSolutionScreenProps {
  draftProjectId?: number | null; // ✅ Add prop
  // ... other props
}

const handleSaveProject = async () => {
  // ... existing guards ...
  
  const projectData = createProjectData(/* ... */);
  
  let response;
  if (draftProjectId) {
    // ✅ Update existing draft project
    response = await projectsService.update(draftProjectId, {
      glazingDimensions: projectData.glazingDimensions,
      calculationSettings: projectData.calculationSettings,
      status: 'calculated', // Update status
    });
  } else {
    // ✅ Create new project (fallback if draft wasn't created)
    response = await projectsService.create({
      projectName: projectData.projectName,
      customer: projectData.customer,
      siteAddress: projectData.siteAddress,
      description: projectData.description,
      glazingDimensions: projectData.glazingDimensions,
      calculationSettings: projectData.calculationSettings,
    });
  }
  
  // ... rest of save logic
};
```

**D. Clear Draft ID After Save** (`App.tsx`):
```typescript
const handleProjectSolutionGenerate = () => {
  setDraftProjectId(null); // ✅ Clear after successful save
  // ... rest of logic
};
```

**Pros**:
- ✅ Eliminates duplicate projects
- ✅ Maintains draft save functionality (backup)
- ✅ Updates existing project (better data integrity)
- ✅ Backward compatible (fallback to create if no draft)

**Cons**:
- Requires changes in multiple files
- Need to handle edge cases (draft save fails, etc.)

---

### Option 2: Skip Draft Save Entirely

**Approach**:
- Remove the draft save from `handleProjectDescriptionNext`
- Only save when calculation completes

**Changes Required**:
- Remove `projectsService.create()` call from `App.tsx` line 295
- Remove try-catch block for draft save

**Pros**:
- ✅ Simple - only one save point
- ✅ No duplicates
- ✅ Less code

**Cons**:
- ❌ No backup if user navigates away before calculation
- ❌ User loses data if they close browser/app
- ❌ No draft project to resume later

---

### Option 3: Backend Deduplication

**Approach**:
- Backend checks for existing draft project with same `projectName` + `customer.name`
- If exists, update it instead of creating new one

**Pros**:
- ✅ No frontend changes needed
- ✅ Handles edge cases automatically

**Cons**:
- ❌ Requires backend changes
- ❌ May update wrong project if names match
- ❌ Less explicit control

---

## Recommendation

**Option 1** is recommended because:
1. Maintains the draft save functionality (good UX - user doesn't lose data)
2. Properly updates the draft instead of creating duplicates
3. Has fallback if draft save fails
4. Better data integrity (one project per flow)

---

## Implementation Plan (Option 1)

### Step 1: Add Draft Project ID State
- Add `draftProjectId` state in `App.tsx`
- Store ID when draft is created
- Clear ID after successful full save

### Step 2: Pass ID to Solution Screen
- Add `draftProjectId` prop to `ProjectSolutionScreen`
- Pass it from `App.tsx` when rendering

### Step 3: Update Save Logic
- Check if `draftProjectId` exists
- Use `update()` if exists, `create()` if not
- Update status to 'calculated' when updating

### Step 4: Error Handling
- Handle case where draft save failed (no ID)
- Handle case where update fails (fallback to create)
- Clear draft ID on errors

### Step 5: Testing
- Test: Draft save succeeds → Full save updates draft ✅
- Test: Draft save fails → Full save creates new ✅
- Test: User navigates away → Draft exists for resume ✅

---

## Files That Need Changes

1. **`src/app/App.tsx`**
   - Add `draftProjectId` state
   - Store ID from draft save response
   - Pass ID to `ProjectSolutionScreen`
   - Clear ID after successful save

2. **`src/components/features/projects/ProjectSolutionScreen.tsx`**
   - Add `draftProjectId` prop
   - Modify `handleSaveProject()` to use `update()` if ID exists
   - Add error handling for update failures

3. **`src/stores/projectStore.ts`** (Optional)
   - Could store draft ID in store instead of App state
   - More persistent across navigation

---

## Questions for Review

1. **Should we keep the draft save?**
   - Yes → Use Option 1
   - No → Use Option 2

2. **Where should draft ID be stored?**
   - App state (current approach)
   - Project store (more persistent)
   - URL params (shareable)

3. **What if draft save fails?**
   - Continue flow and create on solution screen (current behavior)
   - Show error and block navigation
   - Retry draft save

4. **Should we delete draft if user abandons flow?**
   - Yes - cleanup abandoned drafts
   - No - keep for potential resume

---

## Summary

**Current State**: 2 projects created (draft + full)  
**Root Cause**: Draft ID not stored, solution screen always creates new  
**Recommended Fix**: Option 1 - Store draft ID and update instead of create  
**Impact**: Eliminates duplicate, maintains draft functionality, better UX


