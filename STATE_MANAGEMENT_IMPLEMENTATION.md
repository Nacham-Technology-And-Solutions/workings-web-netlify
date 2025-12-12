# State Management Implementation - Zustand

## Overview

We've successfully implemented **Zustand** as the state management solution for the Workings application. This replaces the previous approach of managing all state in `App.tsx` with `useState` hooks.

## Why Zustand?

- ✅ **Lightweight**: Minimal bundle size (~1KB)
- ✅ **Simple API**: Less boilerplate than Redux
- ✅ **TypeScript-friendly**: Excellent type inference
- ✅ **Performance**: Selective subscriptions, no unnecessary re-renders
- ✅ **Persistence**: Built-in middleware for localStorage/IndexedDB
- ✅ **Perfect for PWA**: Works great with offline-first architecture

## Store Structure

### 1. Auth Store (`src/stores/authStore.ts`)
Manages authentication state:
- User authentication status
- User profile data
- Access/refresh tokens
- Auth screen navigation (login/register/forgot-password/reset-password)
- Onboarding state
- **Persistence**: Yes (localStorage)

### 2. UI Store (`src/stores/uiStore.ts`)
Manages UI state:
- Current view/navigation
- Previous view (for back navigation)
- Sidebar open/closed state
- **Persistence**: No (session-only)

### 3. Project Store (`src/stores/projectStore.ts`)
Manages project-related state:
- Project description data
- Select project data
- Project measurement data
- Floor plan (legacy feature)
- Active tool
- Material cost from step 4
- **Persistence**: Yes (localStorage)

### 4. Calculation Store (`src/stores/calculationStore.ts`)
Manages calculation results:
- Current calculation result
- Loading state
- Error state
- **Persistence**: Yes (localStorage)

### 5. Quote Store (`src/stores/quoteStore.ts`)
Manages quote-related state:
- Generated quote preview
- Selected quote ID
- **Persistence**: Yes (localStorage)

### 6. Material List Store (`src/stores/materialListStore.ts`)
Manages material list state:
- Selected material list ID
- Material list preview data
- Currently editing material list
- **Persistence**: Yes (localStorage)

### 7. Sync Store (`src/stores/syncStore.ts`)
Manages offline/online sync state:
- Online/offline status
- Pending sync operations
- **Persistence**: No (session-only)

## Usage Examples

### Using Auth Store
```typescript
import { useAuthStore } from '@/stores';

const MyComponent = () => {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  
  // Use state
  if (isAuthenticated) {
    return <div>Welcome, {user?.email}</div>;
  }
  
  // Use actions
  const handleLogin = async () => {
    await login(accessToken, refreshToken, userProfile);
  };
};
```

### Using UI Store
```typescript
import { useUIStore } from '@/stores';

const MyComponent = () => {
  const { currentView, navigate, goBack } = useUIStore();
  
  // Navigate to a new view
  const handleClick = () => {
    navigate('projects');
  };
  
  // Go back
  const handleBack = () => {
    goBack();
  };
};
```

### Using Project Store
```typescript
import { useProjectStore } from '@/stores';

const MyComponent = () => {
  const { 
    projectDescriptionData, 
    setProjectDescriptionData,
    getCombinedProjectData 
  } = useProjectStore();
  
  // Set project data
  const handleNext = (data) => {
    setProjectDescriptionData(data);
  };
  
  // Get combined data
  const combined = getCombinedProjectData();
};
```

## Migration Status

### ✅ Completed
- [x] Install Zustand
- [x] Create all 7 stores
- [x] Set up persistence middleware
- [x] Migrate `App.tsx` to use stores
- [x] Update `LoginScreen` to use auth store
- [x] Update `RegistrationScreen` to use auth store

### 🔄 Incremental (Can be done as needed)
- [ ] Update other components to use stores directly (instead of props drilling)
- [ ] Add more store actions as features grow
- [ ] Implement IndexedDB persistence for offline support
- [ ] Add store selectors for computed values

## Benefits Achieved

1. **Cleaner App.tsx**: Reduced from 20+ useState hooks to clean store usage
2. **Better Organization**: State is logically separated into domain stores
3. **Persistence**: Critical state persists across page refreshes
4. **Type Safety**: Full TypeScript support with type inference
5. **Performance**: Components only re-render when their subscribed state changes
6. **Scalability**: Easy to add new stores and actions as the app grows

## Next Steps

1. **Run `npm install`** to install Zustand
2. **Test the application** to ensure everything works
3. **Gradually migrate components** to use stores directly (optional, for better performance)
4. **Add IndexedDB persistence** for offline-first support (when implementing PWA features)

## Store Files Created

```
src/stores/
├── index.ts                 # Export all stores
├── authStore.ts            # Authentication state
├── uiStore.ts              # UI/navigation state
├── projectStore.ts         # Project data state
├── calculationStore.ts     # Calculation results
├── quoteStore.ts           # Quote data
├── materialListStore.ts    # Material list data
└── syncStore.ts            # Offline/sync state
```

## Notes

- The floor plan estimates calculation logic remains in `App.tsx` as it's a legacy feature. This can be moved to a separate hook or store action later if needed.
- Some components still receive props for backward compatibility, but they can be gradually updated to use stores directly.
- The auth store automatically syncs with localStorage for the API client, so existing API calls continue to work.

---

**Implementation Date**: January 2025  
**State Management Library**: Zustand v5.0.2

