# Duplicate Requests Analysis & Fix

## Problem Identified

From the logs, I observed **two critical issues**:

### 1. Duplicate Requests
- **Two identical GET /api/v1/projects requests** sent at the exact same timestamp (13:32:53.952Z)
- Both requests get 401 errors
- Both trigger token refresh attempts
- This wastes resources and causes confusion

### 2. Cookie Issue (Root Cause of 401s)
- **Login response shows**: `"hasSetCookieHeader": false, "setCookieCount": 0`
- Backend requires **BOTH cookies AND Authorization headers**
- Only headers are being sent, so backend rejects requests
- This is why you get 401 even immediately after login

## Root Causes

### Duplicate Requests
1. **React.StrictMode** is enabled in `index.tsx` (line 15)
   - In development, StrictMode intentionally double-invokes effects
   - This causes `useEffect` to run twice, triggering duplicate requests

2. **useEffect dependency on fetchProjects**
   - `useEffect` depends on `fetchProjects` callback
   - If callback recreates, effect runs again
   - Combined with StrictMode, this causes duplicates

### Cookie Issue
1. **Backend not setting cookies**
   - Login response has no `Set-Cookie` header
   - Backend requires cookies for authentication
   - Without cookies, all requests fail with 401

2. **CORS/SameSite restrictions**
   - Even if cookies were set, they might not be sent cross-origin
   - Requires proper CORS configuration on backend

## Fixes Applied

### 1. Prevent Duplicate Requests
Added request deduplication in `ProjectsScreen.tsx`:

```typescript
// Track if a request is in progress
const requestInProgressRef = useRef(false);

const fetchProjects = useCallback(async (search?: string) => {
  // Prevent duplicate concurrent requests
  if (requestInProgressRef.current) {
    console.warn('[ProjectsScreen] Request already in progress, skipping duplicate');
    return;
  }

  requestInProgressRef.current = true;
  // ... rest of function
  // Reset flag in finally block
  requestInProgressRef.current = false;
}, []);
```

### 2. Improved useEffect
Changed dependency to prevent unnecessary re-runs:

```typescript
useEffect(() => {
  let isMounted = true;
  // ... load projects
  return () => {
    isMounted = false;
    // Cleanup
  };
  // Only run on mount, not when fetchProjects changes
}, []);
```

## What the Logs Show

### Login Success
```
[INFO] [API_RESPONSE] POST /api/v1/auth/log-in - 201
[INFO] [AUTH] Login response - cookie check
  "hasSetCookieHeader": false,  ← PROBLEM: No cookies set!
  "setCookieCount": 0
```

### Projects Request (Duplicate)
```
[INFO] [API_REQUEST] GET /api/v1/projects?page=1&limit=50  ← First request
[INFO] [API_REQUEST] GET /api/v1/projects?page=1&limit=50  ← Duplicate!
```

Both show:
- ✅ Authorization header present
- ✅ Email header present  
- ✅ withCredentials: true
- ❌ But still get 401 (because no cookies)

### Token Refresh Also Fails
```
[ERROR] [AUTH] Refresh token is invalid or expired
  "error": "request rejected, please re-authenticate"
```

Refresh token endpoint also requires cookies, which aren't being sent.

## Next Steps

### Immediate (Frontend)
✅ **Fixed**: Duplicate requests prevented
- Request deduplication added
- useEffect optimized

### Backend Required
❌ **Needs Fix**: Cookie configuration
1. **Set cookies during login:**
   ```javascript
   res.cookie('refreshToken', token, {
     httpOnly: true,
     secure: true, // or false for localhost
     sameSite: 'none', // for cross-origin
     maxAge: 7 * 24 * 60 * 60 * 1000,
     path: '/',
   });
   ```

2. **CORS must allow credentials:**
   ```javascript
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true, // CRITICAL
     allowedHeaders: ['Content-Type', 'Authorization', 'email'],
   }));
   ```

### Testing
After backend fixes:
1. Login should set cookies (check DevTools → Application → Cookies)
2. Projects request should include cookies (check Network → Request Headers → Cookie:)
3. Should no longer get 401 errors
4. Should only see ONE projects request (not duplicate)

## Summary

- ✅ **Fixed**: Duplicate requests (React StrictMode issue)
- ❌ **Needs Backend Fix**: Cookie setting and CORS configuration
- ✅ **Enhanced**: Logging to help debug cookie issues

The duplicate requests were a symptom, but the root cause is missing cookies. Once backend sets cookies properly, authentication should work.

