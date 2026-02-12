# Pre-Built Templates Backend API Implementation Instructions

## Overview

The Pre-Built Templates feature allows users to configure and manage:
1. **Quote Format** - Customize quote appearance (header, footer, colors, typography, section visibility)
2. **Payment Methods** - Manage multiple payment methods for quotes (account details, default selection)
3. **PDF Export Settings** - Configure PDF export format for quotes and material lists
4. **Material Prices** - Maintain a library of material prices with markup settings

**Current Status**: The frontend is fully implemented and uses localStorage as a fallback. This document provides complete API specifications for backend implementation.

---

## Base URL and Authentication

**Base URL**: `/api/v1/templates`

**Authentication**: All endpoints require authentication via:
- Bearer token in `Authorization` header: `Authorization: Bearer <token>`
- User email in `email` header (from JWT token)
- Cookie-based authentication (withCredentials: true)

**Response Format**: All responses should follow this structure:
```json
{
  "responseMessage": "Success message",
  "response": { /* data */ }
}
```

**Error Format**:
```json
{
  "responseMessage": "Error message",
  "message": "Detailed error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

---

## Database Schema Requirements

### 1. Templates Table (Main Configuration)
Stores the main template configuration for each user.

```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_format JSONB NOT NULL,
  payment_method_config JSONB NOT NULL,
  pdf_export JSONB NOT NULL,
  material_prices_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
```

### 2. Payment Methods Table
Stores individual payment methods for each user.

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
```

**Important**: Only one payment method per user can have `is_default = TRUE`. Enforce this with a trigger or application logic.

### 3. Material Prices Table
Stores material prices library for each user.

```sql
CREATE TABLE material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Profile', 'Glass', 'Accessory', 'Rubber', 'Other')),
  unit VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  description TEXT,
  price_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_prices_user_id ON material_prices(user_id);
CREATE INDEX idx_material_prices_category ON material_prices(user_id, category);
CREATE INDEX idx_material_prices_name ON material_prices(user_id, name);
```

---

## API Endpoints

### 1. Template Configuration Endpoints

#### GET `/api/v1/templates`
Get all template configurations for the authenticated user.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`

**Response** (200 OK):
```json
{
  "responseMessage": "Templates retrieved successfully",
  "response": {
    "quoteFormat": {
      "header": {
        "logoUrl": null,
        "companyName": "",
        "tagline": "",
        "alignment": "left"
      },
      "footer": {
        "content": "",
        "alignment": "center",
        "visible": true
      },
      "colors": {
        "primary": "#1F2937",
        "secondary": "#6B7280",
        "accent": "#3B82F6"
      },
      "typography": {
        "fontFamily": "Arial",
        "headingSize": 18,
        "bodySize": 12
      },
      "page": {
        "orientation": "portrait",
        "margins": {
          "top": 20,
          "bottom": 20,
          "left": 20,
          "right": 20
        },
        "sectionSpacing": 15
      },
      "sections": {
        "projectInfo": { "visible": true, "order": 1 },
        "customerDetails": { "visible": true, "order": 2 },
        "itemsTable": { "visible": true, "order": 3 },
        "summary": { "visible": true, "order": 4 },
        "paymentInfo": { "visible": true, "order": 5 },
        "notes": { "visible": true, "order": 6 }
      }
    },
    "paymentMethods": [],
    "paymentMethodConfig": {
      "methods": [],
      "displayOptions": {
        "showInPreview": true,
        "showInPDF": true,
        "customInstructions": null
      }
    },
    "pdfExport": {
      "quote": {
        "pageSize": "A4",
        "orientation": "portrait",
        "header": { "enabled": true, "height": 30 },
        "footer": { "enabled": true, "height": 20 },
        "logo": { "enabled": false, "size": "medium", "position": "top-left" },
        "fonts": {
          "family": "Helvetica",
          "headingSize": 16,
          "bodySize": 10,
          "tableSize": 9,
          "headingColor": "#000000",
          "bodyColor": "#000000"
        }
      },
      "materialList": {
        "pageSize": "A4",
        "orientation": "portrait",
        "includeCuttingList": true,
        "cuttingListFormat": "table",
        "includeGlassList": true
      },
      "fileNaming": {
        "pattern": "Quote-{quoteId}-{projectName}",
        "dateFormat": "YYYY-MM-DD"
      }
    },
    "materialPrices": [],
    "materialPricesConfig": {
      "prices": [],
      "defaultMarkup": 0,
      "categoryMarkups": {}
    }
  }
}
```

**Status Codes**:
- `200 OK` - Success (returns default values if no template exists)
- `401 Unauthorized` - Invalid or missing token

**Implementation Notes**:
- If no template exists for the user, return default values (see Default Values section)
- Include all payment methods in `paymentMethods` array
- Include all material prices in `materialPrices` array
- The `paymentMethodConfig.methods` should be the same as `paymentMethods`
- The `materialPricesConfig.prices` should be the same as `materialPrices`

---

#### PUT `/api/v1/templates`
Create or update all template configurations for the authenticated user.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "quoteFormat": { /* QuoteFormatConfig object */ },
  "paymentMethods": [ /* Array of PaymentMethod objects */ ],
  "paymentMethodConfig": { /* PaymentMethodConfig object */ },
  "pdfExport": { /* PDFExportConfig object */ },
  "materialPrices": [ /* Array of MaterialPrice objects */ ],
  "materialPricesConfig": { /* MaterialPricesConfig object */ }
}
```

