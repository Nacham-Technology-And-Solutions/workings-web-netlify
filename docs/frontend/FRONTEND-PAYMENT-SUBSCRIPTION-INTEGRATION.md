# Frontend Payment & Subscription Integration Guide

This document provides comprehensive guidance for integrating the payment and subscription system into the frontend application.

## Table of Contents

1. [Overview](#overview)
2. [API Base URL](#api-base-url)
3. [Authentication](#authentication)
4. [Subscription Plans](#subscription-plans)
5. [Payment Providers](#payment-providers)
6. [API Endpoints](#api-endpoints)
7. [Payment Flow](#payment-flow)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)

---

## Overview

The subscription system supports multiple payment providers (Paystack, FlutterWave, Monnify) and allows users to:

- View available subscription plans
- Subscribe to a plan with their preferred payment provider
- View their current subscription status
- Cancel their subscription
- Handle payment callbacks

### Key Features

- **Multi-Provider Support**: Choose from Paystack, FlutterWave, or Monnify
- **Automatic Fallback**: If a provider fails, the system automatically tries the next available provider
- **Flexible Billing**: Monthly or yearly billing cycles
- **Points System**: Automatic points replenishment based on subscription tier

---

## API Base URL

```
Production: https://api.yourdomain.com/api/v1
Development: http://localhost:5000/api/v1
```

---

## Authentication

All subscription endpoints (except public ones) require authentication. Include the authentication token in the request headers:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

The token is obtained from the login endpoint (`POST /api/v1/auth/log-in`).

---

## Subscription Plans

### Available Plans

| Plan       | Monthly Price | Yearly Price | Points/Month | Projects Limit |
| ---------- | ------------- | ------------ | ------------ | -------------- |
| Free       | ₦0            | ₦0           | 50           | 2              |
| Starter    | ₦5,000        | ₦50,000      | 200          | 10             |
| Pro        | ₦15,000       | ₦150,000     | 500          | 30             |
| Enterprise | ₦50,000       | ₦500,000     | Unlimited    | Unlimited      |

### Plan Features

- **Free**: Basic calculation engine, Casement window module only, 2 projects/month, 50 points/month
- **Starter**: All Free features + Sliding 2-Sash module, 10 projects/month, 200 points/month
- **Pro**: All Starter features + All 9 calculation modules, 30 projects/month, 500 points/month
- **Enterprise**: All Pro features + Unlimited projects, Unlimited points, API access, Dedicated support

---

## Payment Providers

The system supports three payment providers:

1. **Paystack** - Most popular in Nigeria
2. **FlutterWave** - Alternative payment gateway
3. **Monnify** - Another payment option

Users can select their preferred provider, or the system will use the default provider based on priority.

---

## API Endpoints

### 1. Get Subscription Plans

**Endpoint**: `GET /subscriptions/plans`

**Authentication**: Not required (Public endpoint)

**Response**:

```json
{
  "responseMessage": "Subscription plans retrieved successfully",
  "response": {
    "plans": [
      {
        "id": "free",
        "name": "Free",
        "monthlyPrice": 0,
        "yearlyPrice": 0,
        "pointsPerMonth": 50,
        "projectsLimit": 2,
        "modules": ["Casement Window"],
        "features": [
          "Basic calculation engine",
          "Casement window module only",
          "2 projects per month",
          "50 points per month",
          "Email support"
        ]
      },
      {
        "id": "starter",
        "name": "Starter",
        "monthlyPrice": 5000,
        "yearlyPrice": 50000,
        "pointsPerMonth": 200,
        "projectsLimit": 10,
        "modules": ["Casement Window", "Sliding Window (2-Sash)"],
        "features": [...]
      },
      // ... other plans
    ]
  }
}
```

**Example Request**:

```javascript
const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
const data = await response.json();
```

---

### 2. Get Payment Providers

**Endpoint**: `GET /subscriptions/payment-providers`

**Authentication**: Not required (Public endpoint)

**Response**:

```json
{
  "responseMessage": "Payment providers retrieved successfully",
  "response": {
    "providers": [
      {
        "name": "paystack",
        "enabled": true,
        "priority": 0
      },
      {
        "name": "flutterwave",
        "enabled": true,
        "priority": 1
      },
      {
        "name": "monnify",
        "enabled": true,
        "priority": 2
      }
    ],
    "defaultProvider": "paystack"
  }
}
```

**Example Request**:

```javascript
const response = await fetch(`${API_BASE_URL}/subscriptions/payment-providers`);
const data = await response.json();
```

---

### 3. Subscribe to a Plan

**Endpoint**: `POST /subscriptions/subscribe`

**Authentication**: Required

**Request Body**:

```json
{
  "plan": "starter",
  "billingCycle": "monthly",
  "paymentProvider": "paystack" // Optional: 'paystack' | 'flutterwave' | 'monnify'
}
```

**Request Schema**:

- `plan` (required): `'free' | 'starter' | 'pro' | 'enterprise'`
- `billingCycle` (required): `'monthly' | 'yearly'`
- `paymentProvider` (optional): `'paystack' | 'flutterwave' | 'monnify'`

**Response**:

```json
{
  "responseMessage": "Payment initialized successfully",
  "response": {
    "authorizationUrl": "https://paystack.com/pay/xxxxx",
    "accessCode": "xxxxx", // Paystack only
    "reference": "sub_123_1234567890_abc123",
    "paymentProvider": "paystack",
    "amount": 5000,
    "plan": "starter",
    "billingCycle": "monthly"
  }
}
```

**Example Request**:

```javascript
const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan: 'starter',
    billingCycle: 'monthly',
    paymentProvider: 'paystack' // Optional
  })
});

const data = await response.json();

if (data.response?.authorizationUrl) {
  // Redirect user to payment page
  window.location.href = data.response.authorizationUrl;
}
```

**Important Notes**:

- If `paymentProvider` is not provided, the system uses the default provider
- If the selected provider fails, the system automatically tries the next available provider
- Always redirect the user to `authorizationUrl` after successful initialization

---

### 4. Get Current Subscription

**Endpoint**: `GET /subscriptions/current`

**Authentication**: Required

**Response**:

```json
{
  "responseMessage": "Current subscription retrieved successfully",
  "response": {
    "subscription": {
      "plan": "starter",
      "billingCycle": "monthly",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "status": "active",
      "pointsBalance": 200
    }
  }
}
```

**Example Request**:

```javascript
const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const data = await response.json();
const subscription = data.response?.subscription;
```

**Response Fields**:

- `plan`: Current subscription plan
- `billingCycle`: 'monthly' or 'yearly'
- `startDate`: Subscription start date (ISO 8601)
- `endDate`: Subscription expiration date (ISO 8601)
- `status`: 'active' | 'expired' | 'cancelled'
- `pointsBalance`: Current points balance

---

### 5. Cancel Subscription

**Endpoint**: `POST /subscriptions/cancel`

**Authentication**: Required

**Request Body**:

```json
{
  "reason": "No longer needed" // Optional, max 500 characters
}
```

**Response**:

```json
{
  "responseMessage": "Subscription cancelled successfully",
  "response": {
    "message": "Your subscription has been cancelled. You have been moved to the free tier."
  }
}
```

**Example Request**:

```javascript
const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'No longer needed' // Optional
  })
});

const data = await response.json();
```

**Important Notes**:

- Cancelling a subscription immediately moves the user to the free tier
- Points balance is reset to the free tier allocation (50 points)
- The subscription cannot be reactivated; user must subscribe again

---

## Payment Flow

### Complete Payment Flow Diagram

```
1. User selects plan and billing cycle
   ↓
2. Frontend calls POST /subscriptions/subscribe
   ↓
3. Backend initializes payment with provider
   ↓
4. Backend returns authorizationUrl
   ↓
5. Frontend redirects user to authorizationUrl
   ↓
6. User completes payment on provider's page
   ↓
7. Provider redirects to callback URL
   ↓
8. Frontend handles callback and verifies payment
   ↓
9. Backend webhook processes payment
   ↓
10. Subscription activated, points replenished
```

### Step-by-Step Implementation

#### Step 1: Display Plans

```javascript
// Fetch and display plans
const plansResponse = await fetch(`${API_BASE_URL}/subscriptions/plans`);
const plansData = await plansResponse.json();
const plans = plansData.response.plans;

// Display plans to user
plans.forEach((plan) => {
  console.log(`${plan.name}: ₦${plan.monthlyPrice}/month`);
});
```

#### Step 2: Initialize Payment

```javascript
async function subscribeToPlan(plan, billingCycle, paymentProvider = null) {
  try {
    const body = {
      plan,
      billingCycle
    };

    // Add payment provider if specified
    if (paymentProvider) {
      body.paymentProvider = paymentProvider;
    }

    const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseMessage || 'Failed to initialize payment');
    }

    // Store reference for verification
    localStorage.setItem('paymentReference', data.response.reference);
    localStorage.setItem('paymentProvider', data.response.paymentProvider);

    // Redirect to payment page
    window.location.href = data.response.authorizationUrl;
  } catch (error) {
    console.error('Subscription error:', error);
    // Handle error (show error message to user)
  }
}
```

#### Step 3: Handle Payment Callback

After payment, the provider redirects to your callback URL. Handle it like this:

```javascript
// In your callback page (e.g., /subscription/callback)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference') || urlParams.get('tx_ref');
  const status = urlParams.get('status');

  if (reference) {
    verifyPayment(reference);
  }
}, []);

async function verifyPayment(reference) {
  try {
    // Get current subscription to verify payment was processed
    const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    const subscription = data.response?.subscription;

    if (subscription && subscription.status === 'active') {
      // Payment successful
      // Redirect to success page or dashboard
      window.location.href = '/subscription/success';
    } else {
      // Payment might still be processing
      // Show pending message or check again after delay
      setTimeout(() => verifyPayment(reference), 5000);
    }
  } catch (error) {
    console.error('Verification error:', error);
    // Handle error
  }
}
```

**Important**: The webhook processes the payment asynchronously. The callback verification might need to poll or wait a few seconds before the subscription is activated.

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "responseMessage": "Error message here",
  "error": "ERROR_TYPE"
}
```

### Common Error Codes

| Status Code | Error Type            | Description                              |
| ----------- | --------------------- | ---------------------------------------- |
| 400         | BAD REQUEST           | Invalid request data or validation error |
| 401         | UNAUTHORIZED          | Authentication required or invalid token |
| 404         | NOT FOUND             | Resource not found                       |
| 500         | INTERNAL SERVER ERROR | Server error                             |

### Error Handling Example

```javascript
async function handleSubscriptionRequest(plan, billingCycle) {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan, billingCycle })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types
      switch (response.status) {
        case 400:
          // Bad request - validation error
          if (data.error === 'ZodError(input validation error)') {
            // Handle validation errors
            console.error('Validation errors:', data.responseMessage);
          } else {
            console.error('Bad request:', data.responseMessage);
          }
          break;

        case 401:
          // Unauthorized - token expired or invalid
          // Redirect to login
          window.location.href = '/login';
          break;

        case 500:
          // Server error
          console.error('Server error:', data.responseMessage);
          break;

        default:
          console.error('Unknown error:', data.responseMessage);
      }

      throw new Error(data.responseMessage);
    }

    return data.response;
  } catch (error) {
    // Network error or other exception
    console.error('Request failed:', error);
    throw error;
  }
}
```

### Validation Errors

When validation fails, the response includes detailed error information:

```json
{
  "error": "ZodError(input validation error)",
  "responseMessage": [
    {
      "code": "invalid_enum_value",
      "expected": ["free", "starter", "pro", "enterprise"],
      "received": "invalid",
      "path": ["plan"],
      "message": "Invalid enum value. Expected 'free' | 'starter' | 'pro' | 'enterprise', received 'invalid'"
    }
  ]
}
```

---

## Code Examples

### React/Next.js Example

```typescript
// types/subscription.ts
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify';

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  pointsPerMonth: number;
  projectsLimit: number | null;
  modules: string[];
  features: string[];
}

export interface Subscription {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  startDate: string | null;
  endDate: string | null;
  status: 'active' | 'expired' | 'cancelled';
  pointsBalance: number;
}

// services/subscriptionService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class SubscriptionService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
    const data = await response.json();
    return data.response.plans;
  }

  async getPaymentProviders() {
    const response = await fetch(`${API_BASE_URL}/subscriptions/payment-providers`);
    const data = await response.json();
    return data.response;
  }

  async subscribe(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    paymentProvider?: PaymentProvider
  ) {
    const body: any = { plan, billingCycle };
    if (paymentProvider) {
      body.paymentProvider = paymentProvider;
    }

    const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.responseMessage || 'Failed to subscribe');
    }

    return await response.json();
  }

  async getCurrentSubscription(): Promise<Subscription> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get subscription');
    }

    const data = await response.json();
    return data.response.subscription;
  }

  async cancelSubscription(reason?: string) {
    const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.responseMessage || 'Failed to cancel subscription');
    }

    return await response.json();
  }
}

