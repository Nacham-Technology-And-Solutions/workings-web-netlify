# Pre-Built Templates Screen - Implementation Plan

## Overview
Create a standalone Pre-Built Templates screen accessible from the Sidebar navigation. This screen will allow users to configure:
1. Quote Format
2. Payment Method for Quotes
3. PDF Export Format
4. Custom Prices for Material Lists

## Architecture

### File Structure
```
src/
├── components/
│   └── features/
│       └── PreBuiltTemplatesScreen.tsx (NEW)
│           └── components/
│               ├── QuoteFormatSection.tsx (NEW)
│               ├── PaymentMethodSection.tsx (NEW)
│               ├── PDFExportSection.tsx (NEW)
│               └── MaterialPricesSection.tsx (NEW)
├── stores/
│   └── templateStore.ts (NEW) - Zustand store for template configurations
├── services/
│   └── api/
│       └── templates.service.ts (NEW) - API service for saving/loading templates
└── types/
    └── templates.ts (NEW) - TypeScript types for template configurations
```

## Component Structure

### 1. PreBuiltTemplatesScreen.tsx (Main Container)
**Purpose**: Main screen container with tabbed navigation
**Features**:
- Tab navigation between 4 main sections
- Save/Cancel buttons
- Header with title and description
- Responsive layout

**Props**:
```typescript
interface PreBuiltTemplatesScreenProps {
  onBack: () => void;
}
```

**State Management**:
- Active tab state
- Form dirty state (to show unsaved changes warning)
- Loading state for save operations

### 2. QuoteFormatSection.tsx
**Purpose**: Configure quote appearance and layout
**Configuration Options**:

#### Header/Footer Settings
- Company Logo Upload
  - Image upload component
  - Preview thumbnail
  - Remove logo option
  - Max file size validation
- Header Text
  - Company Name (text input)
  - Tagline/Subtitle (text input)
  - Header alignment (left/center/right)
- Footer Text
  - Footer content (textarea)
  - Footer alignment
  - Show/hide footer toggle

#### Layout Options
- Color Scheme
  - Primary color picker
  - Secondary color picker
  - Accent color picker
  - Preview swatches
- Typography
  - Font family dropdown (Arial, Helvetica, Times New Roman, etc.)
  - Heading font size (slider/input)
  - Body font size (slider/input)
- Page Settings
  - Page orientation (Portrait/Landscape radio buttons)
  - Margin settings (top, bottom, left, right inputs)
  - Spacing between sections (slider)

#### Section Visibility & Ordering
- Toggle switches for each section:
  - Project Information
  - Customer Details
  - Items Table
  - Summary/Charges
  - Payment Information
  - Additional Notes
- Drag-and-drop or up/down arrows for section ordering
- Preview button to see quote with current settings

