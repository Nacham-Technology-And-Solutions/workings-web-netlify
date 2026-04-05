# Social sign-in (OAuth)

This document describes the **Google** sign-in implementation on the API and how **Facebook** and **Apple** can be added later without redesigning the core model.

**Frontend (Google):** see [`frontend-oauth-google.md`](./frontend-oauth-google.md) for request/response examples, cookies, and CORS.

## Goals

- Let users sign in or register with Google using an **ID token** issued by Google (web or mobile SDKs).
- Keep **one user row** per person, with optional **multiple linked providers** via `OAuthAccount`.
- Reuse the same session mechanism as email/password auth: JWT access/refresh tokens and auth cookies.

---

## Database

### `User.password`

- Type: **nullable** (`String?` in Prisma).
- Email/password users: hashed password is stored.
- OAuth-only users: `null` until they set a password (e.g. via **forgot password**).

### `OAuthAccount`

| Field               | Purpose |
|--------------------|---------|
| `id`               | Primary key (UUID). |
| `provider`         | Provider id: `google`, later `facebook`, `apple`. |
| `providerAccountId`| Stable id from the provider (e.g. Google `sub`). |
| `userId`           | Foreign key to `User`. |

- **Unique** on `(provider, providerAccountId)` so the same Google account always maps to one link row.
- **Cascade delete** when the user is deleted.

### Migrations

- Migration that makes `User.password` nullable and creates `OAuthAccount` lives under `prisma/migrations/` (see `*_oauth_accounts_nullable_password`).

---

## Environment

| Variable | Required for Google | Description |
|----------|---------------------|-------------|
| `GOOGLE_OAUTH_CLIENT_IDS` | Yes | Comma-separated list of Google OAuth **client IDs** whose ID tokens the API will accept (e.g. web + Android + iOS clients). |

Example (illustrative only):

```env
GOOGLE_OAUTH_CLIENT_IDS=123456789-abc.apps.googleusercontent.com,123456789-def.apps.googleusercontent.com
```

Do not commit real client IDs or secrets; configure them per environment.

---

## API: Google sign-in

### Endpoint

`POST /api/v1/auth/oauth`

### Request body (Zod: `authSchema__oauth`)

```json
{
  "provider": "google",
  "idToken": "<JWT credential from Google Sign-In / GIS>",
  "companyName": "Optional — min 2 chars if provided"
}
```

- **`idToken`**: The **Google ID token** (not the OAuth access token alone). The backend verifies it with `google-auth-library` and checks the `aud` claim against `GOOGLE_OAUTH_CLIENT_IDS`.
- **`companyName`**: Optional. If omitted for a **new** user, the API defaults to `"Personal"` (meets existing length rules).

### Success responses

- **201**: New user created and signed in.
- **200**: Existing user (already linked by `OAuthAccount`) signed in.

Response shape aligns with registration/login: `userProfile`, `accessToken`, `refreshToken`, plus **`isNewUser`** (`true` | `false`).

### Error cases (summary)

| Situation | Typical HTTP | Notes |
|-----------|--------------|--------|
| Invalid or expired Google token, missing email in token, wrong audience | **401** | Verification failed. |
| Email already registered as a normal (password) account, no `OAuthAccount` yet | **409** | No auto-linking in v1; user signs in with password or you add a dedicated linking flow later. |
| `GOOGLE_OAUTH_CLIENT_IDS` not set | **500** | Server misconfiguration. |

### Email/password interactions

- **Login** (`POST /api/v1/auth/log-in`): If `User.password` is `null`, respond with **403** and a message that the account uses social sign-in (or forgot password to set one).
- **Change password**: If `password` is `null`, return a clear error; user can use **forgot password** to set an initial password.

---

## Server layout (Google)

| Area | Role |
|------|------|
| `src/domains/auth/schema/auth.schema.ts` | `authSchema__oauth` — discriminated union on `provider` (today only `google`). |
| `src/domains/auth/router/auth.router.ts` | Registers `POST /oauth`. |
| `src/domains/auth/controllers/auth.oauth.controller.ts` | Verifies token, calls sign-in service, issues tokens/cookies. |
| `src/domains/auth/services/oauth/types.ts` | `OAuthProvider`, `VerifiedOAuthProfile` (normalized profile after verification). |
| `src/domains/auth/services/oauth/verifyGoogleIdToken.ts` | Google ID token verification. |
| `src/domains/auth/services/oauth/completeOAuthSignIn.ts` | DB: find link, conflict on existing email, or create `User` + `OAuthAccount`. |
| `src/middlewares/validateData.middleware.ts` | Accepts `ZodTypeAny` on `body` so `discriminatedUnion` validates correctly. |
| `src/utils/errorHandlers/codedErrorHandlers.ts` | `errorHandler__409` for email conflicts. |

