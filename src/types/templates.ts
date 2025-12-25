/**
 * TypeScript types for Pre-Built Templates configuration
 */

export interface QuoteFormatConfig {
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

export interface PaymentMethod {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  methods: PaymentMethod[];
  displayOptions: {
    showInPreview: boolean;
    showInPDF: boolean;
    customInstructions?: string;
  };
}

export interface PDFExportConfig {
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
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'Custom';
    customSize?: { width: number; height: number; unit: 'mm' | 'in' };
    orientation: 'portrait' | 'landscape';
    includeCuttingList: boolean;
    cuttingListFormat: 'table' | 'list';
    includeGlassList: boolean;
  };
  fileNaming: {
    pattern: string;
    dateFormat: string;
  };
}

export interface MaterialPrice {
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

export interface MaterialPricesConfig {
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

export type TemplateTab = 'quoteFormat' | 'paymentMethod' | 'pdfExport' | 'materialPrices';

