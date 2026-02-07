# Backend Cookie Configuration Requirements

## Problem Statement

The frontend application is experiencing 401 Unauthorized errors immediately after successful login. Analysis of the authentication flow reveals that cookies are not being set by the backend during the login process.

### Current Behavior

1. **Login Request**: Frontend sends login credentials → Backend responds with 201 status
2. **Login Response**: Backend returns tokens in response body (accessToken, refreshToken)
3. **Missing Cookies**: No `Set-Cookie` headers in login response
4. **Subsequent Requests**: Frontend sends Authorization header with token, but backend rejects with 401
5. **Error Message**: "request rejected, please re-authenticate"

### Evidence from Frontend Logs

```
[INFO] [API_RESPONSE] POST /api/v1/auth/log-in - 201
[INFO] [AUTH] Login response - cookie check
  "hasSetCookieHeader": false,  ← PROBLEM: No cookies being set
  "setCookieCount": 0
```

---

## Requirements

The backend authentication system must be configured to:

1. **Set HTTP-only cookies** during login response
2. **Configure CORS** to allow credentials from frontend origin
3. **Accept authentication from both cookies and Authorization headers**
4. **Set cookies during token refresh**
5. **Clear cookies during logout**

---

## Required Changes

### 1. Login Endpoint (`POST /api/v1/auth/log-in`)

**Expected Behavior:**
- Continue returning tokens in response body (for frontend storage)
- **Additionally set HTTP-only cookies** in response headers

**Required Cookie Attributes:**
- `refreshToken` cookie with refresh token value
- `accessToken` cookie with access token value (optional, but recommended)
- `httpOnly: true` (security requirement)
- `sameSite: 'none'` (required for cross-origin requests)
- `secure: false` for development/localhost, `true` for production
- `path: '/'` (available for all paths)
- Appropriate `maxAge` matching token expiration times

**Expected Response Headers:**
```
Set-Cookie: refreshToken=<token>; HttpOnly; SameSite=None; Path=/; Max-Age=604800
Set-Cookie: accessToken=<token>; HttpOnly; SameSite=None; Path=/; Max-Age=3600
```

**Verification:**
- Frontend will check for `Set-Cookie` header in login response
- Browser DevTools → Application → Cookies should show cookies after login

---

### 2. CORS Configuration

**Required CORS Headers:**
- `Access-Control-Allow-Origin`: Must match frontend origin exactly (not `*`)
- `Access-Control-Allow-Credentials: true` (CRITICAL - must be `true`)
- `Access-Control-Allow-Headers`: Must include `Content-Type`, `Authorization`, `email`
- `Access-Control-Allow-Methods`: Must include all HTTP methods used
- `Access-Control-Expose-Headers`: Should include `Set-Cookie` (optional but helpful)

**Allowed Origins:**
- Development: `http://localhost:3000`
- Production: `https://glazeworkings.netlify.app`
- Any other frontend deployment URLs

**Important Notes:**
- When `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Origin` cannot be `*`
- Must specify exact origin(s) or use origin whitelist
- Preflight OPTIONS requests must also return these headers

---

### 3. Authentication Middleware

**Expected Behavior:**
- Accept authentication from **BOTH** sources:
  1. HTTP-only cookies (primary)
  2. Authorization header with Bearer token (fallback)
- Require `email` header for all authenticated requests
- Return 401 if neither cookies nor Authorization header provide valid token

**Current Error Message:**
```
"email or authorization header missing on request"
```

**Expected Behavior:**
- Check cookies first, then Authorization header
- If either provides valid token + email header, allow request
- If both missing or invalid, return 401

---

### 4. Refresh Token Endpoint (`POST /api/v1/auth/refresh-token`)

**Expected Behavior:**
- Accept refresh token from **BOTH** cookies and Authorization header
- Validate refresh token
- Generate new access and refresh tokens
- **Set new cookies** in response (update existing cookies)
- Return new tokens in response body

**Required Response:**
- Set new `refreshToken` cookie
- Set new `accessToken` cookie
- Return tokens in response body (for frontend storage sync)

---

### 5. Logout Endpoint (`POST /api/v1/auth/log-out`)

**Expected Behavior:**
- Clear/invalidate refresh token
- **Clear cookies** by setting them with `Max-Age=0` or `Expires` in past
- Return success response

**Required Response Headers:**
```
Set-Cookie: refreshToken=; HttpOnly; SameSite=None; Path=/; Max-Age=0
Set-Cookie: accessToken=; HttpOnly; SameSite=None; Path=/; Max-Age=0
```

---

## Frontend Expectations

### What Frontend Sends

**Login Request:**
- `POST /api/v1/auth/log-in`
- Body: `{ email, password }`
- Headers: `Content-Type: application/json`
- `withCredentials: true` (cookies enabled)

**Authenticated Requests:**
- Authorization header: `Bearer <accessToken>`
- Email header: `<userEmail>`
- `withCredentials: true` (cookies enabled)
- Cookies automatically sent by browser

**Refresh Token Request:**
- `POST /api/v1/auth/refresh-token`
- Authorization header: `Bearer <refreshToken>`
- Email header: `<userEmail>`
- `withCredentials: true`
- Cookies automatically sent by browser

### What Frontend Expects to Receive

**Login Response:**
- Status: 201
- Body: `{ responseMessage, response: { accessToken, refreshToken, userProfile } }`
- **Headers: `Set-Cookie` with refreshToken and accessToken** ← CRITICAL

