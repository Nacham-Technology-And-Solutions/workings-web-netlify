# Frontend: ZodError (Input Validation Error) Reference

This document helps the frontend identify and handle **ZodError** responses from the API so you can show clear, user-friendly validation messages.

---

## 1. How to Identify a ZodError Response

When the API returns **input validation errors**, the response looks like this:

- **HTTP status:** `400 Bad Request`
- **Response body:**

```json
{
  "error": "ZodError(input validation error)",
  "responseMessage": [
    {
      "code": "invalid_type",
      "path": ["plan"],
      "message": "Plan must be one of: free, starter, pro, enterprise"
    },
    {
      "code": "too_small",
      "path": ["customerName"],
      "message": "Customer name is required"
    }
  ]
}
```

**Detection logic (pseudo-code):**

```ts
if (response.status === 400 && response.data?.error === 'ZodError(input validation error)') {
  const issues = response.data.responseMessage; // array of validation issues
  // Show issues to user (e.g. map path + message to field labels)
}
```

---

## 2. Shape of `responseMessage` (Zod issues)

`responseMessage` is an **array of issue objects**. Each issue has:

| Property   | Type               | Description |
|-----------|--------------------|-------------|
| `code`    | `string`           | Zod issue code, e.g. `invalid_type`, `too_small`, `too_big`, `invalid_string`, `invalid_enum_value`, `custom` |
| `path`    | `(string \| number)[]` | Path to the invalid field (e.g. `["body", "items", 0, "quantity"]` for first item’s quantity) |
| `message` | `string`           | Human-readable message from the backend (safe to show to users; prefer this for UX) |

**Tip:** Prefer displaying `message` to the user. Use `path` to attach the message to the correct form field (e.g. `path.join('.')` or map to your field names).

---

## 3. Validation Errors by Domain

Below are the **field paths** and **messages** the API can return, grouped by feature. Use this to map backend paths to your form labels or to build a lookup for user-friendly text.

---

### 3.1 Subscriptions

| Path (body/params/query) | Possible messages |
|--------------------------|-------------------|
| `plan` | Plan must be one of: free, starter, pro, enterprise |
| `plan` (upgrade) | Plan must be one of: starter, pro, enterprise for upgrade |
| `plan` (downgrade) | Plan must be one of: free, starter, pro for downgrade |
| `billingCycle` | Billing cycle must be either "monthly" or "yearly" |
| `paymentProvider` | Payment provider must be one of: paystack, flutterwave, monnify |
| `reason` | Reason must be less than 500 characters |
| `reference` | Payment reference is required |
| `provider` | Payment provider must be one of: paystack, flutterwave, monnify |

---

### 3.2 Quotes

| Path | Possible messages |
|------|-------------------|
| `quoteType` | Quote type must be either "from_project" or "standalone" |
| `customerName` | Customer name is required; Customer name must be less than 200 characters |
| `customerAddress` | Customer address must be less than 500 characters |
| `customerEmail` | Invalid email address; Email must be less than 200 characters |
| `items` | At least one item is required |
| `items[].description` | Description is required |
| `items[].quantity` | Quantity must be positive |
| `items[].unitPrice` | Unit price must be non-negative |
| `items[].totalPrice` | Total price must be non-negative |
| `subtotal` | Subtotal must be non-negative |
| `tax` | Tax must be non-negative |
| `total` | Total must be non-negative |
| `status` | Must be one of: draft, sent, accepted, rejected |
| Query: `page` | Positive integer (default 1) |
| Query: `limit` | Positive integer, max 100 (default 20) |

---

### 3.3 Projects

| Path | Possible messages |
|------|-------------------|
| `projectName` | Project name is required; max 200 characters |
| `siteAddress` | Site address is required; max 500 characters |
| `customer.name` | Customer name is required; max 200 characters |
| `customer.email` | Invalid email address |
| `customer.phone` | max 50 characters |
| `customer.address` | max 500 characters |
| `glazingDimensions[].glazingCategory` | Glazing category must be one of: Window, Door, Net, Partition, Curtain Wall |
| `glazingDimensions[].glazingType` | Glazing type is required |
| `glazingDimensions[].moduleId` | Module ID is required |
| `calculationSettings.stockLength` | Stock length must be 6 or 5.58 meters |
| Query: `status` | draft, calculated, archived |
| Query: `page`, `limit` | page ≥ 1; limit 1–100 |

---

### 3.4 Saved templates

| Path | Possible messages |
|------|-------------------|
| `id` (params) | Must be a valid UUID |
| `name` | Name is required; Name must be less than 100 characters |
| `type` | Must be one of: quoteFormat, pdfExport, full |
| `quoteFormat` | quoteFormat is required when type is quoteFormat; quoteFormat is required when type is full; quoteFormat is not allowed when type is pdfExport |
| `pdfExport` | pdfExport is required when type is pdfExport; pdfExport is required when type is full; pdfExport is not allowed when type is quoteFormat |

Nested template config (quoteFormat / pdfExport) uses the same rules as **Templates** below (e.g. hex colors, max lengths, enums).

---

### 3.5 Templates (quote format, PDF export, payment methods, material prices)

