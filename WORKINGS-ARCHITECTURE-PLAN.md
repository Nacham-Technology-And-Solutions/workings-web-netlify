# Workings App - Complete Architecture & Implementation Plan

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [Backend API Structure](#3-backend-api-structure)
4. [Calculation Engine Architecture](#4-calculation-engine-architecture)
5. [Subscription & Points System](#5-subscription--points-system)
6. [Email System](#6-email-system)
7. [Frontend Architecture (Reference)](#7-frontend-architecture-reference)
8. [Development Phases & MVP](#8-development-phases--mvp)

---

## 1. Project Overview

**Purpose**: PWA for Nigerian window/door fabricators - a calculation engine + business management tool

**Key Requirements**:

- ✅ Fully functional offline (Service Workers + IndexedDB)
- ✅ Dual calculation engine (Frontend for offline, Backend for verification)
- ✅ 9 Available calculation modules (Windows, Nets, Curtain Walls) + Uncompleted Modules (UM) for future expansion
- ✅ Projects with Glazing Dimensions (collection of configurations)
- ✅ Separate output models: Material List, Cutting List, Glass Cutting List
- ✅ Subscription-based monetization with points system
- ✅ AWS-based hosting

**App Structure**:

- **Project**: Main entity containing project info and Glazing Dimensions
  - Can be created as draft with minimal info (projectName, customer.name, siteAddress)
  - Glazing Dimensions can be added later via update endpoint
- **Glazing Dimensions**: Collection of configurations (Category → Type → Parameters)
  - Optional for draft projects (defaults to empty array)
  - Required for calculation
- **Outputs**: Material List, Cutting List, Glass Cutting List (generated from calculations)
- **Quotes**: Can be generated from project OR created standalone (manual)

**Tech Stack**:

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + PWA capabilities
- **Database**: PostgreSQL (with Prisma ORM)
- **Payment**: Paystack
- **Hosting**: AWS (EC2/EBS)

---

## 2. Database Schema Design

### 2.1 User Model (✅ Already exists, modified)

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  name: string,
  email: string (unique),
  password: string (hashed),
  companyName: string,
  subscriptionStatus: 'free' | 'pro' | 'starter' | 'enterprise', // default: 'free'
  subscriptionExpiresAt: Date,
  pointsBalance: number, // default: subscription-tier allowance
  isAdmin: boolean,
  isActive: boolean,
  bankDetails: {
    accountName: string,
    accountNumber: string,
    bankName: string
  },
  accessToken: string,
  refreshToken: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Project Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  userId: number (ref: User),

  // Project Basic Information (Required for draft)
  projectName: string, // Required
  customer: {
    name: string, // Required
    email?: string, // Optional
    phone?: string, // Optional
    address?: string // Optional
  },
  siteAddress: string, // Required
  description?: string, // Optional

  // Glazing Dimensions (Collection of configurations)
  // Optional - can be empty array for draft projects
  // Can be added later via PATCH /projects/:projectId
  glazingDimensions: [
    {
      glazingCategory: 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall',
      glazingType: string, // e.g., "Casement Window (D/Curve)", "Sliding Window (Standard)"
      moduleId: string, // e.g., "M1_Casement_DCurve" (matches handoff document format)
      parameters: {
        // Varies by glazingType/module
        W?: number,        // Width
        H?: number,        // Height
        N?: number,        // Panels (for casement)
        N_v?: number,      // Vertical panels (for curtain wall)
        N_h?: number,      // Horizontal panels (for curtain wall)
        O?: number,        // Opening panels
        qty?: number,      // Quantity
        in_to_in_width?: number,  // For net modules
        in_to_in_height?: number, // For net modules
        cell_heights?: number[],   // For curtain wall
        cell_width?: number[],     // For curtain wall
        // ... other module-specific parameters
      }
    }
  ], // Optional - defaults to empty array []

  // Global Calculation Settings
  calculationSettings?: {
    stockLength: number, // 6 or 5.58 (meters)
    bladeKerf: number,  // 5 (mm)
    wasteThreshold: number // 200 (mm)
  }, // Optional - can be added later

  // Calculation Status
  calculated: boolean, // Has calculation been run? (default: false)
  lastCalculatedAt: Date | null,

  // Status
  status: 'draft' | 'calculated' | 'archived', // default: 'draft'

  createdAt: Date,
  updatedAt: Date
}
```

**Draft Project Support:**
- Projects can be created with minimal information (projectName, customer.name, siteAddress)
- `glazingDimensions` is optional and defaults to empty array `[]`
- `calculationSettings` is optional
- Projects are created with `status: 'draft'` by default
- Glazing dimensions can be added later via `PATCH /projects/:projectId`
- Calculation requires at least one glazing dimension (returns 400 if empty)

### 2.3 Material List Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  projectId: number (ref: Project),
  userId: number (ref: User),

  // Material List (Consolidated "what to buy")
  materialList: [
    {
      item: string,        // e.g., "Transom (55x55mm)", "Glass Sheet (3310x2140)"
      units: number,       // Total quantity needed
      type: 'Profile' | 'Accessory_Pair' | 'Sheet' | 'Roll' | 'Meter',
      // Optional pricing (can be added later for quotes)
      unitPrice?: number,
      totalPrice?: number
    }
  ],

  // Points cost
  pointsCost: number, // Points deducted for this calculation

  createdAt: Date,
  updatedAt: Date
}
```

### 2.4 Cutting List Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  projectId: number (ref: Project),
  userId: number (ref: User),

  // Cutting List (Smart Cutting Plan)
  cuttingList: [
    {
      profile_name: string, // e.g., "Transom (55x55mm)"
      stock_length: number, // 5850 or 6000 (mm)
      plan: [
        {
          length_1: string[], // ["cut_1900mm", "cut_1900mm", "offcut_255mm"]
          length_2: string[], // ["cut_1400mm", "cut_1400mm", "offcut_230mm"]
          // ... more stock lengths as needed
        }
      ]
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

### 2.5 Glass Cutting List Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  projectId: number (ref: Project),
  userId: number (ref: User),

  // Glass Cutting List (2D Nesting Plan)
  glassList: {
    sheet_type: string, // e.g., "3310x2140mm"
    total_sheets: number,
    cuts: [
      {
        h: number, // Height
        w: number, // Width
        qty: number // Quantity of this size
      }
    ]
  },

  // Rubber Totals (for glazing)
  rubberTotals: [
    {
      name: string, // e.g., "Frame rubber (Transom)"
      total_meters: number
    }
  ],

  // Accessory Totals
  accessoryTotals: [
    {
      name: string, // e.g., "Tapping screw"
      qty: number
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

### 2.6 Quote Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  userId: number (ref: User),
  projectId: number? (optional ref: Project), // Null for standalone quotes

  // Quote Type
  quoteType: 'from_project' | 'standalone',

  // Customer Details
  customerName: string,
  customerAddress: string,
  customerEmail: string,
  quoteNumber: string, // Auto-generated: Q-YYYYMMDD-0001

  // Items (can be from CalculationOutput OR manually entered)
  items: [
    {
      description: string,
      quantity: number,
      unitPrice: number,
      totalPrice: number
    }
  ],

  // Pricing
  subtotal: number,
  tax: number,
  total: number,

  // Status
  status: 'draft' | 'sent' | 'accepted' | 'rejected',

  // PDF
  pdfUrl: string, // S3 URL for generated PDF

  createdAt: Date,
  updatedAt: Date
}
```

### 2.7 Manual Purchase List (Material List) Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  userId: number (ref: User),

  // List Details
  listName: string,
  description: string,

  // Items (manually entered)
  items: [
    {
      materialName: string,
      quantity: number,
      unitPrice: number,
      totalPrice: number
    }
  ],

  // Summary
  totalCost: number,

  // PDF
  pdfUrl: string, // S3 URL for generated PDF

  createdAt: Date,
  updatedAt: Date
}
```

### 2.8 Accessories Catalog Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)

  // Catalog Entry
  name: string, // e.g., "40x40 Angle Bracket"
  category: string, // e.g., "hardware", "glass", "rubber"
  unit: string, // "pc", "meter", "set"

  // Pricing (updated periodically)
  defaultUnitPrice: number,
  priceHistory: [
    {
      price: number,
      date: Date
    }
  ],

  // Usage Context
  applicableTo: [
    'casement',
    'sliding_2sash',
    'sliding_2sash_net',
    'sliding_3track',
    'sliding_3sash'
  ],

  createdAt: Date,
  updatedAt: Date
}
```

### 2.9 Points Transaction Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  userId: number (ref: User),

  // Transaction Type
  type: 'deduction' | 'credit' | 'subscription_renewal',

  // Details
  amount: number, // negative for deduction, positive for credit
  balanceBefore: number,
  balanceAfter: number,

  // Context
  relatedTo: {
    type: 'calculation' | 'quote' | 'subscription',
    referenceId: number
  },

  description: string,

  createdAt: Date
}
```

### 2.10 Subscription History Model

```typescript
{
  id: number, // Auto-increment primary key (Postgres)
  userId: number (ref: User),

  // Subscription Details
  plan: 'free' | 'pro' | 'starter' | 'enterprise',
  billingCycle: 'monthly' | 'yearly',

  // Payment
  amount: number,
  currency: 'NGN',
  paymentProvider: 'paystack',
  paymentReference: string,

  // Dates
  startDate: Date,
  endDate: Date,

  // Status
  status: 'active' | 'expired' | 'cancelled',

  // Webhook Data
  webhookData: object,

  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Backend API Structure

### 3.1 Authentication Domain (`/api/v1/auth`)

- `POST /register` ✅ (Already implemented)
- `POST /log-in` ✅ (Already implemented)
- `POST /log-out`
- `POST /forgot-password` (Step 1: Send reset email)
- `POST /reset-password` (Step 2: Verify token & reset)
- `POST /refresh-token`

### 3.2 User Domain (`/api/v1/user`)

- `GET /:userId` ✅ (Profile retrieval)
- `PATCH /:userId` (Update profile)
- `PATCH /:userId/password` (Change password)
- `PATCH /:userId/bank-details` (Update bank details)
- `GET /:userId/points-history` (Points transaction log)

### 3.3 Projects Domain (`/api/v1/projects`)

- `POST /` (Create project - supports draft projects with minimal info: projectName, customer.name, siteAddress. glazingDimensions is optional)
- `GET /` (List all projects for user, with pagination)
- `GET /:projectId` (Get single project)
- `PATCH /:projectId` (Update project details - can add glazingDimensions to draft projects)
- `DELETE /:projectId` (Delete project)
- `GET /search?q=` (Search projects by name/customer)
- `POST /:projectId/calculate` (Run calculation on project's glazingDimensions - requires at least one glazing dimension)

### 3.4 Material Lists Domain (`/api/v1/material-lists`)

- `GET /project/:projectId` (Get material list for a project)
- `GET /:materialListId` (Get single material list)

### 3.5 Cutting Lists Domain (`/api/v1/cutting-lists`)

- `GET /project/:projectId` (Get cutting list for a project)
- `GET /:cuttingListId` (Get single cutting list)

### 3.6 Glass Cutting Lists Domain (`/api/v1/glass-cutting-lists`)

- `GET /project/:projectId` (Get glass cutting list for a project)
- `GET /:glassCuttingListId` (Get single glass cutting list)

### 3.7 Accessories Catalog Domain (`/api/v1/accessories`) ✅

- `GET /` (List all accessories with optional filtering: category, search, pagination)
- `GET /categories` (Get list of all categories)
- `GET /:id` (Get single accessory by ID)
- `POST /` (Create new accessory)
- `PATCH /:id` (Update accessory)
- `DELETE /:id` (Delete accessory)

### 3.8 Calculations Domain (`/api/v1/calculations`) ✅

- `POST /calculate` ✅ (Backend runs calculation engine - accepts Project Cart format from handoff)
- `POST /verify` ✅ (Verify frontend calculation results against backend calculation)
- `POST /sync` (Main sync endpoint for offline data)

### 3.8 Quotes Domain (`/api/v1/quotes`)

- `POST /` (Create quote from project OR standalone)
- `GET /` (List all quotes)
- `GET /:quoteId` (Get single quote)
- `PATCH /:quoteId` (Update quote)
- `DELETE /:quoteId`
- `POST /:quoteId/generate-pdf` (Generate PDF)
- `POST /:quoteId/send` (Email quote to customer)

### 3.9 Purchase Lists Domain (`/api/v1/purchase-lists`)

- `POST /` (Create manual purchase list)
- `GET /` (List all)
- `GET /:listId`
- `PATCH /:listId`
- `DELETE /:listId`
- `POST /:listId/generate-pdf`

### 3.10 Accessories Catalog Domain (`/api/v1/catalog`)

- `GET /` (Get all accessories with current pricing)
- `GET /:category` (Filter by category)
- `PATCH /:accessoryId` (Admin: Update pricing)

### 3.11 Subscriptions Domain (`/api/v1/subscriptions`)

- `GET /plans` (Get available plans & pricing)
- `POST /subscribe` (Initiate subscription payment)
- `GET /current` (Get user's current subscription)
- `POST /cancel` (Cancel subscription)
- `POST /webhook/paystack` (Payment webhook handler)

### 3.12 Sync Domain (`/api/v1/sync`)

- `POST /` (Single endpoint to sync offline data)

---

## 4. Calculation Engine Architecture

### 4.1 Global Calculation Rules (Constants)

```typescript
// File: src/utils/calculationConstants.ts
export const CALCULATION_CONSTANTS = {
  BLADE_KERF: 5, // mm
  STOCK_LENGTHS: [6, 5.58], // meters
  WASTE_THRESHOLD: 200, // mm
  DEDUCTIONS: {
    CASEMENT: {
      PANEL_HEIGHT: 70, // mm
      PANEL_WIDTH: 70, // mm
      GLASS_HEIGHT: 180, // mm
      GLASS_WIDTH: 110 // mm
    },
    SLIDING_2SASH: {
      JAMB_HEIGHT: 13, // mm
      LOCK_STILE_HEIGHT: 38, // mm
      GLASS_HEIGHT: 118, // mm
      TRACK_WIDTH_DEDUCTION: 166 // mm
    }
    // ... etc
  }
};
```

### 4.2 Mullion Rules (Constants)

```typescript
// File: src/utils/mullionRules.ts
export const MULLION_RULES = {
  1: { twopMullion: 0, threepMullion: 0, totalDeduction: 0 },
  2: { twopMullion: 1, threepMullion: 0, totalDeduction: 32 },
  3: { twopMullion: 1, threepMullion: 1, totalDeduction: 75 },
  4: { twopMullion: 1, threepMullion: 2, totalDeduction: 118 },
  5: { twopMullion: 1, threepMullion: 3, totalDeduction: 161 }
};
```

### 4.3 Calculation Engine Structure

```
src/
  domains/
    calculations/
      engine/
        constants.ts              // Global rules (blade kerf, stock lengths, waste threshold)
        mullionRules.ts          // Mullion rules for casement windows
        cuttingOptimizer.ts      // 1D cutting optimization algorithm
        glassNestingOptimizer.ts // 2D glass/net nesting algorithm
        moduleMapping.ts         // Maps module_id to calculation functions
        index.ts                 // Main calculation orchestrator
        modules/
          windows/
            casement.ts          // Module 1: Casement Window (D/Curve)
            sliding2Sash.ts      // Module 2: Sliding Window (Standard 2-Sash)
            sliding2SashNet.ts   // Module 3: Sliding Window (2-Sash + Fixed Net)
            sliding3Track.ts     // Module 4: Sliding Window (3-Track, 2 Glass + 1 Net)
            sliding3Sash.ts      // Module 5: Sliding Window (3-Sash, All-Glass)
            curtainWall.ts       // Module 9: Curtain Wall Window (Advanced Grid)
          nets/
            net1125_26.ts        // Module 6: 1125/26 Net (1132-panel)
            ebmNet1125_26.ts     // Module 7: EBM-net (1125/26 Frame)
            ebmNetUChannel.ts    // Module 8: EBM-Net (U-Channel)
          doors/                 // [UM] - Placeholder for future modules
          partitions/            // [UM] - Placeholder for future modules
          curtainWalls/          // [UM] - Placeholder for future modules
      controllers/
        calculate.controller.ts  // Main calculation endpoint
        verify.controller.ts     // Verification endpoint
        sync.controller.ts       // Sync endpoint
      schema/
        calculation.schema.ts    // Zod schemas for input/output
      router/
        calculation.router.ts
```

### 4.4 Calculation Engine Interface

**Input Format (matches handoff document):**

```typescript
// File: src/domains/calculations/engine/types.ts

// Project Cart (array of items)
export type ProjectCart = ProjectCartItem[];

export interface ProjectCartItem {
  module_id: string; // e.g., "M1_Casement_DCurve", "M9_Curtain_Wall_Grid"
  // Parameters vary by module
  W?: number;
  H?: number;
  N?: number; // Panels
  O?: number; // Opening panels
  qty?: number;
  N_v?: number; // Vertical panels (curtain wall)
  N_h?: number; // Horizontal panels (curtain wall)
  cell_heights?: number[];
  cell_width?: number[];
  in_to_in_width?: number; // For net modules
  in_to_in_height?: number; // For net modules
  // ... other module-specific parameters
}
```

**Output Format (matches handoff document):**

```typescript
export interface CalculationResult {
  materialList: MaterialListItem[];
  cuttingList: CuttingListItem[];
  glassList: GlassListResult;
  rubberTotals: RubberTotal[];
  accessoryTotals: AccessoryTotal[];
}

export interface MaterialListItem {
  item: string; // e.g., "Transom (55x55mm)"
  units: number; // Total quantity
  type: 'Profile' | 'Accessory_Pair' | 'Sheet' | 'Roll' | 'Meter';
}

export interface CuttingListItem {
  profile_name: string;
  stock_length: number; // 5850 or 6000 (mm)
  plan: {
    [key: string]: string[]; // e.g., { length_1: ["cut_1900mm", "cut_1900mm", "offcut_255mm"] }
  }[];
}

export interface GlassListResult {
  sheet_type: string; // e.g., "3310x2140mm"
  total_sheets: number;
  cuts: {
    h: number;
    w: number;
    qty: number;
  }[];
}

export interface RubberTotal {
  name: string;
  total_meters: number;
}

export interface AccessoryTotal {
  name: string;
  qty: number;
}
```

### 4.5 Module Organization

**Available Modules (from handoff document):**

| Module ID            | Category     | Type                                      | Status       |
| -------------------- | ------------ | ----------------------------------------- | ------------ |
| M1_Casement_DCurve   | Window       | Casement Window (D/Curve)                 | ✅ Available |
| M2_Sliding_2Sash     | Window       | Sliding Window (Standard 2-Sash)          | ✅ Available |
| M3_Sliding_2Sash_Net | Window       | Sliding Window (2-Sash + Fixed Net)       | ✅ Available |
| M4_Sliding_3Track    | Window       | Sliding Window (3-Track, 2 Glass + 1 Net) | ✅ Available |
| M5_Sliding_3Sash     | Window       | Sliding Window (3-Sash, All-Glass)        | ✅ Available |
| M6_Net_1125_26       | Net          | 1125/26 Net (1132-panel)                  | ✅ Available |
| M7_EBM_Net_1125_26   | Net          | EBM-net (1125/26 Frame)                   | ✅ Available |
| M8_EBM_Net_UChannel  | Net          | EBM-Net (U-Channel)                       | ✅ Available |
| M9_Curtain_Wall_Grid | Curtain Wall | Curtain Wall Window (Advanced Grid)       | ✅ Available |

**Uncompleted Modules (UM) - Future Expansion:**

- **Doors**: Sliding Door, Swing Door, Hinge Door, Sensor Door
- **Windows**: EBM Casement Window, EBM Sliding Window, Ghana Sliding Window
- **Partitions**: Width Partitions, 9.9 Partition, 9.6 Partition
- **Curtain Walls**: Transom Curtain Wall, Width and Bead Curtain Wall, EBM Curtain Wall

### 4.6 Example: Casement Calculation Logic

```typescript
// File: src/domains/calculations/engine/modules/windows/casement.ts
export function calculateCasement(item: ProjectCartItem, stockLength: number): Partial<CalculationResult> {
  const { W, H, N, qty } = item; // N = panels, qty = quantity

  // 1. Calculate Profiles (using MULLION_RULES)
  const mullionRule = MULLION_RULES[N];
  const panelHeight = H - DEDUCTIONS.CASEMENT.PANEL_HEIGHT;
  const panelWidth = (W - DEDUCTIONS.CASEMENT.PANEL_WIDTH - mullionRule.totalDeduction) / N;

  // 2. Calculate D/Curve Profile
  const dCurveLength = N * (2 * panelHeight + 2 * panelWidth);

  // 3. Calculate Glass
  const glassHeight = H - DEDUCTIONS.CASEMENT.GLASS_HEIGHT;
  const glassWidth = panelWidth - DEDUCTIONS.CASEMENT.GLASS_WIDTH;

  // 4. Calculate Accessories
  const accessories = calculateAccessories(N, glassWidth, glassHeight);

  // 5. Generate Cutting Plan
  const cuttingPlan = optimizeCutting({
    required: [
      { length: W, quantity: 2 * qty },
      { length: H, quantity: 2 * qty },
      { length: H - 70, quantity: mullionRule.twopMullion * qty },
      // ... etc
    ],
    stockLength: stockLength * 1000 // Convert to mm
  });

  // Return partial result (will be consolidated with other items)
  return {
    materialList: [...],
    cuttingList: [...],
    glassList: {...},
    rubberTotals: [...],
    accessoryTotals: [...]
  };
}
```

---

## 5. Subscription & Points System

### 5.1 Points-Based Usage Model

**Why Points?**

- Prevent freelancer abuse (30+ projects/month)
- Encourage professional users (2-5 projects/month)
- Flexible monetization

**Suggested Tiers:**

| Tier       | Monthly Cost | Points/Month | Projects Limit | Product Modules           |
| ---------- | ------------ | ------------ | -------------- | ------------------------- |
| Free       | ₦0           | 50           | 2 projects     | Casement only             |
| Starter    | ₦5,000       | 200          | 10 projects    | Casement + Sliding 2-Sash |
| Pro        | ₦15,000      | 500          | 30 projects    | All modules               |
| Enterprise | ₦50,000      | Unlimited    | Unlimited      | All modules + API access  |

### 5.2 Points Consumption Rules

```typescript
const POINTS_COST = {
  CALCULATION: {
    CASEMENT: 5,
    SLIDING_2SASH: 5,
    SLIDING_2SASH_NET: 8,
    SLIDING_3TRACK: 8,
    SLIDING_3SASH: 10
  },
  QUOTE_GENERATION: 3,
  PURCHASE_LIST_GENERATION: 2,
  PDF_DOWNLOAD: 1
};
```

### 5.3 Points Logic Implementation

```typescript
// Before calculation/quote generation:
1. Check if user has enough points
2. If insufficient → return 402 Payment Required with upgrade prompt
3. If sufficient → Deduct points
4. Log transaction in PointsTransaction collection
```

---

## 6. Email System

### 6.1 AWS SES Setup

- Configure AWS SES for transactional emails
- Domain verification required
- Use AWS SDK for Node.js (?aws-sdk?)

### 6.2 Email Templates

```typescript
src / utils / email / templates / password - reset.html;
quote - sent.html;
subscription - confirmed.html;
sendEmail.ts;
```

### 6.3 Email Triggers

- Password reset link
- Quote sent to customer
- Subscription confirmation
- Points running low warning

---

## 7. Frontend Architecture (Reference)

**Note**: Frontend is separate repo, but backend must support these patterns.

### 7.1 Offline-First Flow

```
1. User creates project offline → Saved to IndexedDB
2. Calculation runs in browser → Results in IndexedDB
3. User is back online → Picit/sync button appears
4. Frontend sends project data to POST /api/v1/sync
5. Backend verifies calculations, saves to PostgreSQL
6. User gets confirmation
```

### 7.2 Frontend → Backend Data Flow

**Project Creation (Draft Support):**

```typescript
// Option 1: Create draft project with minimal information
POST /api/v1/projects
{
  projectName: "Residential Windows",
  customer: { name: "John Doe" }, // Only name is required
  siteAddress: "123 Main St", // Required
  description: "Window installation project" // Optional
  // glazingDimensions and calculationSettings can be omitted for drafts
}

// Option 2: Create project with full information (including glazingDimensions)
POST /api/v1/projects
{
  projectName: "Residential Windows",
  customer: { 
    name: "John Doe", 
    email: "john@example.com", // Optional
    phone: "+2348012345678", // Optional
    address: "123 Main St" // Optional
  },
  siteAddress: "123 Main St",
  description: "Window installation project", // Optional
  glazingDimensions: [ // Optional - can be added later via PATCH
    {
      glazingCategory: "Window",
      glazingType: "Casement Window (D/Curve)",
      moduleId: "M1_Casement_DCurve",
      parameters: { W: 1200, H: 1500, N: 2, qty: 5 }
    }
  ],
  calculationSettings: { // Optional - can be added later
    stockLength: 6,
    bladeKerf: 5,
    wasteThreshold: 200
  }
}

// Add glazing dimensions to draft project later:
PATCH /api/v1/projects/:projectId
{
  glazingDimensions: [
    {
      glazingCategory: "Window",
      glazingType: "Casement Window (D/Curve)",
      moduleId: "M1_Casement_DCurve",
      parameters: { W: 1200, H: 1500, N: 2, qty: 5 }
    }
  ],
  calculationSettings: {
    stockLength: 6,
    bladeKerf: 5,
    wasteThreshold: 200
  }
}
```

**Calculation Request:**

```typescript
// Frontend sends Project Cart format (matches handoff document):
POST /api/v1/projects/:projectId/calculate
// OR
POST /api/v1/calculations/calculate
[
  {
    module_id: "M1_Casement_DCurve",
    W: 1200,
    H: 1200,
    N: 2,
    O: 2,
    qty: 5
  }
]

// Backend returns CalculationResult (matches handoff document format):
{
  materialList: [...],
  cuttingList: [...],
  glassList: {...},
  rubberTotals: [...],
  accessoryTotals: [...]
}
```

**Sync Flow:**

```typescript
// Frontend sends project data (inputs only, never results):
// Can include draft projects (with empty glazingDimensions)
POST /api/v1/sync
{
  projects: [
    {
      projectName: "...",
      customer: { name: "..." },
      siteAddress: "...",
      description: "...", // Optional
      glazingDimensions: [...], // Optional - can be empty array for drafts
      calculationSettings: { ... } // Optional
    }
  ]
}

// Backend:
// 1. Creates/updates projects in PostgreSQL
// 2. For projects with glazingDimensions: Runs calculation engine
// 3. Generates MaterialList, CuttingList, GlassCuttingList (if glazingDimensions exist)
// 4. Saves all to PostgreSQL
// 5. Returns confirmation
// Note: Draft projects (no glazingDimensions) are saved but not calculated
```

---

## 8. Development Phases & MVP

### Phase 1: Foundation (Week 1-2)

**Backend Tasks:**

- [x] Auth registration with companyName, subscriptionStatus
- [x] Update Prisma schema: Add missing User fields (pointsBalance, bankDetails, subscriptionExpiresAt)
- [x] Run Prisma migration
- [x] Auth login flow
- [x] Password reset flow (forgot-password, reset-password)
- [x] Auth logout flow
- [x] Auth refresh token flow
- [x] User profile update endpoints
  - [x] PATCH /api/v1/user/:userId (Update profile: name, email, companyName)
  - [x] PATCH /api/v1/user/:userId/password (Change password)
  - [x] PATCH /api/v1/user/:userId/bank-details (Update bank details)
  - [x] GET /api/v1/user/:userId/points-history (Get points transaction history)
- [x] Points balance & transaction system (Prisma models - PointsTransaction model created)
- [x] Points deduction middleware/logic (✅ Implemented before calculations)
- [x] Email setup (✅ Configured with webmail from glazeworkings.com - can upgrade to AWS SES later)

**Frontend Tasks:**

- [x] Project setup (React + TypeScript + Vite) ✅
- [x] Design system implementation (Exo font, color palette, component styles) ✅
- [x] UI Kit components (Button, Input, Card components) ✅
- [x] Onboarding carousel (multi-screen with swipe animation) ✅
- [x] Registration screen (8-step form with validation) ✅
- [x] Login screen (form with remember me functionality) ✅
- [x] Forgot password flow (ForgotPasswordScreen + ResetPasswordScreen) ✅
- [x] Basic routing setup (View-based routing in App.tsx) ✅
- [x] LocalStorage setup and configuration ✅ (IndexedDB pending for full offline support)
- [ ] Service Worker registration (PWA features pending)

### Phase 2: Core Calculation Engine (Week 3-4) ✅ COMPLETED

**Backend Tasks:**

- [x] Calculation constants & mullion rules
- [x] Cutting optimizer algorithm (1D optimization)
- [x] Glass nesting optimizer (2D optimization)
- [x] Module mapping system (module_id → calculation function)
- [x] Calculation orchestrator (processes Project Cart array)
- [x] Available modules implementation:
  - [x] Module 1: Casement Window (D/Curve)
  - [x] Module 2: Sliding Window (Standard 2-Sash)
  - [x] Module 3: Sliding Window (2-Sash + Fixed Net)
  - [x] Module 4: Sliding Window (3-Track, 2 Glass + 1 Net)
  - [x] Module 5: Sliding Window (3-Sash, All-Glass)
  - [x] Module 6: 1125/26 Net (1132-panel)
  - [x] Module 7: EBM-net (1125/26 Frame)
  - [x] Module 8: EBM-Net (U-Channel)
  - [x] Module 9: Curtain Wall Window (Advanced Grid)
- [x] Calculation result consolidation (combines results from multiple items)
- [x] Calculation API endpoint (POST /api/v1/calculations/calculate)
- [x] Points deduction middleware/logic (implemented before calculations)
- [x] Verification controller (for frontend calculation verification)
- [x] Accessories catalog setup (Prisma model + CRUD endpoints)

**Frontend Tasks:**

- [ ] Calculation engine implementation (TypeScript functions) ⚠️ PENDING
  - [ ] Global calculation constants (backend handles this)
  - [ ] Mullion rules logic (backend handles this)
  - [x] Module mapping (module_id → function) ✅ (`src/utils/moduleMapping.ts`)
  - [ ] All 9 available modules calculation functions (backend handles this, frontend calls API)
  - [ ] Cutting optimizer algorithm (backend handles this)
  - [ ] Glass nesting optimizer (backend handles this)
  - [ ] Result consolidation logic (backend handles this)
- [x] API integration for calculations ✅ (`src/services/api/calculations.service.ts`)
- [x] Dashboard layout (hamburger menu, FAB button) ✅ (`Header.tsx`, `HomeScreen.tsx`)
- [x] Side navigation drawer (all menu items) ✅ (`Sidebar.tsx`)
- [x] Project list screen (UI with cards and advanced search) ✅ (`ProjectsScreen.tsx`, `ProjectCard.tsx`)
- [x] API integration setup (axios configuration) ✅ (`src/services/api/apiClient.ts`)

### Phase 3: Projects & Data Sync (Week 5-6) ✅ COMPLETED

**Backend Tasks:**

- [x] Prisma schema: Add Project model (with glazingDimensions JSON field) ✅
- [x] Prisma schema: Add MaterialList, CuttingList, GlassCuttingList models ✅
- [x] Run Prisma migrations ✅
- [x] Project CRUD endpoints (with glazingDimensions structure) ✅
- [x] Draft project support (minimal info: projectName, customer.name, siteAddress) ✅
- [x] Optional glazingDimensions for draft projects ✅
- [x] Material List model & endpoints (Prisma) ✅
- [x] Cutting List model & endpoints (Prisma) ✅
- [x] Glass Cutting List model & endpoints (Prisma) ✅
- [x] Project calculation endpoint (POST /:projectId/calculate) ✅
- [x] Calculation result storage (saves to 3 separate output models in PostgreSQL) ✅
- [x] Sync endpoint for offline data (accepts Project Cart format) ✅
- [ ] Conflict resolution logic (Optional - can be added later if needed)

**Frontend Tasks:**

- [x] Project Wizard (Multi-step form) ✅
  - [x] Step 1: Project Description (Project name, Customer name, Site address, Description) ✅ (`ProjectDescriptionScreen.tsx`)
    - [x] Supports draft project creation (can save with minimal info) ✅
    - [x] Customer email, phone, address are optional ✅
  - [x] Step 2: Glazing Dimensions Builder ✅ (`SelectProjectScreen.tsx`, `ProjectMeasurementScreen.tsx`)
    - [x] Add Glazing Dimension button ✅
    - [x] Category selection (Window/Door/Net/Partition/Curtain Wall) ✅
    - [x] Type selection (based on category) ✅
    - [x] Parameters input (varies by type) ✅
    - [x] Quantity input ✅
    - [x] Live Project Schedule table (shows all added dimensions) ✅
    - [x] Can be skipped for draft projects (glazingDimensions optional) ✅
  - [x] Step 3: Calculation Settings (Stock length, Blade kerf, Waste threshold) ✅ (integrated in measurement screen)
    - [x] Optional - can be added later ✅
  - [x] Calculate Now button & calculation execution ✅ (`ProjectSolutionScreen.tsx`)
    - [x] Requires at least one glazing dimension ✅
  - [x] Step 4: Project Solution (Results display with 3 tabs) ✅ (`ProjectSolutionScreen.tsx`)
- [x] Material List tab (displays consolidated material list) ✅
- [x] Cutting List tab (displays smart cutting plan) ✅
- [x] Glass Cutting List tab (displays 2D nesting plan + rubber/accessory totals) ✅
- [x] LocalStorage storage for projects ✅ (IndexedDB pending for full offline support)
- [ ] Offline/Online detection (PWA features pending)
- [x] Sync button & logic (syncStore exists, ready for API integration) ✅
- [x] Project list fetching & display ✅ (`ProjectsScreen.tsx` with advanced search)

### Phase 4: Quotes & PDFs (Week 7-8) ✅ COMPLETED

**Backend Tasks:**

- [x] Quote CRUD endpoints ✅
- [x] PDF generation (pdfmake) ✅
- [ ] S3 integration for PDF storage (Optional - using local storage for MVP)
- [x] Email sending for quotes ✅

**Frontend Tasks:**

- [x] Quote creation screen (from project OR standalone) ✅ (`NewProjectScreen.tsx` - Quote Configuration)
- [x] Quote preview screen (formatted layout) ✅ (`QuotePreviewScreen.tsx`)
- [x] PDF generation (frontend PDF export using jsPDF) ✅ (`exportService.ts`)
- [x] PDF download handling ✅
- [ ] Email sending UI (backend integration pending)
- [x] Quote list screen (display all quotes) ✅ (`QuotesScreen.tsx`, `QuoteCard.tsx`)
- [x] Material Lists screen (manual list creation) ✅ (`MaterialListScreen.tsx`, `CreateMaterialListScreen.tsx`)
- [x] Material List creation form (dynamic table) ✅
- [x] Material List dashboard ✅ (`MaterialListScreen.tsx`, `MaterialListDetailScreen.tsx`)

### Phase 5: Subscriptions & Payments (Week 9-10) ✅ COMPLETED

**Backend Tasks:**

- [x] Prisma schema: Add SubscriptionHistory model ✅
- [x] Payment gateway integration (Paystack only) ✅
- [x] Paystack webhook handler ✅
- [x] Subscription management (Prisma) ✅
- [x] Points replenishment on payment ✅

**Frontend Tasks:**

- [x] Subscription screen (plan comparison table) ✅ (`SubscriptionPlanScreen.tsx`)
- [ ] Monthly/Yearly toggle (UI ready, payment integration pending)
- [ ] "Subscribe Now" button integration with Paystack SDK (pending)
- [ ] Payment flow (Paystack popup modal) (pending)
- [ ] Points balance display (header component) (pending)
- [ ] Points history screen (pending)
- [ ] Low points warning component (pending)
- [x] Settings screen (list menu) ✅ (`SettingsScreen.tsx`)
- [x] Profile screen (form for editing user info) ✅ (`ProfileScreen.tsx`)
- [ ] Bank details form (backend integration pending)
- [x] Help & Tips screen (accordion FAQ) ✅ (`HelpAndTipsScreen.tsx`)

### Phase 6: Polish & Testing (Week 11-12) ⚠️ IN PROGRESS

**Backend Tasks:**

- [x] Remaining calculation modules (Sliding variants) ✅ (All 9 modules completed in Phase 2)
  - [x] Sliding 2-Sash + Fixed Net ✅ (Module 3)
  - [x] Sliding 3-Track (2 Glass + 1 Net) ✅ (Module 4)
  - [x] Sliding 3-Sash (All-Glass) ✅ (Module 5)
- [ ] Manual purchase list endpoints
- [ ] Admin endpoints for catalog management (enhanced)
- [ ] Comprehensive testing
- [ ] Deployment preparation (AWS setup, environment variables)

**Frontend Tasks:**

- [x] Calculation modules integration (frontend calls backend API) ✅ (All 9 modules supported via API)
- [x] Project Type dropdown (all categories supported) ✅
- [ ] Comprehensive offline testing (IndexedDB + Service Worker pending)
- [ ] Sync conflict resolution UI (pending)
- [x] Loading states & error handling throughout ✅ (implemented across all screens)
- [x] Responsive design ✅ (mobile/tablet/desktop support)
- [ ] PWA installation prompt (Service Worker registration pending)
- [x] Performance optimization ✅ (useMemo, useCallback, efficient rendering)
- [ ] Cross-browser testing (pending)
- [ ] User acceptance testing (UAT) with fabricators (pending)

---

## 9. Key Changes Summary

### 9.1 Structural Changes

1. **Project Model Restructure**

   - ✅ Changed from single `projectType` to `glazingDimensions` array
   - ✅ Added `glazingCategory` and `glazingType` hierarchy
   - ✅ Parameters now vary by module (matches handoff document)

2. **Output Models Split**

   - ✅ Removed single `CalculationOutput` model
   - ✅ Created 3 separate models: `MaterialList`, `CuttingList`, `GlassCuttingList`
   - ✅ Matches handoff document output format exactly

3. **Draft Project Support**

   - ✅ Projects can be created with minimal information (projectName, customer.name, siteAddress)
   - ✅ `glazingDimensions` is optional (defaults to empty array)
   - ✅ `calculationSettings` is optional
   - ✅ Projects default to `status: 'draft'`
   - ✅ Glazing dimensions can be added later via PATCH endpoint
   - ✅ Calculation requires at least one glazing dimension

3. **Module Organization**

   - ✅ Organized by Category → Type hierarchy
   - ✅ 9 Available modules (Windows, Nets, Curtain Walls)
   - ✅ Placeholder structure for Uncompleted Modules (UM)

4. **Input/Output Format**
   - ✅ Input: Project Cart format (matches handoff document)
   - ✅ Output: Material List, Cutting List, Glass List format (matches handoff document)

### 9.2 Immediate Fixes Required

1. **`src/app.ts`**

   - ✅ Currently using Postgres connection (correct)
   - ✅ Ensure Prisma is properly configured
   - ✅ Verify database connection works

2. **User Model**
   - ✅ Already has `companyName` and `subscriptionStatus`
   - ✅ Has `pointsBalance`, `bankDetails`, `subscriptionExpiresAt`
   - ✅ All required fields implemented

### 9.3 New Domains to Create

1. `src/domains/project/` - ✅ Project CRUD with glazingDimensions (COMPLETED - Phase 3)
   - ✅ Supports draft projects with minimal information
   - ✅ glazingDimensions optional for draft creation
2. `src/domains/material-list/` - ✅ Material List model & endpoints (COMPLETED - Phase 3)
3. `src/domains/cutting-list/` - ✅ Cutting List model & endpoints (COMPLETED - Phase 3)
4. `src/domains/glass-cutting-list/` - ✅ Glass Cutting List model & endpoints (COMPLETED - Phase 3)
5. `src/domains/calculations/` - ✅ Calculation engine with module organization (COMPLETED - Phase 2)
6. `src/domains/quote/` - ✅ Quote generation (from project OR standalone) (COMPLETED - Phase 4)
7. `src/domains/subscriptions/` - ✅ Subscription management with Paystack integration (COMPLETED - Phase 5)

---

## Next Steps for Backend Development

### ✅ Immediate Priority (Before Phase 1) - COMPLETED

1. **Verify Database Connection**

   - ✅ Confirm `app.ts` is using Postgres (already correct)
   - ✅ Test PostgreSQL connection
   - ✅ Verify Prisma schema is up to date
   - ✅ Verify user registration/login works

2. **Update User Model (Prisma Schema)**
   - ✅ Add `pointsBalance` field (default: subscription-tier allowance)
   - ✅ Add `bankDetails` JSON field
   - ✅ Add `subscriptionExpiresAt` field
   - ✅ Run Prisma migration

### ✅ Phase 1: Foundation (Week 1-2) - COMPLETED

1. **Complete Auth Flow** - ✅ COMPLETED

   - ✅ Implement login controller
   - ✅ Add password reset endpoints (forgot-password, reset-password)
   - ✅ Add logout endpoint
   - ✅ Add refresh token endpoint
   - ✅ Test with Postman environment

2. **User Domain Endpoints** - ✅ COMPLETED

   - ✅ Update profile endpoint (PATCH /:userId)
   - ✅ Change password endpoint (PATCH /:userId/password)
   - ✅ Update bank details endpoint (PATCH /:userId/bank-details)
   - ✅ Get points history endpoint (GET /:userId/points-history)

3. **Points System Foundation** - ✅ COMPLETED

   - ✅ Create PointsTransaction model
   - ✅ Points transaction service (`pointsTransaction.service.ts`)
   - ✅ Points balance check middleware (`points.checkBalance.middleware.ts`)
   - ✅ Points deduction helper (`points.deductAfterOperation.ts`)
   - ✅ Points costs constants (`pointsCosts.ts`)
   - ⏭️ Integrate points deduction with calculation endpoints (Ready for Phase 3)

4. **Email Setup** - ✅ COMPLETED
   - ✅ Configured with webmail from glazeworkings.com (nodemailer)
   - ✅ Email templates and sending functionality implemented
   - ⏭️ Can upgrade to AWS SES later for production scaling

### ✅ Phase 2: Core Calculation Engine (Week 3-4) - COMPLETED

1. **Create Calculation Engine Structure** ✅

   - ✅ Set up module organization (windows/, nets/, etc.)
   - ✅ Implement constants and optimizers
   - ✅ Create module mapping system
   - ✅ Create calculation orchestrator
   - ✅ Implement result consolidation logic

2. **Implement Available Modules** ✅

   - ✅ Module 1: Casement Window (D/Curve)
   - ✅ Module 2: Sliding Window (Standard 2-Sash)
   - ✅ Module 3: Sliding Window (2-Sash + Fixed Net)
   - ✅ Module 4: Sliding Window (3-Track, 2 Glass + 1 Net)
   - ✅ Module 5: Sliding Window (3-Sash, All-Glass)
   - ✅ Module 6: 1125/26 Net (1132-panel)
   - ✅ Module 7: EBM-net (1125/26 Frame)
   - ✅ Module 8: EBM-Net (U-Channel)
   - ✅ Module 9: Curtain Wall Window (Advanced Grid)

3. **API Integration** ✅
   - ✅ Calculation endpoint (POST /api/v1/calculations/calculate)
   - ✅ Request/response schema validation
   - ✅ Error handling

**Next Phase: Phase 3 - Projects & Data Sync**

### ✅ Phase 1 Review - COMPLETED

**Points Deduction Middleware/Logic**: ✅ COMPLETED
- ✅ Points balance check middleware implemented
- ✅ Points deduction helper implemented
- ✅ Points costs constants defined
- ✅ Points transaction service created
- ✅ Ready for integration with calculation endpoints

**Email Service**: ✅ COMPLETED
- ✅ Configured with webmail from glazeworkings.com
- ✅ Nodemailer integration for transactional emails
- ✅ Email templates and sending functionality implemented
- ⏭️ Can upgrade to AWS SES later for production scaling

### 📊 Current Status Summary

**Backend Progress:**
- ✅ Phase 1: Foundation - COMPLETE
  - ✅ Auth system (register, login, password reset, logout, refresh token)
  - ✅ User profile endpoints (update profile, change password, bank details, points history)
  - ✅ Points system (transaction model, balance check middleware, deduction logic)
  - ✅ Email service (webmail configuration with nodemailer)
- ✅ Phase 2: Core Calculation Engine - COMPLETE
  - ✅ All 9 calculation modules implemented
  - ✅ Calculation API endpoints (calculate, verify)
  - ✅ Accessories catalog setup
- ✅ Phase 3: Projects & Data Sync - COMPLETE
  - [x] Project model & CRUD endpoints ✅
  - [x] Draft project support (minimal info: projectName, customer.name, siteAddress) ✅
  - [x] Optional glazingDimensions for draft projects ✅
  - [x] MaterialList, CuttingList, GlassCuttingList models ✅
  - [x] Material Lists, Cutting Lists, Glass Cutting Lists GET endpoints ✅
  - [x] Sync endpoint for offline data ✅
- ✅ Phase 4: Quotes & PDFs - COMPLETE
  - [x] Quote model & CRUD endpoints ✅
  - [x] PDF generation (pdfmake) ✅
  - [x] Email sending for quotes ✅
  - [x] Quote number generation ✅
  - [x] Points deduction for quotes ✅
- ✅ Phase 5: Subscriptions & Payments - COMPLETE
  - [x] SubscriptionHistory model ✅
  - [x] Paystack payment gateway integration ✅
  - [x] Paystack webhook handler ✅
  - [x] Subscription management endpoints ✅
  - [x] Points replenishment on payment ✅
- ⚠️ Phase 6: Polish & Testing - IN PROGRESS (~30%)
  - [x] All calculation modules (completed in Phase 2) ✅
  - [ ] Manual purchase list endpoints
  - [ ] Enhanced admin endpoints
  - [ ] Comprehensive testing
  - [ ] Deployment preparation

**Frontend Progress:**
- ✅ Phase 1: Foundation - ~90% COMPLETE
  - ✅ Project setup (React + TypeScript + Vite)
  - ✅ Design system & UI components
  - ✅ Authentication screens (login, registration, password reset)
  - ✅ Onboarding flow
  - ✅ Routing system
  - ⚠️ IndexedDB setup (using localStorage currently)
  - ⚠️ Service Worker registration (PWA features pending)
- ✅ Phase 2: Core Features - ~85% COMPLETE
  - ✅ Dashboard layout & navigation
  - ✅ Project list screen with advanced search
  - ✅ API integration (axios setup)
  - ✅ Module mapping utility
  - ⚠️ Frontend calculation engine (using backend API instead)
- ✅ Phase 3: Projects & Data Sync - ~95% COMPLETE
  - ✅ Project Wizard (4-step process)
  - ✅ Material List, Cutting List, Glass Cutting List tabs
  - ✅ Calculation execution & results display
  - ✅ Sync store setup
  - ⚠️ IndexedDB for offline storage (using localStorage)
  - ⚠️ Offline/Online detection
- ✅ Phase 4: Quotes & PDFs - ~90% COMPLETE
  - ✅ Quote creation screens (3-tab interface)
  - ✅ Quote preview & detail screens
  - ✅ PDF & Excel export functionality
  - ✅ Material Lists management
  - ⚠️ Email sending UI (backend integration pending)
- ⚠️ Phase 5: Subscriptions & Payments - ~50% COMPLETE
  - ✅ Settings screen
  - ✅ Profile screen
  - ✅ Help & Tips screen
  - ✅ Subscription plans screen (UI only)
  - ⚠️ Payment integration (Paystack SDK pending)
  - ⚠️ Points balance display
  - ⚠️ Points history screen
- ✅ Phase 6: Polish & Testing - ~75% COMPLETE
  - ✅ Loading states & error handling
  - ✅ Responsive design
  - ✅ Performance optimization
  - ⚠️ PWA features (Service Worker, IndexedDB)
  - ⚠️ Cross-browser testing
  - ⚠️ UAT with fabricators

### 🎯 Key Pending Items

**High Priority (Backend):**
1. **Manual Purchase Lists**: Create endpoints for manual purchase list management
2. **Testing**: Comprehensive unit and integration tests
3. **Deployment Preparation**: AWS setup guides and documentation

**High Priority (Frontend):**
1. **PWA Features**: IndexedDB setup & Service Worker registration for full offline support
2. **Payment Integration**: Paystack SDK integration for subscriptions (backend ready)
3. **Points UI**: Points balance display & history screen

**Medium Priority:**
1. Email sending UI for quotes
2. Offline/Online detection
3. Sync conflict resolution UI
4. Cross-browser testing

**Low Priority:**
1. AWS SES upgrade (currently using webmail)
2. Frontend calculation engine (optional, backend handles this)