**Authenticated Request Response:**
- Status: 200/201 (not 401)
- Valid response data
- Cookies automatically sent with request (browser handles this)

**Refresh Token Response:**
- Status: 200
- Body: `{ response: { accessToken, refreshToken } }`
- **Headers: `Set-Cookie` with updated tokens** ← CRITICAL

---

## Testing & Verification

### Test 1: Login Response Headers

**Frontend Test:**
1. Open browser DevTools → Network tab
2. Perform login
3. Check login response headers
4. **Expected**: `Set-Cookie` header present with refreshToken and accessToken

**Verification:**
- Frontend logs will show: `"hasSetCookieHeader": true, "setCookieCount": 2`
- Browser DevTools → Application → Cookies will show cookies for backend domain

### Test 2: Cookie Persistence

**Frontend Test:**
1. After login, check DevTools → Application → Cookies
2. **Expected**: Cookies visible for backend domain
3. Navigate to projects page
4. Check Network tab → projects request → Request Headers
5. **Expected**: `Cookie:` header present with token values

**Verification:**
- Projects request should succeed (200, not 401)
- Frontend logs will show successful response

### Test 3: CORS Headers

**Frontend Test:**
1. Check any API response headers
2. **Expected**: 
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Origin: <frontend-url>` (exact match, not `*`)

**Verification:**
- No CORS errors in browser console
- Cookies are sent with requests

### Test 4: Token Refresh

**Frontend Test:**
1. Wait for access token to expire (or manually trigger refresh)
2. Check refresh token request
3. **Expected**: 
   - Request includes cookies
   - Response includes `Set-Cookie` headers with new tokens
   - New tokens in response body

**Verification:**
- Refresh succeeds (200, not 401)
- New cookies set in browser
- Subsequent requests use new tokens

### Test 5: Logout

**Frontend Test:**
1. Perform logout
2. Check logout response headers
3. **Expected**: `Set-Cookie` headers clearing cookies (`Max-Age=0`)
4. Check DevTools → Application → Cookies
5. **Expected**: Cookies removed

**Verification:**
- Cookies cleared from browser
- Subsequent requests fail with 401 (expected)

---

## Success Criteria

The fix is successful when:

✅ **Login Response:**
- Returns 201 status
- Includes `Set-Cookie` headers in response
- Cookies visible in browser DevTools

✅ **Subsequent Requests:**
- Projects request succeeds (200, not 401)
- Request includes `Cookie:` header
- No "request rejected, please re-authenticate" errors

✅ **Token Refresh:**
- Refresh token request succeeds
- New cookies set in response
- Subsequent requests use new tokens

✅ **CORS:**
- No CORS errors in browser console
- `Access-Control-Allow-Credentials: true` in all responses
- Cookies sent with all requests

---

## Common Issues to Avoid

### Issue 1: Cookies Not Set
**Symptom:** Login succeeds but no cookies in browser
**Cause:** Backend not setting `Set-Cookie` headers
**Solution:** Ensure login endpoint sets cookies in response

### Issue 2: Cookies Not Sent
**Symptom:** Cookies exist but not sent with requests
**Cause:** CORS not configured for credentials
**Solution:** Set `Access-Control-Allow-Credentials: true` and match origin exactly

### Issue 3: CORS Preflight Fails
**Symptom:** OPTIONS request fails
**Cause:** Preflight not handled or wrong headers
**Solution:** Handle OPTIONS requests and return proper CORS headers

### Issue 4: SameSite Cookie Restrictions
**Symptom:** Cookies set but not sent cross-origin
**Cause:** `SameSite` attribute too restrictive
**Solution:** Use `SameSite=None` with `Secure=true` (or `Secure=false` for localhost)

### Issue 5: Secure Cookie on HTTP
**Symptom:** Cookies not set in development
**Cause:** `Secure=true` but using HTTP
**Solution:** Use `Secure=false` for localhost/development

---

## Environment Considerations

### Development (localhost)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000` (or configured port)
- Cookie `secure`: `false` (HTTP allowed)
- Cookie `sameSite`: `none` (cross-origin)

### Production
- Frontend: `https://glazeworkings.netlify.app`
- Backend: Production URL
- Cookie `secure`: `true` (HTTPS only)
- Cookie `sameSite`: `none` (cross-origin)

---

## Frontend Monitoring

The frontend has enhanced logging that will help verify the fix:

**Login Response Check:**
- Logs will show: `"hasSetCookieHeader": true/false`
- Logs will show: `"setCookieCount": <number>`

**Request Authentication:**
- Logs will show: `"hasAccessToken": true/false`
- Logs will show: `"withCredentials": true/false`

**After Fix:**
- Login logs should show: `"hasSetCookieHeader": true, "setCookieCount": 2`
- Projects request should succeed (200, not 401)
- No more "request rejected, please re-authenticate" errors

---

## Summary

**Critical Requirements:**
1. Set HTTP-only cookies during login response
2. Configure CORS to allow credentials (`Access-Control-Allow-Credentials: true`)
3. Accept authentication from both cookies and Authorization headers
4. Set cookies during token refresh
5. Clear cookies during logout

**Expected Results:**
- Login response includes `Set-Cookie` headers
- Cookies visible in browser DevTools
- Subsequent requests include `Cookie:` header
- Requests succeed (200, not 401)
- No CORS errors

**Testing:**
- Verify `Set-Cookie` header in login response
- Verify cookies in browser DevTools
- Verify `Cookie:` header in subsequent requests
- Verify requests succeed without 401 errors

Once these requirements are met, the frontend authentication flow should work correctly.

