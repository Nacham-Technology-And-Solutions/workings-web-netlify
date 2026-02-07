# Pre-Built Templates Backend Integration Guide

## Overview

The Pre-Built Templates feature allows users to configure and manage:
1. **Quote Format** - Customize quote appearance (header, footer, colors, typography, section visibility)
2. **Payment Methods** - Manage multiple payment methods for quotes (account details, default selection)
3. **PDF Export Settings** - Configure PDF export format for quotes and material lists
4. **Material Prices** - Maintain a library of material prices with markup settings

Currently, this feature is implemented on the frontend with localStorage persistence. This document outlines the backend API requirements to integrate this feature with the server.

---

## Database Schema Requirements

### 1. Templates Table (Main Configuration)
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
```

### 2. Payment Methods Table
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

### 3. Material Prices Table
```sql
CREATE TABLE material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Profile', 'Glass', 'Accessory', 'Rubber', 'Other')),
  unit VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  price_history JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_prices_user_id ON material_prices(user_id);
CREATE INDEX idx_material_prices_category ON material_prices(user_id, category);
```

---

## API Endpoints

### Base URL
All endpoints are prefixed with `/api/v1/templates`

### Authentication
All endpoints require authentication via Bearer token in the `Authorization` header.

---

## 1. Template Configuration Endpoints

### GET `/api/v1/templates`
Get all template configurations for the authenticated user.

**Response:**
```json
{
  "responseMessage": "Templates retrieved successfully",
  "response": {
    "quoteFormat": {
      "header": {
        "logoUrl": "https://example.com/logo.png",
        "companyName": "Leads Glazing LTD",
        "tagline": "Quality Glazing Solutions",
        "alignment": "left"
      },
      "footer": {
        "content": "Thank you for your business",
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
    "paymentMethodConfig": {
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
        "header": {
          "enabled": true,
          "height": 50
        },
        "footer": {
          "enabled": true,
          "height": 30
        },
        "logo": {
          "enabled": true,
          "size": "medium",
          "position": "top-left"
        },
        "fonts": {
          "family": "Arial",
          "headingSize": 16,
          "bodySize": 12,
          "tableSize": 10,
          "headingColor": "#000000",
          "bodyColor": "#333333"
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
        "pattern": "{quoteId}-{projectName}-{date}",
        "dateFormat": "YYYY-MM-DD"
      }
    },
    "materialPricesConfig": {
      "defaultMarkup": 15,
      "categoryMarkups": {
        "Profile": 20,
        "Glass": 10,
        "Accessory": 15,
        "Rubber": 12,
        "Other": 15
      }
    }
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - No templates found (should create default on first access)

---

### PUT `/api/v1/templates`
Create or update all template configurations for the authenticated user.

**Request Body:**
```json
{
  "quoteFormat": { /* QuoteFormatConfig object */ },
  "paymentMethodConfig": { /* PaymentMethodConfig object */ },
  "pdfExport": { /* PDFExportConfig object */ },
  "materialPricesConfig": { /* MaterialPricesConfig object */ }
}
```

**Response:**
```json
{
  "responseMessage": "Templates saved successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Notes:**
- If no template exists for the user, create one
- If a template exists, update it
- Ensure `updated_at` timestamp is updated

---

## 2. Payment Methods Endpoints

### GET `/api/v1/templates/payment-methods`
Get all payment methods for the authenticated user.

**Response:**
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

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token

---

### POST `/api/v1/templates/payment-methods`
Create a new payment method.

**Request Body:**
```json
{
  "accountName": "Leads Glazing LTD",
  "accountNumber": "10-4030-011094",
  "bankName": "Zenith Bank"
}
```

**Response:**
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

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Validation:**
- `accountName` is required (max 255 characters)
- `accountNumber` is required (max 50 characters)
- `bankName` is required (max 100 characters)

---

### PATCH `/api/v1/templates/payment-methods/:id`
Update a payment method.

**Request Body:**
```json
{
  "accountName": "Updated Account Name",
  "accountNumber": "10-4030-011095",
  "bankName": "GT Bank",
  "isDefault": true
}
```

**Response:**
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
      "updatedAt": "2025-01-15T11:00:00Z"
    }
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Payment method belongs to another user
- `404 Not Found` - Payment method not found

**Important Notes:**
- If `isDefault` is set to `true`, ensure all other payment methods for the user have `isDefault` set to `false`
- Only allow updating payment methods that belong to the authenticated user

---

### DELETE `/api/v1/templates/payment-methods/:id`
Delete a payment method.

**Response:**
```json
{
  "responseMessage": "Payment method deleted successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Payment method belongs to another user
- `404 Not Found` - Payment method not found

**Important Notes:**
- Only allow deleting payment methods that belong to the authenticated user
- If the deleted payment method was the default, set the first remaining payment method as default (if any exist)

---

## 3. Material Prices Endpoints

### GET `/api/v1/templates/material-prices`
Get all material prices for the authenticated user.

**Query Parameters:**
- `category` (optional) - Filter by category: `Profile`, `Glass`, `Accessory`, `Rubber`, `Other`
- `search` (optional) - Search by name or description

**Response:**
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

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token

---

### POST `/api/v1/templates/material-prices`
Create a new material price.

**Request Body:**
```json
{
  "name": "Frame Profile (1125/26)",
  "category": "Profile",
  "unit": "meter",
  "unitPrice": 150.00,
  "description": "Standard frame profile"
}
```

**Response:**
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

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

**Validation:**
- `name` is required (max 255 characters)
- `category` is required and must be one of: `Profile`, `Glass`, `Accessory`, `Rubber`, `Other`
- `unit` is required (max 50 characters)
- `unitPrice` is required and must be a positive number

---

### PATCH `/api/v1/templates/material-prices/:id`
Update a material price.

**Request Body:**
```json
{
  "name": "Updated Frame Profile",
  "unitPrice": 160.00,
  "description": "Updated description"
}
```

**Response:**
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

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Material price belongs to another user
- `404 Not Found` - Material price not found

**Important Notes:**
- If `unitPrice` is changed, append a new entry to `priceHistory` with the old price, current timestamp, and user email
- Only allow updating material prices that belong to the authenticated user

---

### DELETE `/api/v1/templates/material-prices/:id`
Delete a material price.

**Response:**
```json
{
  "responseMessage": "Material price deleted successfully",
  "response": {
    "success": true
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Material price belongs to another user
- `404 Not Found` - Material price not found

**Important Notes:**
- Only allow deleting material prices that belong to the authenticated user

---

### POST `/api/v1/templates/material-prices/import`
Bulk import material prices from CSV/Excel.

**Request Body:**
```json
{
  "prices": [
    {
      "name": "Frame Profile (1125/26)",
      "category": "Profile",
      "unit": "meter",
      "unitPrice": 150.00,
      "description": "Standard frame profile"
    },
    {
      "name": "Net Clips",
      "category": "Accessory",
      "unit": "piece",
      "unitPrice": 20000.00,
      "description": "Standard net clips"
    }
  ]
}
```

**Response:**
```json
{
  "responseMessage": "Material prices imported successfully",
  "response": {
    "imported": 2,
    "failed": 0,
    "materialPrices": [ /* Array of created MaterialPrice objects */ ]
  }
}
```

**Status Codes:**
- `200 OK` - Success (even if some items failed)
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token

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
    primary: string;            // Hex color code
    secondary: string;          // Hex color code
    accent: string;             // Hex color code
  };
  typography: {
    fontFamily: string;         // Font name
    headingSize: number;        // Font size in points
    bodySize: number;           // Font size in points
  };
  page: {
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;              // In mm
      bottom: number;           // In mm
      left: number;             // In mm
      right: number;            // In mm
    };
    sectionSpacing: number;     // In mm
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

### PaymentMethodConfig
```typescript
{
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
      height: number;            // In mm
    };
    footer: {
      enabled: boolean;
      height: number;            // In mm
    };
    logo: {
      enabled: boolean;
      size: 'small' | 'medium' | 'large';
      position: 'top-left' | 'top-center' | 'top-right';
    };
    fonts: {
      family: string;
      headingSize: number;       // In points
      bodySize: number;           // In points
      tableSize: number;          // In points
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

### MaterialPricesConfig
```typescript
{
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

---

## Default Values

When a user first accesses templates (no existing record), create default values:

### Default QuoteFormatConfig
```json
{
  "header": {
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
      "height": 50
    },
    "footer": {
      "enabled": true,
      "height": 30
    },
    "logo": {
      "enabled": true,
      "size": "medium",
      "position": "top-left"
    },
    "fonts": {
      "family": "Arial",
      "headingSize": 16,
      "bodySize": 12,
      "tableSize": 10,
      "headingColor": "#000000",
      "bodyColor": "#333333"
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
    "pattern": "{quoteId}-{projectName}-{date}",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

### Default MaterialPricesConfig
```json
{
  "defaultMarkup": 15,
  "categoryMarkups": {
    "Profile": 20,
    "Glass": 10,
    "Accessory": 15,
    "Rubber": 12,
    "Other": 15
  }
}
```

---

## Integration Notes

### 1. User Isolation
- All template data must be scoped to the authenticated user
- Users can only access/modify their own templates, payment methods, and material prices
- Use `user_id` from the JWT token to filter all queries

### 2. Default Payment Method
- When a user sets a payment method as default (`isDefault: true`), ensure all other payment methods for that user are set to `isDefault: false`
- When retrieving payment methods, always return them sorted with the default first
- If a user has no payment methods, return an empty array

### 3. Price History Tracking
- When updating a material price's `unitPrice`, append to `priceHistory`:
  - Old price value
  - Current timestamp
  - User email (from JWT token)
- Limit price history to the last 50 entries per material price

### 4. Bulk Operations
- For material price import, validate all entries before creating any
- If some entries fail validation, return details about which ones failed
- Use transactions to ensure atomicity

### 5. Error Handling
- Return consistent error format:
```json
{
  "responseMessage": "Error message",
  "message": "Detailed error message",
  "errors": [
    {
      "field": "accountName",
      "message": "Account name is required"
    }
  ]
}
```

### 6. Response Format
- All successful responses should follow the pattern:
```json
{
  "responseMessage": "Success message",
  "response": { /* data */ }
}
```

### 7. Timestamps
- Use ISO 8601 format for all timestamps: `YYYY-MM-DDTHH:mm:ssZ`
- Automatically update `updated_at` on any modification

### 8. UUID Generation
- Use UUID v4 for `payment_methods.id` and `material_prices.id`
- Frontend expects string UUIDs, not integers

---

## Testing Checklist

- [ ] GET `/api/v1/templates` returns default values for new users
- [ ] PUT `/api/v1/templates` creates template on first call, updates on subsequent calls
- [ ] Payment methods CRUD operations work correctly
- [ ] Setting a payment method as default updates other methods correctly
- [ ] Material prices CRUD operations work correctly
- [ ] Price history is tracked when updating material prices
- [ ] Bulk import of material prices works correctly
- [ ] All endpoints require authentication
- [ ] Users can only access their own data
- [ ] Validation errors are returned correctly
- [ ] 404 errors are returned for non-existent resources
- [ ] 403 errors are returned when accessing another user's data

---

## Frontend Integration

The frontend service (`src/services/api/templates.service.ts`) is already configured to call these endpoints. Once the backend is implemented:

1. The frontend will automatically use the API instead of localStorage
2. All template data will be synced across devices
3. Users can access their templates from any device

The frontend includes fallback to localStorage if the API is unavailable, so the feature will continue to work during backend development.

---

## Questions or Clarifications

If you need any clarification on the API requirements, data structures, or integration details, please refer to:
- Frontend types: `src/types/templates.ts`
- Frontend service: `src/services/api/templates.service.ts`
- Frontend store: `src/stores/templateStore.ts`