**Response** (200 OK):
```json
{
  "responseMessage": "Templates saved successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Implementation Notes**:
- If no template exists for the user, create one
- If a template exists, update it
- Ensure `updated_at` timestamp is updated
- Validate all JSON structures match the TypeScript types
- **Important**: This endpoint saves the entire template configuration. Payment methods and material prices are also managed through their individual endpoints, but this endpoint can be used for bulk updates.

---

### 2. Payment Methods Endpoints

#### GET `/api/v1/templates/payment-methods`
Get all payment methods for the authenticated user.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`

**Response** (200 OK):
```json
{
  "responseMessage": "Payment methods retrieved successfully",
  "response": {
    "paymentMethods": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "accountName": "Leads Glazing LTD",
        "accountNumber": "10-4030-011094",
        "bankName": "Zenith Bank",
        "isDefault": true,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token

**Implementation Notes**:
- Return payment methods sorted with default first
- Return empty array if user has no payment methods

---

#### POST `/api/v1/templates/payment-methods`
Create a new payment method.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "accountName": "Leads Glazing LTD",
  "accountNumber": "10-4030-011094",
  "bankName": "Zenith Bank"
}
```

**Response** (201 Created):
```json
{
  "responseMessage": "Payment method created successfully",
  "response": {
    "paymentMethod": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "accountName": "Leads Glazing LTD",
      "accountNumber": "10-4030-011094",
      "bankName": "Zenith Bank",
      "isDefault": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

**Status Codes**:
- `201 Created` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Validation**:
- `accountName` is required (max 255 characters)
- `accountNumber` is required (max 50 characters)
- `bankName` is required (max 100 characters)

**Implementation Notes**:
- Generate UUID v4 for `id`
- Set `isDefault` to `false` by default
- If this is the first payment method for the user, set `isDefault` to `true`
- Use current timestamp for `createdAt` and `updatedAt` (ISO 8601 format)

---

#### PATCH `/api/v1/templates/payment-methods/:id`
Update a payment method.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`
- `Content-Type: application/json`

**Path Parameters**:
- `id` (UUID) - Payment method ID

**Request Body** (all fields optional):
```json
{
  "accountName": "Updated Account Name",
  "accountNumber": "10-4030-011095",
  "bankName": "GT Bank",
  "isDefault": true
}
```

**Response** (200 OK):
```json
{
  "responseMessage": "Payment method updated successfully",
  "response": {
    "paymentMethod": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "accountName": "Updated Account Name",
      "accountNumber": "10-4030-011095",
      "bankName": "GT Bank",
      "isDefault": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-16T11:00:00Z"
    }
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Payment method belongs to another user
- `404 Not Found` - Payment method not found

**Implementation Notes**:
- **CRITICAL**: If `isDefault` is set to `true`, ensure all other payment methods for the user have `isDefault` set to `false`
- Only allow updating payment methods that belong to the authenticated user
- Update `updatedAt` timestamp
- Validate that the payment method exists and belongs to the user before updating

---

#### DELETE `/api/v1/templates/payment-methods/:id`
Delete a payment method.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`

**Path Parameters**:
- `id` (UUID) - Payment method ID

