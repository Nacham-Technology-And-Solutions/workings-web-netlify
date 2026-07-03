/**
 * Estimation engine API types — see docs/FRONTEND-ESTIMATION-INTEGRATION.md
 */

export type PriceFillSource = 'system' | 'user_library' | 'last_used';

export type MaterialCatalogCategory =
  | 'Profile'
  | 'Glass'
  | 'Accessory'
  | 'Rubber'
  | 'Net'
  | 'Other';

export type MaterialCatalogItem = {
  itemKey: string;
  itemName: string;
  category: MaterialCatalogCategory;
  unit: string;
};

export type MaterialCatalogResponse = {
  responseMessage: string;
  response: {
    catalogVersion: string;
    items: MaterialCatalogItem[];
    total: number;
    totalUnfiltered: number;
  };
};

export type MaterialCatalogQueryParams = {
  category?: MaterialCatalogCategory;
  search?: string;
};

export type PricingInputSource = PriceFillSource | 'manual' | 'empty';

export type PricingInput = {
  itemKey: string;
  itemName: string;
  category: string;
  unit: string;
  unitPrice: number;
  source?: PricingInputSource;
};

export type ExtraCharges = {
  labour?: number;
  installation?: number;
  transport?: number;
  miscellaneous?: number;
  profitFixed?: number;
  profitPercent?: number;
  discountFixed?: number;
  discountPercent?: number;
};

export type QuoteSettings = {
  stockLength: number;
  kerf: number;
  offcutMarkup: number;
  rounding: 'nearest_100';
  glassSheetWidth: number;
  glassSheetHeight: number;
  netRollHeightMm: number;
  extraCharges?: ExtraCharges;
};

export type CostBreakdownLine = {
  itemKey: string;
  itemName: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  formula?: string;
};

export type EstimationSnapshot = {
  pricingInputs: PricingInput[];
  quoteSettings: QuoteSettings;
  pricesUsed: PricingInput[];
  quoteSource: 'project_cart' | 'material_list';
  generatedAt: string;
};

export type PriceFillResponse = {
  responseMessage: string;
  response: {
    fillSource: PriceFillSource;
    itemKeys: Array<{
      itemKey: string;
      itemName: string;
      category: string;
      unit: string;
    }>;
    pricingInputs: PricingInput[];
    projectId: number;
  };
};

export type EstimationPreviewRequest = {
  quoteSource: 'project_cart' | 'material_list';
  projectId?: number;
  projectCart?: Array<{ module_id: string; W?: number; H?: number; qty?: number; [key: string]: unknown }>;
  calculationResult?: object;
  calculationSettings?: { stockLength?: number; bladeKerf?: number; wasteThreshold?: number };
  pricingInputs: PricingInput[];
  quoteSettings?: Partial<QuoteSettings>;
  elementDisplayOverrides?: Array<{ title?: string; color?: string }>;
};

export type CartQuoteLine = {
  description: string;
  quantity: number;
  moduleId: string;
  width?: number;
  height?: number;
  calculatedUnitPrice: number;
  finalUnitPrice: number;
  manualOverride: boolean;
  unitPrice: number;
  totalPrice: number;
  costBreakdown: CostBreakdownLine[];
};

export type EstimationCartQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  calculatedUnitPrice: number;
  finalUnitPrice: number;
  manualOverride: boolean;
  costBreakdown: CostBreakdownLine[];
  moduleId: string;
  width?: number;
  height?: number;
};

export type EstimationPreviewProjectCartResponse = {
  responseMessage: string;
  response: {
    quoteSource: 'project_cart';
    items: EstimationCartQuoteItem[];
    cartLines: CartQuoteLine[];
    subtotal: number;
    grandTotal: number;
    pricesUsed: PricingInput[];
    quoteSettings: QuoteSettings;
  };
};

export type MaterialListQuoteLine = {
  itemKey: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

export type EstimationMaterialQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemKey: string;
};

export type EstimationPreviewMaterialListResponse = {
  responseMessage: string;
  response: {
    quoteSource: 'material_list';
    lines: MaterialListQuoteLine[];
    items: EstimationMaterialQuoteItem[];
    subtotal: number;
    grandTotal: number;
    pricesUsed: PricingInput[];
    quoteSettings: QuoteSettings;
  };
};

export type EstimationPreviewResponse =
  | EstimationPreviewProjectCartResponse
  | EstimationPreviewMaterialListResponse;

export type CartQuoteItemOverride = {
  lineIndex: number;
  finalUnitPrice: number;
  manualOverride?: boolean;
};

export type EstimationQuoteRequest = EstimationPreviewRequest & {
  quoteType?: 'from_project' | 'standalone';
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  tax?: number;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  paymentInfo?: { accountName?: string; accountNumber?: string; bankName?: string } | null;
  itemOverrides?: CartQuoteItemOverride[];
  generatePdf?: boolean;
};

export type EstimationSavedQuote = {
  id: number;
  quoteNumber: string;
  quoteType: 'from_project' | 'standalone';
  quoteSource: 'project_cart' | 'material_list';
  projectId: number | null;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  items: EstimationCartQuoteItem[] | EstimationMaterialQuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  estimationSnapshot: EstimationSnapshot;
  pdfUrl?: string | null;
  paymentInfo?: object | null;
  createdAt: string;
  updatedAt: string;
};

export type EstimationSaveResponse = {
  responseMessage: string;
  response: {
    quote: EstimationSavedQuote;
    pointsDeducted: number;
    balanceAfter: number;
    pdfUrl?: string | null;
  };
};

/** Bundled in POST /projects/:id/calculate when includePriceFill=true */
export type EstimationBootstrap = {
  fillSource: PriceFillSource;
  itemKeys: MaterialCatalogItem[];
  pricingInputs: PricingInput[];
  projectId: number;
};