**Data Structure**:
```typescript
interface QuoteFormatConfig {
  header: {
    logoUrl?: string;
    companyName: string;
    tagline?: string;
    alignment: 'left' | 'center' | 'right';
  };
  footer: {
    content: string;
    alignment: 'left' | 'center' | 'right';
    visible: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingSize: number;
    bodySize: number;
  };
  page: {
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    sectionSpacing: number;
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

### 3. PaymentMethodSection.tsx
**Purpose**: Manage default payment methods for quotes
**Features**:

#### Payment Methods List
- Table/list of saved payment methods
- Columns: Account Name, Account Number, Bank Name, Default badge
- Actions: Edit, Delete, Set as Default
- Add New button

#### Add/Edit Payment Method Modal
- Form fields:
  - Account Name (required, text input)
  - Account Number (required, text input)
  - Bank Name (required, text input)
- Default checkbox (only one can be default)
- Save/Cancel buttons
- Validation:
  - All fields required
  - Account number format validation (optional)

#### Display Options
- Toggle: Show payment method in quote preview
- Toggle: Show payment method in PDF export
- Custom payment instructions textarea
  - Rich text editor or plain textarea
  - Preview in quote

**Data Structure**:
```typescript
interface PaymentMethod {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethodConfig {
  methods: PaymentMethod[];
  displayOptions: {
    showInPreview: boolean;
    showInPDF: boolean;
    customInstructions?: string;
  };
}
```

### 4. PDFExportSection.tsx
**Purpose**: Configure PDF export formats for quotes and material lists
**Features**:

#### Quote PDF Settings
- Page Settings
  - Page size dropdown (A4, Letter, Legal, A3, Custom)
  - Custom page size inputs (width, height, unit)
  - Orientation (Portrait/Landscape)
- Header/Footer in PDF
  - Include header toggle
  - Include footer toggle
  - Header height input
  - Footer height input
- Logo in PDF
  - Include logo toggle
  - Logo size (small/medium/large)
  - Logo position (top-left/top-center/top-right)
- Font Settings
  - Font family dropdown
  - Font size inputs (heading, body, table)
  - Font color pickers

#### Material List PDF Settings
- Similar settings as Quote PDF
- Additional:
  - Include cutting list toggle
  - Cutting list format (table/list)
  - Include glass list toggle

#### Export File Naming
- Naming pattern builder
  - Available variables: {quoteId}, {projectName}, {customerName}, {date}, {quoteNumber}
  - Preview of generated filename
  - Example: "Quote-{quoteId}-{projectName}.pdf"
- Date format dropdown
  - Options: YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, etc.

**Data Structure**:
```typescript
interface PDFExportConfig {
  quote: {
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'Custom';
    customSize?: { width: number; height: number; unit: 'mm' | 'in' };
    orientation: 'portrait' | 'landscape';
    header: {
      enabled: boolean;
      height: number;
    };
    footer: {
      enabled: boolean;
      height: number;
    };
    logo: {
      enabled: boolean;
      size: 'small' | 'medium' | 'large';
      position: 'top-left' | 'top-center' | 'top-right';
    };
    fonts: {
      family: string;
      headingSize: number;
      bodySize: number;
      tableSize: number;
      headingColor: string;
      bodyColor: string;
    };
  };
  materialList: {
    // Similar structure as quote
    includeCuttingList: boolean;
    cuttingListFormat: 'table' | 'list';
    includeGlassList: boolean;
  };
  fileNaming: {
    pattern: string;
    dateFormat: string;
  };
}
```

### 5. MaterialPricesSection.tsx
**Purpose**: Manage custom prices for material lists
**Features**:

#### Material Prices Library
- Search/Filter bar
  - Search by material name
  - Filter by category
  - Filter by unit
- Material List Table
  - Columns: Material Name, Category, Unit, Unit Price, Last Updated, Actions
  - Sortable columns
  - Pagination (if many items)
- Bulk Actions
  - Select all checkbox
  - Bulk edit prices
  - Bulk delete
  - Export selected

#### Add/Edit Material Modal
- Form fields:
  - Material Name (required, text input)
  - Category dropdown (Profile, Glass, Accessory, Rubber, Other)
  - Unit dropdown (m, ft, pcs, kg, etc.)
  - Unit Price (required, number input with currency)
  - Description (optional, textarea)
- Save/Cancel buttons
- Validation:
  - Material name required
  - Unit price must be positive number

#### Import/Export
- Import from CSV/Excel
  - File upload component
  - Column mapping interface
  - Preview imported data
  - Confirm import button
- Export to CSV/Excel
  - Export all button
  - Export selected button
  - Choose format (CSV/Excel)

#### Price Management
- Price History (optional feature)
  - View price changes over time
  - Revert to previous price
- Markup/Margin Settings
  - Default markup percentage
  - Apply markup to all prices
  - Category-specific markups

**Data Structure**:
```typescript
interface MaterialPrice {
  id: string;
  name: string;
  category: 'Profile' | 'Glass' | 'Accessory' | 'Rubber' | 'Other';
  unit: string;
  unitPrice: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  priceHistory?: Array<{
    price: number;
    date: string;
    changedBy?: string;
  }>;
}

interface MaterialPricesConfig {
  prices: MaterialPrice[];
  defaultMarkup: number;
  categoryMarkups: {
    Profile?: number;
    Glass?: number;
    Accessory?: number;
    Rubber?: number;
    Other?: number;
  };
}
```

## State Management

### Template Store (templateStore.ts)
**Purpose**: Centralized state management for all template configurations
**State**:
```typescript
interface TemplateState {
  // Quote Format
  quoteFormat: QuoteFormatConfig;
  
  // Payment Methods
  paymentMethods: PaymentMethod[];
  paymentMethodConfig: PaymentMethodConfig;
  
  // PDF Export
  pdfExport: PDFExportConfig;
  