**Dependency:** `google-auth-library` (verifies Google JWTs).

---

## Normalized profile (`VerifiedOAuthProfile`)

After provider-specific verification, everything flows through **`completeOAuthSignIn`** using a single shape:

- `provider` — `google` \| `facebook` \| `apple` (as implemented).
- `providerAccountId` — stable subject id from that provider.
- `email` — normalized (lowercase trim).
- `emailVerified` — whether the provider asserts the email is verified.
- `name` — display name (fallbacks applied where needed).

New Facebook/Apple implementations should **only** add code that produces this structure (plus any extra fields you later decide to persist).

---

## Plan: Facebook

Facebook does **not** use the same “hand the API a JWT ID token” flow as Google in all setups; the usual pattern is:

1. Client completes Facebook Login and receives a **short-lived access token**.
2. API receives that token (over HTTPS).
3. API calls Facebook **Graph API** (e.g. `GET /me?fields=id,email,name`) with `access_token=...`.
4. Map response to `VerifiedOAuthProfile`:
   - `provider`: `'facebook'`
   - `providerAccountId`: Graph `id`
   - `email`, `name`, `emailVerified` (infer from Facebook behavior / app settings; email may be missing depending on permissions).

### Suggested steps

1. Add env vars, e.g. `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` (secret only on server if you implement code exchange; for token debug/app secret proof, follow [Meta’s current docs](https://developers.facebook.com/docs/facebook-login)).
2. Extend `authSchema__oauth` with a branch such as:
   - `provider: z.literal('facebook')`
   - `accessToken: z.string().min(1)` (or `userAccessToken` for clarity).
3. Add `verifyFacebookAccessToken.ts` (or similar) that returns `VerifiedOAuthProfile`.
4. In `auth.oauth.controller.ts`, branch on `req.body.provider` and call the right verifier, then always call `completeOAuthSignIn(profile, { companyName })`.
5. Decide product rules for **missing email** (Facebook can omit it): require email permission, prompt user, or block registration.

---

## Plan: Apple

Apple Sign In returns an **identity token** (JWT) and optionally a one-time `name` object on **first** authorization only.

1. Verify the Apple JWT using Apple’s **JWKS** and checks on `iss`, `aud` (Services ID / bundle id), and `exp`.
2. Map claims to `VerifiedOAuthProfile`:
   - `provider`: `'apple'`
   - `providerAccountId`: `sub`
   - `email`: from token if present; Apple may relay a private relay address.
   - `emailVerified`: from claim if present.
   - `name`: from token or from client-supplied first sign-in payload (not in JWT on later logins).

### Suggested steps

1. Env vars: e.g. `APPLE_CLIENT_IDS` (comma-separated allowed `aud` values), and team/bundle configuration per Apple’s docs.
2. Extend `authSchema__oauth` with:
   - `provider: z.literal('apple')`
   - `identityToken: z.string().min(1)`
   - Optional `name` / `givenName` / `familyName` for first-time profile completion.
3. Add `verifyAppleIdentityToken.ts` using `jose` or similar to validate JWT against Apple keys.
4. Reuse `completeOAuthSignIn`; handle **email only on first sign-in** if Apple does not send it again (you may need to persist it on first successful auth).

---

## Future: Account linking

Today, if an email already exists on a **password** account, Google sign-in returns **409**. A later feature can:

- Require the user to be **logged in** and call `POST /auth/oauth/link` with the provider token, or
- Use a verified-email flow to merge accounts safely.

That is intentionally out of scope for the first version.

---

## Client checklist (Google)

1. Create OAuth clients in Google Cloud Console; configure consent screen.
2. For each client platform, use the correct client ID (included in `GOOGLE_OAUTH_CLIENT_IDS`).
3. After sign-in, send the **credential ID token** to `POST /api/v1/auth/oauth` with `provider: "google"`.
4. Run DB migrations and set env on every deployment environment.

---

## Summary

| Provider | Credential sent to API | Verification approach |
|----------|-------------------------|------------------------|
| **Google** (done) | `idToken` | `google-auth-library` — `verifyIdToken`, audience = client ID(s). |
| **Facebook** (planned) | `accessToken` (typical) | Graph API `/me` (and optional token inspection). |
| **Apple** (planned) | `identityToken` (+ optional name on first sign-in) | JWT verify against Apple JWKS + `aud` / `iss` checks. |

All three should converge on **`VerifiedOAuthProfile`** and **`completeOAuthSignIn`** so user creation, conflicts, and session issuance stay in one place.
