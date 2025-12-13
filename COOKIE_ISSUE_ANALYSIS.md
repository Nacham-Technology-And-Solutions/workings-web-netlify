# Cookie Issue Analysis - 401 Unauthorized After Login

## Problem

User logs in successfully, but immediately gets 401 Unauthorized errors when accessing the projects page. The refresh token also fails with 401.

## Root Cause

Based on the error logs and code analysis, the issue is that **the backend requires BOTH cookies AND Authorization headers**, but cookies are not being sent with requests.

### Evidence from Logs

```
[2025-12-13T13:24:53.470Z] [ERROR] [API_ERROR] GET /api/v1/projects?page=1&limit=50
  "error": {
    "status": 401,
    "data": {
      "responseMessage": "request rejected, please re-authenticate",
      "error": "UNAUTHORIZED"
    }
  }

[2025-12-13T13:24:53.477Z] [ERROR] [AUTH] Refresh token is invalid or expired
```

The 401 happens immediately after login, and the refresh token also fails, indicating:
1. Tokens ARE being stored (otherwise refresh wouldn't be attempted)
2. Authorization headers ARE being sent (request reaches backend)
3. **Cookies are likely NOT being sent** (backend rejects due to missing cookies)

## Why Cookies Aren't Being Sent

### Possible Causes

1. **CORS Cookie Restrictions**
   - Backend sets cookies during login
   - But CORS policy prevents cookies from being sent cross-origin
   - Even with `withCredentials: true`, if backend doesn't allow credentials, cookies won't be sent

2. **SameSite Cookie Restrictions**
   - Modern browsers restrict cross-site cookies
   - If frontend and backend are on different origins (even different ports), cookies might not be sent
   - Cookies need `SameSite=None; Secure` to work cross-origin

3. **Cookie Domain/Path Mismatch**
   - Cookies set by backend might be scoped to wrong domain/path
   - Won't be sent if request doesn't match cookie scope

4. **Cookie Not Set During Login**
   - Backend might not be setting cookies in login response
   - Or cookies are being set but immediately cleared

## Solutions

### Solution 1: Verify Cookie Setting (Immediate)

Add logging to verify if cookies are being set during login:

1. Check browser DevTools → Application → Cookies after login
2. Check Network tab → Login request → Response Headers for `Set-Cookie`
3. Check Network tab → Projects request → Request Headers for `Cookie:`

### Solution 2: Backend Cookie Configuration (Recommended)

The backend needs to ensure cookies are properly configured:

```javascript
// Backend should set cookies like this:
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'none', // Allow cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  domain: '.yourdomain.com' // Or omit for current domain
});
```

### Solution 3: CORS Configuration

Backend CORS must allow credentials:

```javascript
// Backend CORS config
app.use(cors({
  origin: 'http://localhost:3000', // Or your frontend URL
  credentials: true, // CRITICAL: Must be true
  allowedHeaders: ['Content-Type', 'Authorization', 'email'],
}));
```

### Solution 4: Use Same Origin (Development)

For local development, use Vite proxy to keep same origin:

```typescript
// vite.config.ts - Already configured
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
}
```

Then access frontend via `http://localhost:3000` (not IP address).

### Solution 5: Verify Request Headers

Add enhanced logging to verify what's being sent:

```typescript
// In apiClient.ts request interceptor
logger.debug('API_REQUEST', 'Request details', {
  url: config.url,
  hasAccessToken: !!accessToken,
  hasUserEmail: !!userEmail,
  withCredentials: config.withCredentials,
  // Note: Can't check cookies directly, but can verify withCredentials
});
```

## Debugging Steps

1. **Check if cookies exist after login:**
   - Open DevTools → Application → Cookies
   - Look for cookies from your backend domain
   - If missing, cookies aren't being set

2. **Check if cookies are being sent:**
   - Open DevTools → Network tab
   - Find the projects request
   - Check Request Headers for `Cookie:` header
   - If missing, cookies aren't being sent

3. **Check login response:**
   - Open DevTools → Network tab
   - Find the login request
   - Check Response Headers for `Set-Cookie:` header
   - If missing, backend isn't setting cookies

4. **Check CORS headers:**
   - In Network tab, check response headers
   - Look for `Access-Control-Allow-Credentials: true`
   - Look for `Access-Control-Allow-Origin` matching your origin
   - If missing or wrong, CORS is blocking cookies

## Immediate Workaround

If cookies can't be fixed immediately, you could:

1. **Verify token is being sent correctly:**
   - Check logs to confirm Authorization header is present
   - Check token value is correct (not null/undefined)

2. **Check if backend accepts token-only auth:**
   - Some backends have fallback to token-only if cookies missing
   - But this backend seems to require both

3. **Use same-origin setup:**
   - Use Vite proxy (already configured)
   - Access via `localhost:3000` instead of IP address
   - This keeps same origin, so cookies work

## Next Steps

1. **Backend Team**: Verify cookie configuration and CORS settings
2. **Test**: Check browser DevTools to see if cookies exist and are being sent
3. **Fix**: Either fix backend cookie/CORS config OR use same-origin setup

## Enhanced Logging Added

I've added enhanced logging to help debug:
- Logs request details for projects requests
- Logs login response to check for Set-Cookie headers
- Logs cookie-related information (what we can access)

Check the logs after login to see:
- If access token exists when making projects request
- If Set-Cookie header is present in login response
- Request configuration details

