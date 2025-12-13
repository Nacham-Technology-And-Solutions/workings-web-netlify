# Authentication Issue Analysis: Token Expiration on Projects Page

## Problem
When accessing the application from a remote PC via IP address (e.g., `192.168.1.198:5000`), users get logged out immediately when opening the projects page, even though tokens are valid for 1 hour.

## Root Cause

The backend API requires **BOTH** of the following for authentication:
1. **Authorization Header**: `Bearer <accessToken>` (stored in localStorage)
2. **HTTP Cookies**: Set by the backend during login (stored by browser)

### Why It Fails on Remote IP

When accessing from a remote IP address, cookies may not be sent with requests due to:

1. **SameSite Cookie Restrictions**: Modern browsers restrict cross-site cookies. If the frontend and backend are on different origins (even different IPs), cookies might not be sent.

2. **Domain Mismatch**: Cookies set by the backend might be scoped to a specific domain (e.g., `localhost` or a specific IP), and won't be sent when accessing from a different origin.

3. **CORS Cookie Issues**: Even with `withCredentials: true`, if the backend doesn't properly configure CORS to allow credentials from the remote IP origin, cookies won't be sent.

## Evidence

From the error logs:
```
GET http://192.168.1.198:5000/api/v1/projects?page=1&limit=50 401 (Unauthorized)
POST http://192.168.1.198:5000/api/v1/auth/refresh-token 401 (Unauthorized)
Refresh token is invalid or expired
```

The 401 errors occur immediately, not after token expiration, indicating:
- Tokens exist in localStorage (otherwise we'd see different errors)
- Authorization headers are being sent (request reaches backend)
- **Cookies are likely NOT being sent** (backend rejects due to missing cookies)

## Solution

### Option 1: Backend Configuration (Recommended)

The backend needs to ensure cookies are properly configured for cross-origin requests:

1. **Set proper cookie attributes**:
   ```
   Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=None; Path=/
   ```

2. **Configure CORS to allow credentials from remote IPs**:
   ```javascript
   // Backend CORS config
   Access-Control-Allow-Origin: http://192.168.1.198:3000  // or specific origin
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Headers: Content-Type, Authorization, email
   ```

3. **For development with multiple IPs**, consider:
   - Using a wildcard or allowing multiple origins
   - Or using a reverse proxy to keep same origin

### Option 2: Frontend Workaround (If backend can't be changed)

If the backend cannot be modified, we could:

1. **Verify cookie availability** before making requests
2. **Show user-friendly error** explaining cookie requirements
3. **Fallback to token-only auth** (if backend supports it)

However, this is not recommended as it requires backend changes anyway.

### Option 3: Use Same Origin (Best for Development)

For local development:
- Use Vite proxy (already configured) to keep same origin
- Access frontend via `http://localhost:3000` (uses proxy to backend)
- This ensures cookies work correctly

## Debugging

Added debug logging in `apiClient.ts` to help identify the issue:

- Logs token availability on each request (dev mode only)
- Logs detailed 401 error information
- Warns if cookies might not be sent

Check browser console for:
- `[API Request]` logs showing token status
- `[API 401 Error]` logs showing what's missing

## Verification Steps

1. **Check if cookies are being set**:
   - Open DevTools → Application → Cookies
   - After login, verify cookies exist for the backend domain

2. **Check if cookies are being sent**:
   - Open DevTools → Network tab
   - Check request headers for `Cookie:` header
   - If missing, cookies aren't being sent

3. **Check CORS headers**:
   - In Network tab, check response headers
   - Verify `Access-Control-Allow-Credentials: true`
   - Verify `Access-Control-Allow-Origin` matches your origin

## Next Steps

1. **Backend Team**: Verify cookie configuration and CORS settings
2. **Test**: Access from remote IP and check browser console/network tab
3. **Fix**: Either fix backend cookie/CORS config OR use same-origin setup (proxy)

## Files Modified

- `src/services/api/apiClient.ts`: Added debug logging for authentication issues