  // Material Prices
  materialPrices: MaterialPrice[];
  materialPricesConfig: MaterialPricesConfig;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  activeTab: 'quoteFormat' | 'paymentMethod' | 'pdfExport' | 'materialPrices';
}
```

**Actions**:
- `loadTemplates()` - Load all configurations from API/localStorage
- `saveTemplates()` - Save all configurations
- `updateQuoteFormat(config)` - Update quote format config
- `addPaymentMethod(method)` - Add new payment method
- `updatePaymentMethod(id, method)` - Update existing payment method
- `deletePaymentMethod(id)` - Delete payment method
- `setDefaultPaymentMethod(id)` - Set default payment method
- `updatePDFExport(config)` - Update PDF export config
- `addMaterialPrice(price)` - Add new material price
- `updateMaterialPrice(id, price)` - Update existing material price
- `deleteMaterialPrice(id)` - Delete material price
- `importMaterialPrices(file)` - Import prices from file
- `exportMaterialPrices()` - Export prices to file
- `resetToDefaults()` - Reset all to default values

## API Service

### templates.service.ts
**Endpoints** (if backend exists):
- `GET /api/v1/templates` - Get all template configurations
- `PUT /api/v1/templates` - Update all template configurations
- `GET /api/v1/templates/payment-methods` - Get payment methods
- `POST /api/v1/templates/payment-methods` - Create payment method
- `PUT /api/v1/templates/payment-methods/:id` - Update payment method
- `DELETE /api/v1/templates/payment-methods/:id` - Delete payment method
- `GET /api/v1/templates/material-prices` - Get material prices
- `POST /api/v1/templates/material-prices` - Create material price
- `PUT /api/v1/templates/material-prices/:id` - Update material price
- `DELETE /api/v1/templates/material-prices/:id` - Delete material price

**Fallback**: Use localStorage if API is not available

## Integration Points

### 1. QuoteExtrasNotesScreen
- Update "Go to Settings" button to navigate to Pre-Built Templates
- Pass navigation handler: `onNavigate('templates')`

### 2. App.tsx
- Add routing for `'templates'` view
- Render `PreBuiltTemplatesScreen` component

### 3. Export Services
- Update `exportQuoteToPDF` to use PDF export configuration
- Update `exportMaterialListToPDF` to use PDF export configuration

### 4. Quote Creation Flow
- Use default payment method from template configuration
- Apply quote format settings to quote preview

### 5. Material List Creation
- Use material prices from template configuration
- Auto-populate prices when adding items

## Default Values

### Quote Format Defaults
```typescript
const defaultQuoteFormat: QuoteFormatConfig = {
  header: {
    companyName: '',
    tagline: '',
    alignment: 'left',
  },
  footer: {
    content: '',
    alignment: 'center',
    visible: true,
  },
  colors: {
    primary: '#1F2937', // gray-800
    secondary: '#6B7280', // gray-500
    accent: '#3B82F6', // blue-500
  },
  typography: {
    fontFamily: 'Arial',
    headingSize: 18,
    bodySize: 12,
  },
  page: {
    orientation: 'portrait',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    sectionSpacing: 15,
  },
  sections: {
    projectInfo: { visible: true, order: 1 },
    customerDetails: { visible: true, order: 2 },
    itemsTable: { visible: true, order: 3 },
    summary: { visible: true, order: 4 },
    paymentInfo: { visible: true, order: 5 },
    notes: { visible: true, order: 6 },
  },
};
```

### PDF Export Defaults
```typescript
const defaultPDFExport: PDFExportConfig = {
  quote: {
    pageSize: 'A4',
    orientation: 'portrait',
    header: { enabled: true, height: 30 },
    footer: { enabled: true, height: 20 },
    logo: { enabled: false, size: 'medium', position: 'top-left' },
    fonts: {
      family: 'Helvetica',
      headingSize: 16,
      bodySize: 10,
      tableSize: 9,
      headingColor: '#000000',
      bodyColor: '#000000',
    },
  },
  materialList: {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCuttingList: true,
    cuttingListFormat: 'table',
    includeGlassList: true,
  },
  fileNaming: {
    pattern: 'Quote-{quoteId}-{projectName}',
    dateFormat: 'YYYY-MM-DD',
  },
};
```

## UI/UX Considerations

### Visual Design
- Clean, professional interface matching existing app design
- Consistent spacing and typography
- Clear section headers and descriptions
- Visual previews where applicable

### User Experience
- Auto-save draft changes (optional)
- Unsaved changes warning on navigation
- Loading states for async operations
- Success/error toast notifications
- Confirmation dialogs for destructive actions
- Keyboard shortcuts for common actions

### Responsive Design
- Mobile-friendly layout
- Collapsible sections on small screens
- Touch-friendly controls

## Testing Considerations

### Unit Tests
- Template store actions
- Form validation logic
- Data transformation functions

### Integration Tests
- Navigation from QuoteExtrasNotesScreen
- Save/load template configurations
- Payment method CRUD operations
- Material price import/export

### E2E Tests
- Complete template configuration flow
- Quote generation with custom format
- PDF export with custom settings

## Implementation Phases

### Phase 1: Foundation
1. Create PreBuiltTemplatesScreen component
2. Add routing in App.tsx
3. Fix navigation from QuoteExtrasNotesScreen
4. Create template store with basic structure

### Phase 2: Quote Format Section
1. Implement QuoteFormatSection component
2. Add form fields and validation
3. Implement preview functionality
4. Connect to template store

### Phase 3: Payment Method Section
1. Implement PaymentMethodSection component
2. Add CRUD operations for payment methods
3. Implement default payment method logic
4. Connect to quote creation flow

### Phase 4: PDF Export Section
1. Implement PDFExportSection component
2. Update export services to use configuration
3. Test PDF generation with custom settings

### Phase 5: Material Prices Section
1. Implement MaterialPricesSection component
2. Add import/export functionality
3. Integrate with material list creation
4. Add price management features

### Phase 6: Polish & Testing
1. Add loading states and error handling
2. Implement unsaved changes warning
3. Add toast notifications
4. Write tests
5. Fix bugs and optimize performance

## Success Criteria

✅ Users can configure quote format and see preview
✅ Users can add/edit/delete payment methods
✅ Users can configure PDF export settings
✅ Users can manage material prices library
✅ All configurations persist across sessions
✅ Navigation from quote creation flow works
✅ PDF exports use configured settings
✅ Material prices are used in material list creation

