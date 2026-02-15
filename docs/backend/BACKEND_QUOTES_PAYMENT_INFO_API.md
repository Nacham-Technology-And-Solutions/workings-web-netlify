# Backend API Update: Quote Payment Information

## Purpose

The frontend collects **payment information** (bank account details) on the "Extras & Notes" step when creating or editing a quote. This data must be stored with the quote and returned when a quote is fetched so that:

- The **Quote Details** screen can display Account Name, Account Number, and Bank Name.
- **PDF export** can include payment details on the quote document.

Currently, the quotes API does not accept or return these fields, so payment details are lost after a quote is saved.

---

## Required Changes

### 1. Accept payment info on **Create** and **Update** quote

Add an optional **`paymentInfo`** object to the request body for:

- **`POST /api/v1/quotes`** (create quote)
- **`PATCH /api/v1/quotes/:id`** (update quote)

#### Request body addition

| Field | Type | Required | Validation | Description |
|--------|------|----------|------------|-------------|
| `paymentInfo` | object | No | See below | Bank account details for the quote. Omit or send `null` if not provided. |
| `paymentInfo.accountName` | string | No* | Max 255 characters | Name on the bank account. |
| `paymentInfo.accountNumber` | string | No* | Max 50 characters | Bank account number. |
| `paymentInfo.bankName` | string | No* | Max 100 characters | Name of the bank. |

\* If `paymentInfo` is present, all three sub-fields can be optional to allow partial updates; when storing, persist whatever is sent.

**Example – create/update request body (new fields only):**

```json
{
  "quoteType": "standalone",
  "customerName": "Justin",
  "customerAddress": "Saint Lucia Convention Center, Castries, Saint Lucia",
  "customerEmail": "justin@example.com",
  "items": [...],
  "subtotal": 290000,
  "tax": 0,
  "total": 290000,
  "status": "draft",
  "paymentInfo": {
    "accountName": "Precious Ebubechukwu",
    "accountNumber": "120213123324",
    "bankName": "Zenith Bank"
  }
}
```

**Backend behavior:**

- **Create:** If `paymentInfo` is present, validate and store it with the quote. If omitted or `null`, store `null`/empty for payment info.
- **Update (PATCH):** If `paymentInfo` is present, validate and update the stored payment info (full replace). If omitted, leave existing payment info unchanged. If `paymentInfo: null` is sent, clear stored payment info.
- **Validation (when `paymentInfo` is provided):**
  - `accountName`: optional string, max 255 characters.
  - `accountNumber`: optional string, max 50 characters.
  - `bankName`: optional string, max 100 characters.

---

### 2. Return payment info on **Get** quote(s)

Include **`paymentInfo`** on the quote object in responses for:

- **`GET /api/v1/quotes/:id`** (single quote)
- **`GET /api/v1/quotes`** (list quotes) – each quote in the list should include `paymentInfo` if available.

#### Response shape addition

Add to the quote object returned by the API:

| Field | Type | Description |
|--------|------|-------------|
| `paymentInfo` | object \| null | Payment details, or `null` if none stored. |
| `paymentInfo.accountName` | string | Account name (empty string if not set). |
| `paymentInfo.accountNumber` | string | Account number (empty string if not set). |
| `paymentInfo.bankName` | string | Bank name (empty string if not set). |

**Example – quote response fragment:**

```json
{
  "response": {
    "id": 1,
    "userId": 1,
    "projectId": null,
    "quoteType": "standalone",
    "customerName": "Justin",
    "customerAddress": "Saint Lucia Convention Center, Castries, Saint Lucia",
    "customerEmail": "justin@example.com",
    "quoteNumber": "Q-20260215-0001",
    "items": [...],
    "subtotal": 290000,
    "tax": 0,
    "total": 290000,
    "status": "sent",
    "pdfUrl": null,
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z",
    "project": null,
    "paymentInfo": {
      "accountName": "Precious Ebubechukwu",
      "accountNumber": "120213123324",
      "bankName": "Zenith Bank"
    }
  }
}
```

If no payment info is stored, return:

```json
"paymentInfo": null
```

or:

```json
"paymentInfo": {
  "accountName": "",
  "accountNumber": "",
  "bankName": ""
}
```

The frontend will treat both as “no payment info” and will accept either shape.

---

## Validation summary

When `paymentInfo` is present in the request:

| Field | Max length | Notes |
|--------|------------|--------|
| `accountName` | 255 | Optional; trim whitespace. |
| `accountNumber` | 50 | Optional; trim whitespace. |
| `bankName` | 100 | Optional; trim whitespace. |

Reject the request with a 400 and a clear validation message if any provided value exceeds the max length.

---

## Database / schema

- Add a JSON column or separate columns for `accountName`, `accountNumber`, `bankName` on the quotes table (or equivalent quote entity).
- Ensure existing quotes continue to work: treat missing payment info as `null` or empty strings in the API response.

---

## Frontend alignment

After the backend supports the above:

1. The frontend will send `paymentInfo` on **create** and **update** quote requests when the user has entered payment details.
2. The frontend will read `paymentInfo` from **get-by-id** and **list** quote responses and display it on the Quote Details screen and use it in PDF export.

---

## Summary

| Action | Endpoint | Change |
|--------|----------|--------|
| **Accept** | `POST /api/v1/quotes` | Optional body field: `paymentInfo: { accountName?, accountNumber?, bankName? }`. Validate and store when present. |
| **Accept** | `PATCH /api/v1/quotes/:id` | Optional body field: `paymentInfo` (same shape). Update or clear stored payment info as described. |
| **Return** | `GET /api/v1/quotes/:id` | Include `paymentInfo` on the quote object. |
| **Return** | `GET /api/v1/quotes` | Include `paymentInfo` on each quote in the list. |

**Priority:** High – required for payment details to be stored and shown on Quote Details and in PDFs.
