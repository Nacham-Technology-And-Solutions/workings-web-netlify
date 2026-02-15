# Session Expiration Implementation

## Overview

The application now has a comprehensive session expiration handling system that automatically detects expired sessions and provides a user-friendly notification before redirecting to the login screen.

## What Was Implemented

### 1. Session Expiration Modal Component
**File**: `src/components/common/SessionExpiredModal.tsx`

A user-friendly modal that:
- Displays a clear message about session expiration
- Shows a warning icon
- Provides a "Sign In Again" button
- Prevents body scroll when open
- Has high z-index to appear above all content

### 2. Session Manager Utility
**File**: `src/utils/sessionManager.ts`

An event-based system for handling session expiration:
- `onSessionExpired()` - Subscribe to session expiration events
- `notifySessionExpired()` - Notify all listeners about session expiration
- `clearAuthData()` - Centralized function to clear all authentication data

### 3. Updated API Client
**File**: `src/services/api/apiClient.ts`

Enhanced to:
- Use event system instead of hard redirects
- Provide custom messages for different expiration scenarios
- Gracefully handle token refresh failures
- Notify the app about session expiration without breaking the SPA flow

### 4. Updated App Component
**File**: `src/app/App.tsx`

Now includes:
- Session expiration event listener
- State management for session expiration modal
- Proper navigation to login screen using app's routing
- Clean authentication state cleanup

## How It Works

### Flow Diagram

```
1. User makes API request
   ↓
2. API returns 401 Unauthorized
   ↓
3. apiClient tries to refresh token
   ↓
4a. Refresh succeeds → Retry original request
4b. Refresh fails → Notify session expiration
   ↓
5. SessionExpiredModal appears
   ↓
6. User clicks "Sign In Again"
   ↓
7. Auth data cleared, redirected to login
```

### Detailed Flow

1. **API Request with Expired Token**
   - User makes an API request
   - Backend returns 401 Unauthorized
   - apiClient interceptor catches the error

2. **Token Refresh Attempt**
   - apiClient checks if refresh token exists
   - If yes, attempts to refresh the access token
   - If refresh succeeds, retries original request
   - If refresh fails (401), proceeds to session expiration

3. **Session Expiration Notification**
   - `clearAuthAndRedirect()` is called
   - Auth data is cleared from localStorage
   - Auth store is updated (logout)
   - `notifySessionExpired()` is called with appropriate message

4. **Modal Display**
   - App component receives session expiration event
   - Sets `sessionExpired` state to `true`
   - SessionExpiredModal is displayed
   - User sees friendly message

5. **User Confirmation**
   - User clicks "Sign In Again"
   - `handleSessionExpiredConfirm()` is called
   - Auth data is cleared again (redundant but safe)
   - User is redirected to login screen via app navigation
   - Modal is closed

## Scenarios Handled

### Scenario 1: Access Token Expired (Refresh Token Valid)
- **Behavior**: Token is automatically refreshed, request is retried
- **User Experience**: Seamless, no interruption

### Scenario 2: Refresh Token Also Expired
- **Behavior**: Session expiration modal appears
- **Message**: "Your session has expired. Please sign in again to continue."
- **User Experience**: Clear notification, smooth redirect

### Scenario 3: Missing Refresh Token
- **Behavior**: Session expiration modal appears immediately
- **Message**: "Authentication required. Please sign in to continue."
- **User Experience**: Immediate feedback

### Scenario 4: Token Refresh Network Error
- **Behavior**: Session expiration modal appears
- **Message**: "Unable to refresh your session. Please sign in again."
- **User Experience**: Clear error message

## Key Features

✅ **Automatic Detection**: No manual checks needed - works automatically on all API requests

✅ **User-Friendly**: Modal notification instead of silent redirect

✅ **SPA-Compatible**: Uses app navigation instead of hard page reloads

✅ **Event-Based**: Decoupled architecture using event system

✅ **Graceful Degradation**: Falls back to hard redirect if event system fails

✅ **Multiple Scenarios**: Handles various expiration scenarios with appropriate messages

✅ **Clean State Management**: Properly clears all auth data and state

## Testing Checklist

- [ ] Test with expired access token (valid refresh token)
- [ ] Test with expired refresh token
- [ ] Test with missing tokens
- [ ] Test token refresh network failure
- [ ] Test modal appearance and dismissal
- [ ] Test navigation to login screen
- [ ] Test auth state cleanup
- [ ] Test multiple concurrent API requests during expiration
- [ ] Test modal doesn't appear multiple times
- [ ] Test in different browser tabs (if applicable)

## Future Enhancements (Optional)

1. **Proactive Token Expiration Check**
   - Decode JWT to get expiration time
   - Check expiration before making requests
   - Refresh token proactively if close to expiration

2. **Session Timeout Warning**
   - Show warning modal before session expires
   - Allow user to extend session
   - Auto-refresh if user is active

3. **Remember Last Page**
   - Store current page before redirect
   - Redirect back after login

4. **Background Token Refresh**
   - Periodically refresh token in background
   - Prevent expiration during active use

## Files Modified

1. `src/components/common/SessionExpiredModal.tsx` (NEW)
2. `src/utils/sessionManager.ts` (NEW)
3. `src/services/api/apiClient.ts` (UPDATED)
4. `src/app/App.tsx` (UPDATED)

## Breaking Changes

**None** - This is a non-breaking enhancement. The system maintains backward compatibility and gracefully falls back to hard redirects if needed.

## Notes

- The modal uses z-index 9999 to ensure it appears above all content
- The event system prevents multiple simultaneous notifications
- All auth data is cleared from both localStorage and Zustand store
- Navigation uses the app's internal routing system, not window.location