| Path (nested under quoteFormat / pdfExport etc.) | Possible messages |
|--------------------------------------------------|-------------------|
| `header.companyName` | Company name must be less than 255 characters |
| `header.tagline` | Tagline must be less than 255 characters |
| `header.logoUrl` | Valid URL or null |
| `header.alignment` | left, center, right |
| `footer.content` | Footer content must be less than 500 characters |
| `footer.alignment`, `footer.visible` | left/center/right; boolean |
| `colors.primary`, `colors.secondary`, `colors.accent` | Must be valid hex (e.g. #RRGGBB) |
| `typography.fontFamily` | max 100 characters |
| `typography.headingSize`, `typography.bodySize` | Integer 1–100 |
| `page.orientation` | portrait, landscape |
| `page.margins.*` | 0–100 |
| `page.sectionSpacing` | 0–50 |
| Payment: `accountName` | Account name is required; max 255 characters |
| Payment: `accountNumber` | Account number is required; max 50 characters |
| Payment: `bankName` | Bank name is required; max 100 characters |
| Payment: `customInstructions` | Custom instructions must be less than 500 characters |
| PDF: `pageSize` | A4, Letter, Legal, A3, Custom |
| PDF: `headingColor`, `bodyColor` | Must be valid hex color |
| Material price: `name` | Name is required; max 255 characters |
| Material price: `unit` | Unit is required; max 50 characters |
| Material price: `unitPrice` | Unit price must be non-negative |

---

### 3.6 Admin

| Path | Possible messages |
|------|-------------------|
| `userId` (params) | Invalid ObjectId; Invalid Postgres ID - must be a positive number; Invalid ID format - must be either a valid MongoDB ObjectId or a positive number |
| `provider` (params) | paystack, flutterwave, monnify |
| `body.providers` | Array of paystack/flutterwave/monnify, min 1 item |
| User body (deactivate): `name`, `email`, `companyName`, `password` | Same as User schema (required, format, length) |

---

### 3.7 Accessories catalog

| Path | Possible messages |
|------|-------------------|
| `name` | Name is required; Name must be less than 200 characters |
| `category` | Category is required; Category must be less than 50 characters |
| `unit` | Unit must be one of: pc, meter, set, roll, sheet |
| `defaultUnitPrice` | Price must be non-negative |
| `priceHistory[].price` | Must be positive |
| `priceHistory[].date` | Valid datetime string or date |
| Query: `page`, `limit` | page ≥ 1; limit 1–100 |

---

### 3.8 Calculations

| Path | Possible messages |
|------|-------------------|
| `projectCart` | Project Cart must contain at least one item |
| `projectCart[].module_id` | Module ID is required |
| `projectCart[].W`, `H`, `N`, `O`, `qty`, etc. | Positive numbers / integers as per schema |
| `settings.stockLength` | Stock length must be 6 or 5.58 meters |

---

### 3.9 Query params: projectId (material list, cutting list, glass cutting list)

| Path | Possible messages |
|------|-------------------|
| `projectId` | Must match digits only (e.g. `^\d+$`) when provided |

---

### 3.10 User (auth / profile / admin body)

| Path | Possible messages |
|------|-------------------|
| `name` | Name is required.; min 2, max 100 |
| `email` | Email is required.; Please provide a valid email address; Email cannot contain spaces |
| `password` | Password is required.; min 8, max 100; must contain uppercase, lowercase, number, special character |
| `companyName` | Company name is required.; min 2, max 100 |

---

## 4. Suggested Frontend Handling

1. **Detect:** `status === 400 && data.error === 'ZodError(input validation error)'`.
2. **Read:** `data.responseMessage` (array of `{ code, path, message }`).
3. **Display:** For each issue, show `message` next to the field that matches `path` (e.g. map `["customerName"]` → “Customer name”, `["items", 0, "quantity"]` → “Item 1 – Quantity”).
4. **Fallback:** If you don’t map a path, show the raw `message`; it’s already user-oriented.

Example (conceptual):

```ts
function getValidationErrors(response: ApiErrorResponse): ValidationIssue[] {
  if (response.status !== 400 || response.data?.error !== 'ZodError(input validation error)') {
    return [];
  }
  return (response.data.responseMessage || []).map((issue: { path: (string | number)[]; message: string }) => ({
    field: issue.path.join('.'),
    message: issue.message
  }));
}
```

---

## 5. Zod issue codes (for optional logic)

You can use `code` for custom UX (e.g. highlight required vs format errors):

| Code | Typical meaning |
|------|------------------|
| `invalid_type` | Wrong type (e.g. string instead of number) |
| `too_small` | Min length, min value, or non-empty violation |
| `too_big` | Max length or max value |
| `invalid_string` | Format (email, url, regex e.g. UUID, hex) |
| `invalid_enum_value` | Value not in allowed enum |
| `custom` | Custom/superRefine message (e.g. saved template type rules) |

---

## 6. Frontend implementation (in place)

The app implements the suggested handling as follows:

- **Detection:** `src/utils/validationErrors.ts` — `isZodErrorResponse(data)` and `getValidationIssues(error)`.
- **Error message:** `src/utils/errorHandler.ts` — `extractErrorMessage()` treats `400` + `error === 'ZodError(input validation error)'` and `responseMessage` array: returns a summary message and full list as `detailedMessage`. `extractFieldErrors()` fills from validation issues so field-level errors are available.
- **UI:** `src/components/common/ValidationErrorAlert.tsx` — shows a dismissible list of validation messages (used on auth screens). `ErrorMessage` shows general error + expandable “Read more” for `detailedMessage`.
- **Auth:** Login, Registration, Forgot Password, Reset Password use `getValidationIssues()`, map path → field with `authPathToField` / `resetPasswordPathToField`, set inline field errors, and show `ValidationErrorAlert` when there are validation issues.
- **Other flows:** Profile, Templates, and other API calls use `extractErrorMessage()` so ZodError responses show a clear message and expandable details where `ErrorMessage` is used.

*Generated from backend Zod schemas. Update this doc when new validated endpoints or fields are added.*
