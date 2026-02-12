# Backend Fix Required: Quote projectId Validation

## Issue

When creating a **standalone quote** (not from a project), the frontend sends:
```json
{
  "quoteType": "standalone",
  "projectId": null,
  ...
}
```

The backend currently rejects this with:
```json
{
  "error": "ZodError(input validation error)",
  "responseMessage": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "null",
      "path": ["projectId"],
      "message": "Expected number, received null"
    }
  ]
}
```

However, the backend **accepts** `projectId: null` in successful responses, indicating the database schema allows null values.

## Required Fix

### Option 1: Make projectId Optional in Request Validation (Recommended)

Update the Zod schema for quote creation to make `projectId` optional:

**Current (likely):**
```typescript
projectId: z.number()  // Required, must be number
```

**Should be:**
```typescript
projectId: z.number().optional().nullable()  // Optional, can be number or null
// OR
projectId: z.number().nullable()  // Can be number or null
```

### Option 2: Omit projectId for Standalone Quotes

Alternatively, the frontend can omit the `projectId` field entirely for standalone quotes (which we've implemented), but the backend should still accept it if sent.

**Backend should accept:**
- `projectId: 27` (number) - for from_project quotes
- `projectId: null` (null) - for standalone quotes
- `projectId` omitted (undefined) - for standalone quotes

## Expected Behavior

### For "from_project" quotes:
- `projectId` should be a valid number
- `quoteType` should be `"from_project"`

### For "standalone" quotes:
- `projectId` should be `null` OR omitted
- `quoteType` should be `"standalone"`

## Current Frontend Implementation

The frontend now:
1. **Omits `projectId` field** for standalone quotes (doesn't send it at all)
2. **Includes `projectId`** only for from_project quotes

However, the backend should still accept `projectId: null` if sent, to be more flexible.

## Testing

After the fix, test both scenarios:

1. **Standalone Quote** (no projectId):
   ```json
   {
     "quoteType": "standalone",
     "customerName": "Jane Smith",
     ...
   }
   ```
   Should succeed ✅

2. **From Project Quote** (with projectId):
   ```json
   {
     "quoteType": "from_project",
     "projectId": 27,
     "customerName": "Jane Smith",
     ...
   }
   ```
   Should succeed ✅

3. **Standalone Quote** (with projectId: null - if sent):
   ```json
   {
     "quoteType": "standalone",
     "projectId": null,
     "customerName": "Jane Smith",
     ...
   }
   ```
   Should succeed ✅ (after fix)

## Summary

**Action Required**: Update backend Zod validation schema to allow `projectId` to be optional/nullable for standalone quotes.

**Priority**: High - Blocks standalone quote creation

**Impact**: Enables users to create quotes without projects

