# Frontend: Quotes Payment Info Integration Guide

**Status:** Implemented (Backend ready)  
**Date:** February 2026

---

## Overview

The quotes API now supports **payment information** (bank account details) on create, update, and read. Use this guide to integrate payment info in the frontend for the "Extras & Notes" step, Quote Details screen, and PDF export.

---

## What Changed

| Endpoint | Change |
|----------|--------|
| `POST /api/v1/quotes` | Accepts optional `paymentInfo` in the request body |
| `PATCH /api/v1/quotes/:quoteId` | Accepts optional `paymentInfo` (update, clear, or leave unchanged) |
| `GET /api/v1/quotes/:quoteId` | Returns `paymentInfo` on the quote object |
| `GET /api/v1/quotes` | Each quote in the list includes `paymentInfo` |

---

## 1. Sending Payment Info (Create & Update)

### Request body shape

Add an optional `paymentInfo` object when creating or updating a quote:

```ts
// TypeScript type for request body
type PaymentInfo = {
  accountName?: string;   // max 255 chars
  accountNumber?: string; // max 50 chars
  bankName?: string;      // max 100 chars
};

// Include in create/update payload
{
  quoteType: "standalone",
  customerName: "Justin",
  customerAddress: "...",
  customerEmail: "justin@example.com",
  items: [...],
  subtotal: 290000,
  tax: 0,
  total: 290000,
  status: "draft",
  paymentInfo: {           // optional – omit if no payment details
    accountName: "Precious Ebubechukwu",
    accountNumber: "120213123324",
    bankName: "Zenith Bank"
  }
}
```

### Create (POST)

- **Omit** `paymentInfo` or send `paymentInfo: null` → No payment info stored.
- **Send** `paymentInfo: { accountName?, accountNumber?, bankName? }` → Values are stored (full replace). All three fields are optional; you can send partial data.

### Update (PATCH)

- **Omit** `paymentInfo` → Existing payment info is left unchanged.
- **Send** `paymentInfo: null` → Stored payment info is cleared.
- **Send** `paymentInfo: { ... }` → Stored payment info is replaced with the new object.

### Validation rules

| Field | Max length | Notes |
|-------|------------|-------|
| `accountName` | 255 | Optional; whitespace is trimmed |
| `accountNumber` | 50 | Optional; whitespace is trimmed |
| `bankName` | 100 | Optional; whitespace is trimmed |

If a value exceeds the max length, the API returns **400** with a validation error.

---

## 2. Receiving Payment Info (Get & List)

### Response shape

Each quote in `GET /api/v1/quotes/:quoteId` and `GET /api/v1/quotes` now includes `paymentInfo`:

```ts
// TypeScript type for quote response
type QuotePaymentInfo = {
  accountName: string;
  accountNumber: string;
  bankName: string;
} | null;

type Quote = {
  id: number;
  userId: number;
  projectId: number | null;
  quoteType: "from_project" | "standalone";
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  quoteNumber: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  pdfUrl: string | null;
  paymentInfo: QuotePaymentInfo;  // NEW
  createdAt: string;
  updatedAt: string;
  project?: Project | null;
  // ...
};
```

### When no payment info exists

The API may return either:

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

Treat both as “no payment info”. Use a helper:

```ts
function hasPaymentInfo(paymentInfo: QuotePaymentInfo): boolean {
  if (!paymentInfo) return false;
  const { accountName, accountNumber, bankName } = paymentInfo;
  return !!(accountName?.trim() || accountNumber?.trim() || bankName?.trim());
}
```

---

## 3. Frontend integration steps

### A. Extras & Notes step (Create/Edit quote)

1. Add form fields for:
   - Account Name
   - Account Number
   - Bank Name
2. Include `paymentInfo` in the payload when the user has entered at least one value:

```ts
const payload = {
  quoteType,
  customerName,
  customerAddress,
  customerEmail,
  items,
  subtotal,
  tax,
  total,
  status,
  ...(hasPaymentFields && {
    paymentInfo: {
      accountName: accountName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined
    }
  })
};
```

3. For **PATCH**, to clear payment info when the user removes all fields, send `paymentInfo: null`.

### B. Quote Details screen

1. Call `GET /api/v1/quotes/:quoteId` (or use the quote from the list).
2. Read `response.quote.paymentInfo`.
3. If `hasPaymentInfo(paymentInfo)` is true, show the fields in a “Payment details” section.
4. If false, hide the section or show a placeholder (e.g. “No payment info provided”).

### C. PDF export

- The backend-generated PDF already includes payment details when `paymentInfo` is present and non-empty.
- No frontend changes needed for PDF content.
- If you generate PDFs on the frontend, pass `paymentInfo` from the quote response into your PDF template.

---

## 4. Example API usage

### Create quote with payment info

```http
POST /api/v1/quotes HTTP/1.1
Content-Type: application/json

{
  "quoteType": "standalone",
  "customerName": "Justin",
  "customerAddress": "Saint Lucia Convention Center, Castries, Saint Lucia",
  "customerEmail": "justin@example.com",
  "items": [
    { "description": "Window unit", "quantity": 1, "unitPrice": 290000, "totalPrice": 290000 }
  ],
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

### Update quote – clear payment info

```http
PATCH /api/v1/quotes/42 HTTP/1.1
Content-Type: application/json

{
  "paymentInfo": null
}
```

### Get quote – response includes paymentInfo

```json
{
  "responseMessage": "Quote retrieved successfully",
  "response": {
    "quote": {
      "id": 42,
      "quoteNumber": "Q-20260215-0001",
      "customerName": "Justin",
      "paymentInfo": {
        "accountName": "Precious Ebubechukwu",
        "accountNumber": "120213123324",
        "bankName": "Zenith Bank"
      },
      ...
    }
  }
}
```

---

## 5. Error handling

| Scenario | HTTP | Response |
|----------|------|----------|
| `accountName` > 255 chars | 400 | `"Account name must be at most 255 characters"` |
| `accountNumber` > 50 chars | 400 | `"Account number must be at most 50 characters"` |
| `bankName` > 100 chars | 400 | `"Bank name must be at most 100 characters"` |

Use these messages to show inline validation errors on the form.

---

## Summary checklist

- [ ] Add payment info fields to the Extras & Notes step form
- [ ] Send `paymentInfo` on `POST /api/v1/quotes` when the user enters payment details
- [ ] Send `paymentInfo` or `paymentInfo: null` on `PATCH /api/v1/quotes/:quoteId` as needed
- [ ] Read `paymentInfo` from quote responses and display it on the Quote Details screen
- [ ] Use `hasPaymentInfo()` (or similar) to handle both `null` and empty-string variants
- [ ] Validate max lengths client-side to reduce 400 errors
- [ ] Rely on the backend PDF for payment details, or pass `paymentInfo` into any frontend PDF generation
