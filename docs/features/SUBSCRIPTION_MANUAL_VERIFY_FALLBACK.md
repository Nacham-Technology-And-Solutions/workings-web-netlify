# Manual Subscription Verification (Frontend)

**Purpose:** Manual fallback when webhooks fail.  
**Endpoint:** `POST /api/v1/subscriptions/verify-payment`  
**Auth:** Required (same as other subscription routes).

---

## Request Body
```json
{
  "reference": "sub_123_...",
  "provider": "paystack" | "flutterwave" | "monnify",
  "plan": "starter" | "pro" | "enterprise" | "free",
  "billingCycle": "monthly" | "yearly"
}
```

---

## Notes
- The backend verifies with the payment provider before activating.
- Ownership is enforced via metadata `userId` attached during payment init.
- If `plan` or `billingCycle` are provided, they must match provider metadata.

---

## Success Response (200)
```json
{
  "responseMessage": "Payment verified and subscription activated successfully",
  "response": {
    "message": "Subscription has been activated",
    "subscriptionId": 123,
    "plan": "pro",
    "billingCycle": "monthly",
    "provider": "paystack",
    "reference": "sub_123_...",
    "amount": 25000
  }
}
```

---

## Error Cases
- Missing or invalid reference/provider
- Metadata missing `userId`
- Reference not owned by authenticated user
- Payment not successful