**Response** (200 OK):
```json
{
  "responseMessage": "Payment method deleted successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Payment method belongs to another user
- `404 Not Found` - Payment method not found

**Implementation Notes**:
- Only allow deleting payment methods that belong to the authenticated user
- If the deleted payment method was the default, set the first remaining payment method as default (if any exist)
- Validate that the payment method exists and belongs to the user before deleting

---

### 3. Material Prices Endpoints

#### GET `/api/v1/templates/material-prices`
Get all material prices for the authenticated user.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`

**Query Parameters** (optional):
- `category` - Filter by category: `Profile`, `Glass`, `Accessory`, `Rubber`, `Other`
- `search` - Search by name or description (case-insensitive partial match)

**Response** (200 OK):
```json
{
  "responseMessage": "Material prices retrieved successfully",
  "response": {
    "materialPrices": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Frame Profile (1125/26)",
        "category": "Profile",
        "unit": "meter",
        "unitPrice": 150.00,
        "description": "Standard frame profile",
        "priceHistory": [
          {
            "price": 150.00,
            "date": "2025-01-15T10:30:00Z",
            "changedBy": "user@example.com"
          }
        ],
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token

**Implementation Notes**:
- Return empty array if user has no material prices
- If `category` query parameter is provided, filter by category
- If `search` query parameter is provided, search in `name` and `description` fields
- Both filters can be combined

---

#### POST `/api/v1/templates/material-prices`
Create a new material price.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "Frame Profile (1125/26)",
  "category": "Profile",
  "unit": "meter",
  "unitPrice": 150.00,
  "description": "Standard frame profile"
}
```

**Response** (201 Created):
```json
{
  "responseMessage": "Material price created successfully",
  "response": {
    "materialPrice": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Frame Profile (1125/26)",
      "category": "Profile",
      "unit": "meter",
      "unitPrice": 150.00,
      "description": "Standard frame profile",
      "priceHistory": [
        {
          "price": 150.00,
          "date": "2025-01-15T10:30:00Z",
          "changedBy": "user@example.com"
        }
      ],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

**Status Codes**:
- `201 Created` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Validation**:
- `name` is required (max 255 characters)
- `category` is required and must be one of: `Profile`, `Glass`, `Accessory`, `Rubber`, `Other`
- `unit` is required (max 50 characters)
- `unitPrice` is required and must be a positive number (>= 0)
- `description` is optional

**Implementation Notes**:
- Generate UUID v4 for `id`
- Initialize `priceHistory` with the initial price entry
- Use current timestamp for `createdAt` and `updatedAt` (ISO 8601 format)
- Get user email from JWT token for `priceHistory[].changedBy`

---

#### PATCH `/api/v1/templates/material-prices/:id`
Update a material price.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`
- `Content-Type: application/json`

