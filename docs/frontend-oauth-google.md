# Frontend: Google sign-in with the Workings API

This guide explains how a web or mobile client should obtain a Google **ID token** and call the backend to sign the user in (or register them). Server-side details live in [`oauth-social-sign-in.md`](./oauth-social-sign-in.md).

---

## Endpoint

| Item | Value |
|------|--------|
| Method | `POST` |
| URL | `{API_BASE_URL}/api/v1/auth/oauth` |
| Auth | None (public) |
| Body | JSON |

`API_BASE_URL` is your deployed API origin (no trailing slash), e.g. `https://api.example.com`.

---

## Request body

```json
{
  "provider": "google",
  "idToken": "<Google credential JWT>",
  "companyName": "Optional — only if you collect it; min 2 characters"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `provider` | Yes | Must be exactly `"google"` today. |
| `idToken` | Yes | The **ID token** (JWT) from Google Sign-In / Google Identity Services — **not** the OAuth 2.0 access token alone. |
| `companyName` | No | If omitted on **first-time** sign-up, the API defaults to `"Personal"`. |

### Google Cloud setup (frontend team + backend team)

1. Create an **OAuth 2.0 Client ID** in Google Cloud Console for your platform (**Web application**, **Android**, or **iOS**).
2. Configure authorized JavaScript origins / redirect URIs per [Google’s docs](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
3. The **same client ID string** (e.g. `….apps.googleusercontent.com`) must be listed in the API env var **`GOOGLE_OAUTH_CLIENT_IDS`** (comma-separated if you use several clients). If it is missing, token verification fails.

---

## Getting `idToken` in the browser

Use **Google Identity Services** (GIS) or a thin wrapper.

### Google Identity Services (vanilla / any framework)

- Load the GIS script and use the **One Tap** or **Sign In With Google** button flow.
- In the callback you receive a **Credential**; use **`credential`** (or the parsed field your library exposes) as `idToken`. It is a JWT string starting with `eyJ…`.

Reference: [Sign in with Google for Web](https://developers.google.com/identity/gsi/web/guides/overview).

### React (`@react-oauth/google`)

- `GoogleLogin`’s `onSuccess` receives `credentialResponse.credential` — that value is your `idToken`.
- Or use the hook APIs that return the same JWT credential.

### Mobile (Android / iOS)

Use the platform Google Sign-In SDK; retrieve the **ID token** string from the sign-in result and send it in the JSON body. Ensure that app’s OAuth client ID is included in `GOOGLE_OAUTH_CLIENT_IDS` on the server.

---

## Calling the API from the SPA

### Headers and CORS

- Send **`Content-Type: application/json`**.
- If you rely on **cookies** for session (see below), send **`credentials: 'include'`** on `fetch` or **`withCredentials: true`** on Axios so the browser stores `Set-Cookie` headers.

The API enables CORS with **`credentials: true`**. Your frontend origin must be allowed (see server `FRONTEND_URL` / built-in dev origins such as `http://localhost:5173`). For cross-site cookies, production typically needs **HTTPS** on both API and app; local dev often uses non-secure cookies when `NODE_ENV` is not `production`.

### Example: `fetch`

```ts
async function signInWithGoogle(idToken: string, companyName?: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      provider: 'google',
      idToken,
      ...(companyName ? { companyName } : {})
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.responseMessage ?? data.error ?? res.statusText);
  }

  return data;
}
```

### Example: Axios

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

export async function signInWithGoogle(idToken: string, companyName?: string) {
  const { data } = await api.post('/api/v1/auth/oauth', {
    provider: 'google',
    idToken,
    ...(companyName ? { companyName } : {})
  });
  return data;
}
```

---

## Success responses

### HTTP status

| Status | Meaning |
|--------|---------|
| **200** | Existing user (Google account already linked) signed in. |
| **201** | New user created and signed in. |

### JSON shape

```json
{
  "responseMessage": "User signed in successfully | User registered successfully",
  "response": {
    "userProfile": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@gmail.com",
      "companyName": "Personal",
      "subscriptionStatus": "free",
      "isAdmin": false,
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2025-03-22T12:00:00.000Z",
      "updatedAt": "2025-03-22T12:00:00.000Z"
    },
    "accessToken": "<your-api-jwt>",
    "refreshToken": "<your-api-refresh-jwt>",
    "isNewUser": false
  }
}
```

Use **`response.isNewUser`** to route onboarding (e.g. ask for company name in UI and `PATCH` profile later, or show a welcome screen).

### Cookies (optional for your app)

On success the API also sets **httpOnly** cookies (if the client sent `credentials: 'include'`):

| Cookie name | Purpose |
|-------------|---------|
| `accessToken` | API access JWT |
| `refreshToken` | API refresh JWT |
| `MultiDB_NodeExpressTypescript_Template__Auth_Cookie` | Legacy session cookie used by existing middleware |

JavaScript **cannot** read httpOnly cookies. You can either:

- Store **`response.accessToken`** (and optionally refresh) in memory / secure storage and send `Authorization: Bearer <accessToken>` on API calls, **or**
- Rely on cookies for browser requests only (same pattern as email/password login).

Match whatever the rest of your app already does for `/auth/log-in`.

---

## Error responses

### Validation (400) — Zod

Invalid body (missing `idToken`, wrong `provider`, bad `companyName` length):

```json
{
  "error": "ZodError(input validation error)",
  "responseMessage": [ /* array of Zod issue objects */ ]
}
```

### Invalid Google token (401)

```json
{
  "responseMessage": "<reason, e.g. invalid token or missing email>",
  "error": "UNAUTHORIZED"
}
```

### Email already registered with password (409)

```json
{
  "responseMessage": "An account with this email already exists. Sign in with your password, or use account linking when it is available.",
  "error": "CONFLICT"
}
```

**UX:** Offer the normal email/password login flow or a “link account” flow when you build it.

### Server misconfiguration (500)

e.g. `GOOGLE_OAUTH_CLIENT_IDS` not set on the API.

---

## Checklist

- [ ] Google OAuth client created; origins / redirect URIs correct for your environment.
- [ ] Backend has **`GOOGLE_OAUTH_CLIENT_IDS`** including **this** client’s ID.
- [ ] Frontend sends the **ID token** JWT as `idToken`, not only the OAuth access token.
- [ ] `POST /api/v1/auth/oauth` with `Content-Type: application/json` and, if using cookies, **`credentials: 'include'`**.
- [ ] CORS: frontend origin allowed by the API.
- [ ] Handle **409** for existing email and **401** for bad/expired tokens.
- [ ] Use **`isNewUser`** for first-time UX.

---

## Related

- Backend overview and Facebook/Apple plans: [`oauth-social-sign-in.md`](./oauth-social-sign-in.md)