// components/SubscriptionPlans.tsx
import { useState, useEffect } from 'react';
import { SubscriptionService } from '../services/subscriptionService';
import type { Plan, PaymentProvider } from '../types/subscription';

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [plansData, providersData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getPaymentProviders()
      ]);

      setPlans(plansData);
      setPaymentProviders(providersData.providers.map((p: any) => p.name));
      setSelectedProvider(providersData.defaultProvider);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId: string) {
    if (!selectedPlan) return;

    try {
      const response = await subscriptionService.subscribe(
        planId as any,
        billingCycle,
        selectedProvider || undefined
      );

      // Redirect to payment page
      if (response.response?.authorizationUrl) {
        window.location.href = response.response.authorizationUrl;
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to subscribe');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Choose Your Plan</h2>

      {/* Billing Cycle Toggle */}
      <div>
        <button
          onClick={() => setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'active' : ''}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={billingCycle === 'yearly' ? 'active' : ''}
        >
          Yearly
        </button>
      </div>

      {/* Payment Provider Selection */}
      <div>
        <label>Payment Provider:</label>
        <select
          value={selectedProvider || ''}
          onChange={(e) => setSelectedProvider(e.target.value as PaymentProvider)}
        >
          {paymentProviders.map(provider => (
            <option key={provider} value={provider}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Plans */}
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card">
            <h3>{plan.name}</h3>
            <p className="price">
              ₦{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
              <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
            </p>
            <ul>
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                setSelectedPlan(plan.id);
                handleSubscribe(plan.id);
              }}
              disabled={plan.id === 'free'}
            >
              {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue.js Example

```javascript
// composables/useSubscription.js
import { ref } from 'vue';

export function useSubscription() {
  const plans = ref([]);
  const currentSubscription = ref(null);
  const loading = ref(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async function fetchPlans() {
    loading.value = true;
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
      const data = await response.json();
      plans.value = data.response.plans;
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      loading.value = false;
    }
  }

  async function subscribe(plan, billingCycle, paymentProvider = null) {
    loading.value = true;
    try {
      const body = { plan, billingCycle };
      if (paymentProvider) body.paymentProvider = paymentProvider;

      const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.responseMessage || 'Failed to subscribe');
      }

      // Redirect to payment
      if (data.response?.authorizationUrl) {
        window.location.href = data.response.authorizationUrl;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentSubscription() {
    loading.value = true;
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      currentSubscription.value = data.response.subscription;
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      loading.value = false;
    }
  }

  return {
    plans,
    currentSubscription,
    loading,
    fetchPlans,
    subscribe,
    fetchCurrentSubscription
  };
}
```

---

## Best Practices

### 1. Error Handling

- Always handle network errors and API errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures

### 2. Payment Flow

- Store payment reference in localStorage or sessionStorage
- Verify payment status after callback redirect
- Implement polling mechanism if webhook processing takes time
- Show loading states during payment processing

### 3. Security

- Never store sensitive payment data on the frontend
- Always use HTTPS in production
- Validate user input before sending to API
- Implement proper authentication token management

### 4. User Experience

- Show clear pricing information
- Display subscription status prominently
- Provide easy cancellation flow
- Show points balance and usage
- Implement subscription renewal reminders

### 5. State Management

- Cache subscription plans (they don't change frequently)
- Refresh current subscription after payment
- Update UI immediately after subscription changes
- Handle offline scenarios gracefully

### 6. Testing

- Test with all payment providers
- Test payment failure scenarios
- Test subscription cancellation
- Test token expiration handling
- Test with different subscription plans

---

## Webhook Handling (Backend)

**Note**: Webhooks are handled by the backend automatically. The frontend doesn't need to handle webhooks directly.

However, you should:

1. **Verify Payment After Callback**: After the user is redirected back from the payment provider, verify that the subscription was activated by calling `GET /subscriptions/current`

2. **Polling (Optional)**: If the webhook hasn't processed yet, you can poll the current subscription endpoint:

```javascript
async function waitForSubscriptionActivation(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    const subscription = await subscriptionService.getCurrentSubscription();

    if (subscription.status === 'active') {
      return subscription;
    }
  }

  throw new Error('Subscription activation timeout');
}
```

---

## Environment Variables

Set these in your frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api/v1
# or
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Support

For issues or questions:

1. Check the API response messages for detailed error information
2. Review the backend logs for server-side errors
3. Verify authentication tokens are valid
4. Ensure payment provider credentials are configured on the backend

---

## Changelog

### Version 1.0.0

- Initial release
- Multi-provider support (Paystack, FlutterWave, Monnify)
- Automatic fallback mechanism
- Subscription management endpoints