**Path Parameters**:
- `id` (UUID) - Material price ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Frame Profile",
  "unitPrice": 160.00,
  "description": "Updated description"
}
```

**Response** (200 OK):
```json
{
  "responseMessage": "Material price updated successfully",
  "response": {
    "materialPrice": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Frame Profile",
      "category": "Profile",
      "unit": "meter",
      "unitPrice": 160.00,
      "description": "Updated description",
      "priceHistory": [
        {
          "price": 150.00,
          "date": "2025-01-15T10:30:00Z",
          "changedBy": "user@example.com"
        },
        {
          "price": 160.00,
          "date": "2025-01-16T10:30:00Z",
          "changedBy": "user@example.com"
        }
      ],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-16T10:30:00Z"
    }
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Material price belongs to another user
- `404 Not Found` - Material price not found

**Implementation Notes**:
- **CRITICAL**: If `unitPrice` is changed, append a new entry to `priceHistory` with:
  - Old price value (before update)
  - Current timestamp
  - User email (from JWT token)
- Only allow updating material prices that belong to the authenticated user
- Update `updatedAt` timestamp
- Limit `priceHistory` to the last 50 entries (remove oldest entries if exceeded)
- Validate that the material price exists and belongs to the user before updating

---

#### DELETE `/api/v1/templates/material-prices/:id`
Delete a material price.

**Headers**:
- `Authorization: Bearer <token>`
- `email: <user_email>`

**Path Parameters**:
- `id` (UUID) - Material price ID

**Response** (200 OK):
```json
{
  "responseMessage": "Material price deleted successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Material price belongs to another user
- `404 Not Found` - Material price not found

**Implementation Notes**:
- Only allow deleting material prices that belong to the authenticated user
- Validate that the material price exists and belongs to the user before deleting

---

## Data Type Definitions

### QuoteFormatConfig
```typescript
{
  header: {
    logoUrl?: string;           // Optional URL to company logo
    companyName: string;        // Required, max 255 chars
    tagline?: string;           // Optional, max 255 chars
    alignment: 'left' | 'center' | 'right';
  };
  footer: {
    content: string;            // Required, max 500 chars
    alignment: 'left' | 'center' | 'right';
    visible: boolean;
  };
  colors: {
    primary: string;            // Hex color code (e.g., "#1F2937")
    secondary: string;          // Hex color code
    accent: string;             // Hex color code
  };
  typography: {
    fontFamily: string;         // Font name (e.g., "Arial", "Helvetica")
    headingSize: number;        // Font size in points (1-100)
    bodySize: number;           // Font size in points (1-100)
  };
  page: {
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;              // In mm (0-100)
      bottom: number;            // In mm (0-100)
      left: number;              // In mm (0-100)
      right: number;             // In mm (0-100)
    };
    sectionSpacing: number;      // In mm (0-50)
  };
  sections: {
    projectInfo: { visible: boolean; order: number };
    customerDetails: { visible: boolean; order: number };
    itemsTable: { visible: boolean; order: number };
    summary: { visible: boolean; order: number };
    paymentInfo: { visible: boolean; order: number };
    notes: { visible: boolean; order: number };
  };
}
```

### PaymentMethod
```typescript
{
  id: string;                   // UUID v4
  accountName: string;          // Max 255 chars
  accountNumber: string;        // Max 50 chars
  bankName: string;             // Max 100 chars
  isDefault: boolean;
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}
```

### PaymentMethodConfig
```typescript
{
  methods: PaymentMethod[];     // Array of payment methods
  displayOptions: {
    showInPreview: boolean;
    showInPDF: boolean;
    customInstructions?: string;  // Optional, max 500 chars
  };
}
```

### PDFExportConfig
```typescript
{
  quote: {
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'Custom';
    customSize?: {
      width: number;
      height: number;
      unit: 'mm' | 'in';
    };
    orientation: 'portrait' | 'landscape';
    header: {
      enabled: boolean;
      height: number;            // In mm (0-200)
    };
    footer: {
      enabled: boolean;
      height: number;            // In mm (0-200)
    };
    logo: {
      enabled: boolean;
      size: 'small' | 'medium' | 'large';
      position: 'top-left' | 'top-center' | 'top-right';
    };
    fonts: {
      family: string;
      headingSize: number;       // In points (1-100)
      bodySize: number;           // In points (1-100)
      tableSize: number;          // In points (1-100)
      headingColor: string;       // Hex color code
      bodyColor: string;          // Hex color code
    };
  };
  materialList: {
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'Custom';
    customSize?: {
      width: number;
      height: number;
      unit: 'mm' | 'in';
    };
    orientation: 'portrait' | 'landscape';
    includeCuttingList: boolean;
    cuttingListFormat: 'table' | 'list';
    includeGlassList: boolean;
  };
  fileNaming: {
    pattern: string;             // Supports: {quoteId}, {projectName}, {date}, {customerName}
    dateFormat: string;           // e.g., "YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY"
  };
}
```

### MaterialPrice
```typescript
{
  id: string;                   // UUID v4
  name: string;                 // Max 255 chars
  category: 'Profile' | 'Glass' | 'Accessory' | 'Rubber' | 'Other';
  unit: string;                  // Max 50 chars (e.g., "meter", "piece", "kg")
  unitPrice: number;            // Decimal, >= 0
  description?: string;          // Optional
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  priceHistory?: Array<{
    price: number;
    date: string;               // ISO 8601 timestamp
    changedBy?: string;          // User email
  }>;
}
```

### MaterialPricesConfig
```typescript
{
  prices: MaterialPrice[];      // Array of material prices
  defaultMarkup: number;         // Percentage (0-100)
  categoryMarkups: {
    Profile?: number;            // Percentage (0-100)
    Glass?: number;              // Percentage (0-100)
    Accessory?: number;          // Percentage (0-100)
    Rubber?: number;             // Percentage (0-100)
    Other?: number;              // Percentage (0-100)
  };
}
```

### TemplateConfig (Complete)
```typescript
{
  quoteFormat: QuoteFormatConfig;
  paymentMethods: PaymentMethod[];
  paymentMethodConfig: PaymentMethodConfig;
  pdfExport: PDFExportConfig;
  materialPrices: MaterialPrice[];
  materialPricesConfig: MaterialPricesConfig;
}
```

---

## Default Values

When a user first accesses templates (no existing record), return these default values:

### Default QuoteFormatConfig
```json
{
  "header": {
    "logoUrl": null,
    "companyName": "",
    "tagline": "",
    "alignment": "left"
  },
  "footer": {
    "content": "",
    "alignment": "center",
    "visible": true
  },
  "colors": {
    "primary": "#1F2937",
    "secondary": "#6B7280",
    "accent": "#3B82F6"
  },
  "typography": {
    "fontFamily": "Arial",
    "headingSize": 18,
    "bodySize": 12
  },
  "page": {
    "orientation": "portrait",
    "margins": {
      "top": 20,
      "bottom": 20,
      "left": 20,
      "right": 20
    },
    "sectionSpacing": 15
  },
  "sections": {
    "projectInfo": { "visible": true, "order": 1 },
    "customerDetails": { "visible": true, "order": 2 },
    "itemsTable": { "visible": true, "order": 3 },
    "summary": { "visible": true, "order": 4 },
    "paymentInfo": { "visible": true, "order": 5 },
    "notes": { "visible": true, "order": 6 }
  }
}
```

### Default PaymentMethodConfig
```json
{
  "methods": [],
  "displayOptions": {
    "showInPreview": true,
    "showInPDF": true,
    "customInstructions": null
  }
}
```

### Default PDFExportConfig
```json
{
  "quote": {
    "pageSize": "A4",
    "orientation": "portrait",
    "header": {
      "enabled": true,
      "height": 30
    },
    "footer": {
      "enabled": true,
      "height": 20
    },
    "logo": {
      "enabled": false,
      "size": "medium",
      "position": "top-left"
    },
    "fonts": {
      "family": "Helvetica",
      "headingSize": 16,
      "bodySize": 10,
      "tableSize": 9,
      "headingColor": "#000000",
      "bodyColor": "#000000"
    }
  },
  "materialList": {
    "pageSize": "A4",
    "orientation": "portrait",
    "includeCuttingList": true,
    "cuttingListFormat": "table",
    "includeGlassList": true
  },
  "fileNaming": {
    "pattern": "Quote-{quoteId}-{projectName}",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

### Default MaterialPricesConfig
```json
{
  "prices": [],
  "defaultMarkup": 0,
  "categoryMarkups": {}
}
```

---

## Critical Implementation Requirements

### 1. User Isolation
- **ALL** template data must be scoped to the authenticated user
- Users can only access/modify their own templates, payment methods, and material prices
- Use `user_id` from the JWT token to filter all queries
- Return `403 Forbidden` if a user tries to access another user's data

### 2. Default Payment Method Logic
- When a user sets a payment method as default (`isDefault: true`), ensure all other payment methods for that user are set to `isDefault: false`
- When retrieving payment methods, always return them sorted with the default first
- If a user has no payment methods, return an empty array
- When creating the first payment method for a user, automatically set it as default
- When deleting the default payment method, set the first remaining payment method as default (if any exist)

### 3. Price History Tracking
- When updating a material price's `unitPrice`, append to `priceHistory`:
  - Old price value (before the update)
  - Current timestamp (ISO 8601)
  - User email (from JWT token)
- Limit price history to the last 50 entries per material price
- When creating a new material price, initialize `priceHistory` with the initial price entry

### 4. Data Consistency
- The `paymentMethodConfig.methods` array should always match the `paymentMethods` array
- The `materialPricesConfig.prices` array should always match the `materialPrices` array
- When updating payment methods or material prices through individual endpoints, ensure the main template configuration stays in sync

### 5. UUID Generation
- Use UUID v4 for `payment_methods.id` and `material_prices.id`
- Frontend expects string UUIDs, not integers
- Ensure UUIDs are properly formatted (e.g., "550e8400-e29b-41d4-a716-446655440000")

### 6. Timestamps
- Use ISO 8601 format for all timestamps: `YYYY-MM-DDTHH:mm:ssZ`
- Automatically update `updated_at` on any modification
- Set `created_at` and `updated_at` to the same value when creating new records

### 7. JSON Validation
- Validate all JSON structures match the TypeScript types
- Ensure enum values are correct (e.g., category must be one of the allowed values)
- Validate numeric ranges (e.g., prices >= 0, font sizes 1-100)
- Validate string lengths (max character limits)

### 8. Error Handling
- Return consistent error format (see Error Format section)
- Include field-level validation errors in the `errors` array
- Return appropriate HTTP status codes:
  - `200 OK` - Success
  - `201 Created` - Resource created
  - `400 Bad Request` - Validation error
  - `401 Unauthorized` - Authentication required
  - `403 Forbidden` - Access denied (wrong user)
  - `404 Not Found` - Resource not found
  - `500 Internal Server Error` - Server error

---

## Testing Checklist

### Template Configuration
- [ ] GET `/api/v1/templates` returns default values for new users
- [ ] GET `/api/v1/templates` returns saved values for existing users
- [ ] PUT `/api/v1/templates` creates template on first call
- [ ] PUT `/api/v1/templates` updates template on subsequent calls
- [ ] PUT `/api/v1/templates` validates all JSON structures
- [ ] All endpoints require authentication

### Payment Methods
- [ ] GET `/api/v1/templates/payment-methods` returns empty array for new users
- [ ] POST `/api/v1/templates/payment-methods` creates payment method
- [ ] POST `/api/v1/templates/payment-methods` sets first payment method as default
- [ ] PATCH `/api/v1/templates/payment-methods/:id` updates payment method
- [ ] PATCH `/api/v1/templates/payment-methods/:id` handles default payment method correctly
- [ ] DELETE `/api/v1/templates/payment-methods/:id` deletes payment method
- [ ] DELETE `/api/v1/templates/payment-methods/:id` sets new default if deleted was default
- [ ] Users can only access their own payment methods
- [ ] Validation errors are returned correctly

### Material Prices
- [ ] GET `/api/v1/templates/material-prices` returns empty array for new users
- [ ] GET `/api/v1/templates/material-prices?category=Profile` filters by category
- [ ] GET `/api/v1/templates/material-prices?search=frame` searches by name
- [ ] POST `/api/v1/templates/material-prices` creates material price
- [ ] POST `/api/v1/templates/material-prices` initializes price history
- [ ] PATCH `/api/v1/templates/material-prices/:id` updates material price
- [ ] PATCH `/api/v1/templates/material-prices/:id` tracks price history
- [ ] DELETE `/api/v1/templates/material-prices/:id` deletes material price
- [ ] Users can only access their own material prices
- [ ] Price history is limited to 50 entries
- [ ] Validation errors are returned correctly

### Security
- [ ] All endpoints require authentication
- [ ] Users can only access their own data
- [ ] 403 errors are returned when accessing another user's data
- [ ] 404 errors are returned for non-existent resources
- [ ] SQL injection prevention is implemented
- [ ] XSS prevention is implemented

---

## Frontend Integration Notes

The frontend service (`src/services/api/templates.service.ts`) is already configured to call these endpoints. Key points:

1. **Automatic Fallback**: The frontend includes fallback to localStorage if the API is unavailable, so the feature will continue to work during backend development.

2. **Response Format**: The frontend expects responses in the format:
   ```typescript
   {
     responseMessage?: string;
     message?: string;
     response: T;
   }
   ```

3. **Error Handling**: The frontend handles errors gracefully and falls back to localStorage if the API fails.

4. **Data Structure**: The frontend expects the exact data structures defined in the TypeScript types. Ensure your backend responses match these exactly.

5. **Once Backend is Implemented**:
   - The frontend will automatically use the API instead of localStorage
   - All template data will be synced across devices
   - Users can access their templates from any device

---

## Reference Files

For detailed implementation reference, see:
- **Frontend Types**: `src/types/templates.ts`
- **Frontend Service**: `src/services/api/templates.service.ts`
- **Frontend Store**: `src/stores/templateStore.ts`
- **Frontend Components**: `src/components/features/prebuilt-templates/`

---

## Questions or Clarifications

If you need any clarification on the API requirements, data structures, or integration details, please refer to the frontend implementation files listed above or contact the frontend development team.
