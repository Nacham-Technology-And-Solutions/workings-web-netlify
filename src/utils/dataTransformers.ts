/**
 * Data Transformation Utilities
 * Converts frontend UI data format to backend API format
 */

import type {
  DimensionItem,
  ProjectDescriptionData,
  SelectProjectData,
  ProjectMeasurementData,
  GlazingDimension,
  ProjectData,
} from '@/types/project';
import type { ProjectCartItem, CalculationSettings } from '@/types/calculations';
import { mapGlazingTypeToModuleId, getCategoryFromKey, normalizeGlazingType } from './moduleMapping';
import { MODULE_CONFIG } from './moduleConfig';
import type { GlazingCategory } from './moduleMapping';
import { convertStringToMillimeters, type Unit } from './unitConverter';

/**
 * Converts DimensionItem to GlazingDimension format
 * @param item - DimensionItem from form
 * @param category - Glazing category
 * @param unit - Unit of measurement (defaults to 'mm')
 */
export function convertDimensionItemToGlazingDimension(
  item: DimensionItem,
  category: 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall',
  unit: Unit = 'mm'
): GlazingDimension {
  const moduleId = mapGlazingTypeToModuleId(item.type, category);
  const glazingType = normalizeGlazingType(item.type, category);

  // Convert to millimeters
  const width = convertStringToMillimeters(item.width, unit);
  const height = convertStringToMillimeters(item.height, unit);
  const quantity = parseFloat(item.quantity) || 1;
  const panels = parseFloat(item.panel) || 1;

  // Build parameters object based on module
  const parameters: GlazingDimension['parameters'] = {
    qty: quantity,
  };

  // M8: outer frame mm (backend prefers width/height; aliases in_to_in_* still accepted)
  if (moduleId === 'M8_EBM_Net_UChannel') {
    parameters.width = width;
    parameters.height = height;
  } else if (moduleId === 'M6_Net_1125_26' || moduleId === 'M7_EBM_Net_1125_26') {
    parameters.in_to_in_width = width;
    parameters.in_to_in_height = height;
  } else {
    parameters.W = width;
    parameters.H = height;
  }

  // M3 fixed net (M2 can use options.fixedNet; M3 module id implies fixed net)
  if (moduleId === 'M3_Sliding_2Sash_Net') {
    parameters.options = { fixedNet: true };
  }

  // M1: Casement Window - requires N and O
  if (moduleId === 'M1_Casement_DCurve') {
    parameters.N = panels;
    // Use openingPanels if provided, otherwise default to N
    const openingPanels = item.openingPanels ? parseFloat(item.openingPanels) : panels;
    parameters.O = openingPanels;
  }

  // M2-M5: Sliding Windows - no panel parameters needed
  // (panels are determined by the module type itself)

  // M9: Curtain Wall Grid - requires N_v and N_h
  if (moduleId === 'M9_Curtain_Wall_Grid') {
    const verticalPanels = item.verticalPanels ? parseFloat(item.verticalPanels) : 1;
    const horizontalPanels = item.horizontalPanels ? parseFloat(item.horizontalPanels) : 1;
    parameters.N_v = verticalPanels;
    parameters.N_h = horizontalPanels;
  }

  const result: GlazingDimension = {
    glazingCategory: category,
    glazingType,
    moduleId,
    parameters,
  };
  if (item.title !== undefined && item.title !== '') result.title = item.title;
  if (item.color !== undefined && item.color !== '') result.color = item.color;
  return result;
}

/**
 * Finds the category for a given dimension type by looking it up in MODULE_CONFIG
 * @param type - The dimension type value (e.g., "Casement (D/curve)")
 * @returns The category name or null if not found
 */
function findCategoryForType(type: string): GlazingCategory | null {
  // Search through all categories in MODULE_CONFIG
  const categories: GlazingCategory[] = ['Window', 'Door', 'Net', 'Partition', 'Curtain Wall'];
  
  for (const category of categories) {
    const categoryConfig = MODULE_CONFIG[category];
    if (categoryConfig && categoryConfig.types) {
      // Check if this type exists in this category
      const typeConfig = categoryConfig.types.find(t => t.value === type);
      if (typeConfig) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Converts ProjectMeasurementData to array of GlazingDimensions
 * Determines categories by looking up dimension types in MODULE_CONFIG
 */
export function convertToGlazingDimensions(
  measurementData: ProjectMeasurementData,
  selectData: SelectProjectData
): GlazingDimension[] {
  const glazingDimensions: GlazingDimension[] = [];
  const unit = (measurementData.unit as Unit) || 'mm';

  // Map each dimension item to its category by looking up the type in MODULE_CONFIG
  measurementData.dimensions.forEach((dimension) => {
    // Find the category by looking up the dimension type in MODULE_CONFIG
    let category: GlazingCategory = findCategoryForType(dimension.type) || 'Window';

    // If we couldn't find it in MODULE_CONFIG, fall back to checking SelectProjectData
    // This is a fallback for edge cases
    if (category === 'Window' && !MODULE_CONFIG.Window.types.some(t => t.value === dimension.type)) {
      // Try to infer from SelectProjectData as last resort
      if (selectData.doors.length > 0 && selectData.doors.some(d => dimension.type.toLowerCase().includes(d.toLowerCase()))) {
        category = 'Door';
      } else if (selectData.skylights.length > 0 && selectData.skylights.some(s => dimension.type.toLowerCase().includes(s.toLowerCase()))) {
        category = 'Net';
      } else if (selectData.glassPanels.length > 0 && selectData.glassPanels.some(g => dimension.type.toLowerCase().includes(g.toLowerCase()))) {
        category = 'Curtain Wall';
      }
    }

    const glazingDimension = convertDimensionItemToGlazingDimension(dimension, category, unit);
    glazingDimensions.push(glazingDimension);
  });

  return glazingDimensions;
}

/** PATCH project calculate: stockLength must be 6 or 5.58 (metres). */
export function stockLengthForProjectPatch(stockLength?: number): number {
  return stockLength === 5.58 ? 5.58 : 6;
}

/**
 * Validates glazing dimensions before project save/calculate (§8b).
 * Returns an error message or null if valid.
 */
export function validateGlazingDimensions(dimensions: GlazingDimension[]): string | null {
  for (const dim of dimensions) {
    const p = dim.parameters;
    const width = p.width ?? p.W ?? p.in_to_in_width;
    const height = p.height ?? p.H ?? p.in_to_in_height;
    const label = dim.title || dim.moduleId || 'Dimension';
    if (width != null && Number.isFinite(width) && width <= 0) {
      return `${label}: width must be greater than 0 mm`;
    }
    if (height != null && Number.isFinite(height) && height <= 0) {
      return `${label}: height must be greater than 0 mm`;
    }
  }
  return null;
}

/** Maps API glazing `parameters` to DimensionItem width/height strings (M8: width/height; M6/M7: in_to_in_*; others: W/H). */
export function glazingParametersToDimensionStrings(
  parameters: GlazingDimension['parameters'] | undefined
): { width: string; height: string } {
  if (!parameters) return { width: '', height: '' };
  const w = parameters.width ?? parameters.W ?? parameters.in_to_in_width;
  const h = parameters.height ?? parameters.H ?? parameters.in_to_in_height;
  return {
    width: w != null ? String(w) : '',
    height: h != null ? String(h) : '',
  };
}

/**
 * Converts GlazingDimension to ProjectCartItem format
 */
export function convertGlazingDimensionToProjectCartItem(
  glazingDimension: GlazingDimension
): ProjectCartItem {
  const { moduleId } = glazingDimension;
  const p = glazingDimension.parameters;

  if (moduleId === 'M8_EBM_Net_UChannel') {
    const w = p.width ?? p.W ?? p.in_to_in_width;
    const h = p.height ?? p.H ?? p.in_to_in_height;
    return {
      module_id: moduleId,
      width: w,
      height: h,
      qty: p.qty,
    };
  }

  return {
    module_id: moduleId,
    ...p,
  };
}

/**
 * Converts array of GlazingDimensions to ProjectCart format
 */
export function convertToProjectCart(glazingDimensions: GlazingDimension[]): ProjectCartItem[] {
  return glazingDimensions.map(convertGlazingDimensionToProjectCartItem);
}

/**
 * Creates ProjectData from project flow data
 */
import type { EstimationSnapshot } from '@/types/estimation';

function buildEstimationExtraCharges(
  subtotal: number,
  snapshot?: EstimationSnapshot
): Array<{ label: string; amount: number }> {
  const charges: Array<{ label: string; amount: number }> = [];
  const extras = snapshot?.quoteSettings?.extraCharges;
  if (!extras) return charges;

  if (extras.labour && extras.labour > 0) {
    charges.push({ label: 'Labour', amount: extras.labour });
  }
  if (extras.installation && extras.installation > 0) {
    charges.push({ label: 'Installation', amount: extras.installation });
  }
  if (extras.transport && extras.transport > 0) {
    charges.push({ label: 'Transport', amount: extras.transport });
  }
  if (extras.miscellaneous && extras.miscellaneous > 0) {
    charges.push({ label: 'Miscellaneous', amount: extras.miscellaneous });
  }
  if (extras.profitFixed && extras.profitFixed > 0) {
    charges.push({ label: 'Profit', amount: extras.profitFixed });
  }
  if (extras.profitPercent && extras.profitPercent > 0) {
    charges.push({
      label: `Profit (${extras.profitPercent}%)`,
      amount: Math.round((subtotal * extras.profitPercent) / 100),
    });
  }
  if (extras.discountFixed && extras.discountFixed > 0) {
    charges.push({ label: 'Discount', amount: -extras.discountFixed });
  }
  if (extras.discountPercent && extras.discountPercent > 0) {
    charges.push({
      label: `Discount (${extras.discountPercent}%)`,
      amount: -Math.round((subtotal * extras.discountPercent) / 100),
    });
  }
  return charges;
}

/**
 * @param backendQuote - Quote response from backend API
 * @param quoteConfig - Original quote configuration data (for payment info and dates)
 * @returns QuotePreviewData for preview screen
 */
export function transformBackendQuoteToPreview(
  backendQuote: {
    id: number;
    quoteNumber: string;
    customerName: string;
    customerAddress?: string | null;
    customerEmail?: string | null;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    project?: { projectName?: string; siteAddress?: string } | null;
    paymentInfo?: { accountName?: string; accountNumber?: string; bankName?: string } | null;
    estimationSnapshot?: EstimationSnapshot;
  },
  quoteConfig?: {
    quoteName?: string;
    siteAddress?: string;
    customerContact?: string;
  },
  extrasNotesData?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    addedCharges?: Array<{ description: string; amount: number }>;
  }
): {
  projectName: string;
  siteAddress: string;
  customerName: string;
  customerEmail: string;
  quoteId: string;
  issueDate: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    type?: 'material' | 'dimension';
  }>;
  summary: {
    subtotal: number;
    charges: Array<{ label: string; amount: number }>;
    grandTotal: number;
  };
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
} {
  // Transform items from backend format to preview format
  const items = backendQuote.items.map((item, index) => {
    const withDims = item as {
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      width?: number;
      height?: number;
    };
    const isDimension = withDims.width != null && withDims.height != null;
    return {
      id: `item-${index}`,
      description: withDims.description,
      quantity: withDims.quantity,
      unitPrice: withDims.unitPrice,
      total: withDims.totalPrice,
      type: isDimension ? ('dimension' as const) : ('material' as const),
      width: withDims.width,
      height: withDims.height,
    };
  });

  // Build charges array from estimation extras, manual extras, and tax
  const charges: Array<{ label: string; amount: number }> = [];

  if (backendQuote.estimationSnapshot) {
    charges.push(
      ...buildEstimationExtraCharges(backendQuote.subtotal, backendQuote.estimationSnapshot)
    );
  }
  
  // Add extra charges from extrasNotesData if available (legacy quote flow)
  if (extrasNotesData?.addedCharges && extrasNotesData.addedCharges.length > 0) {
    extrasNotesData.addedCharges.forEach((charge) => {
      if (charge.description && charge.amount > 0) {
        charges.push({ label: charge.description, amount: charge.amount });
      }
    });
  }
  
  // Add tax if it exists
  if (backendQuote.tax > 0) {
    charges.push({ label: 'Tax', amount: backendQuote.tax });
  }

  // Estimation quotes: show unlabeled remainder if extras don't fully explain total
  if (backendQuote.estimationSnapshot && charges.length === 0) {
    const remainder = backendQuote.total - backendQuote.subtotal - backendQuote.tax;
    if (remainder !== 0) {
      charges.push({ label: 'Project extras', amount: remainder });
    }
  }

  // Get project name and site address
  const projectName = backendQuote.project?.projectName || quoteConfig?.quoteName || 'Project';
  const siteAddress = backendQuote.project?.siteAddress || backendQuote.customerAddress || quoteConfig?.siteAddress || '';

  // Prefer backend paymentInfo (from GET quote); fallback to extrasNotesData (e.g. after create)
  const rawPayment = backendQuote.paymentInfo ?? extrasNotesData;
  const paymentInfo = {
    accountName: (rawPayment?.accountName ?? extrasNotesData?.accountName ?? '').trim(),
    accountNumber: (rawPayment?.accountNumber ?? extrasNotesData?.accountNumber ?? '').trim(),
    bankName: (rawPayment?.bankName ?? extrasNotesData?.bankName ?? '').trim(),
  };

  return {
    projectName,
    siteAddress,
    customerName: backendQuote.customerName,
    customerEmail: backendQuote.customerEmail || quoteConfig?.customerContact || '',
    quoteId: backendQuote.quoteNumber || `Q-${backendQuote.id}`,
    issueDate: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }),
    items,
    summary: {
      subtotal: backendQuote.subtotal,
      charges,
      grandTotal: backendQuote.total,
    },
    paymentInfo,
  };
}

/**
 * Transform QuoteConfigurationData to backend CreateQuoteRequest format
 * @param quoteConfig - Frontend quote configuration data
 * @param projectId - Optional project ID (for from_project type)
 * @returns Backend quote creation request data
 */
export function transformQuoteDataToBackend(
  quoteConfig: {
    quoteName: string;
    customerName: string;
    siteAddress: string;
    customerContact: string;
    labourCost: number;
    transportationCost: number;
    miscellaneous: number;
    discount: number;
    materialCost: number;
    totalQuote: number;
  },
  projectId?: number | null
): {
  quoteType: 'from_project' | 'standalone';
  projectId?: number;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft';
} {
  // Determine quote type based on projectId
  const quoteType: 'from_project' | 'standalone' = projectId ? 'from_project' : 'standalone';

  // Build items array - each cost component becomes a separate item
  const items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  // Material cost as first item
  if (quoteConfig.materialCost > 0) {
    items.push({
      description: 'Material Cost',
      quantity: 1,
      unitPrice: quoteConfig.materialCost,
      totalPrice: quoteConfig.materialCost,
    });
  }

  // Labour cost as separate item
  if (quoteConfig.labourCost > 0) {
    items.push({
      description: 'Labor Cost',
      quantity: 1,
      unitPrice: quoteConfig.labourCost,
      totalPrice: quoteConfig.labourCost,
    });
  }

  // Transportation cost as separate item
  if (quoteConfig.transportationCost > 0) {
    items.push({
      description: 'Transportation & Delivery',
      quantity: 1,
      unitPrice: quoteConfig.transportationCost,
      totalPrice: quoteConfig.transportationCost,
    });
  }

  // Miscellaneous as separate item
  if (quoteConfig.miscellaneous > 0) {
    items.push({
      description: 'Miscellaneous Charges',
      quantity: 1,
      unitPrice: quoteConfig.miscellaneous,
      totalPrice: quoteConfig.miscellaneous,
    });
  }

  // Calculate subtotal (sum of all items before discount and tax)
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate tax (VAT) - typically 18% of subtotal in Nigeria, but we'll calculate from total
  // Tax = Total - (Subtotal - Discount)
  // Rearranging: Tax = Total - Subtotal + Discount
  const discountAmount = quoteConfig.discount || 0;
  const tax = quoteConfig.totalQuote - subtotal + discountAmount;

  // Build request data
  const requestData: any = {
    quoteType,
    customerName: quoteConfig.customerName,
    customerAddress: quoteConfig.siteAddress,
    items,
    subtotal,
    tax: Math.max(0, tax), // Ensure tax is not negative
    total: quoteConfig.totalQuote,
    status: 'draft',
  };

  // Only include projectId if it exists (for from_project type)
  if (quoteType === 'from_project' && projectId) {
    requestData.projectId = projectId;
  }

  // Include customer email if contact is an email
  if (quoteConfig.customerContact) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(quoteConfig.customerContact)) {
      requestData.customerEmail = quoteConfig.customerContact;
    }
  }

  return requestData;
}

/**
 * Transform standalone quote flow data to backend CreateQuoteRequest format
 * @param overviewData - Quote overview data
 * @param itemListData - Quote item list data
 * @param extrasNotesData - Quote extras and notes data
 * @param projectId - Optional project ID (if quote is from a project)
 * @returns Backend quote creation request data
 */
export function transformStandaloneQuoteToBackend(
  overviewData: {
    customerName: string;
    projectName: string;
    siteAddress: string;
    quoteId: string;
    issueDate: string;
    paymentTerms: string;
  },
  itemListData: {
    listType: 'dimension' | 'material';
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
  },
  extrasNotesData: {
    extraCharges: string;
    amount: number;
    additionalNotes: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    total: number;
    addedCharges?: Array<{ description: string; amount: number }>;
  },
  projectId?: number
): {
  quoteType: 'from_project' | 'standalone';
  projectId?: number;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent';
  paymentInfo?: { accountName?: string; accountNumber?: string; bankName?: string } | null;
} {
  // Determine quote type based on projectId
  const quoteType: 'from_project' | 'standalone' = projectId ? 'from_project' : 'standalone';
  // Transform item list items to backend format
  const items = itemListData.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.total,
  }));

  // Add extra charges as separate items
  // Prefer addedCharges array if available (more accurate)
  if (extrasNotesData.addedCharges && extrasNotesData.addedCharges.length > 0) {
    extrasNotesData.addedCharges.forEach((charge) => {
      if (charge.description && charge.amount > 0) {
        items.push({
          description: charge.description,
          quantity: 1,
          unitPrice: charge.amount,
          totalPrice: charge.amount,
        });
      }
    });
  } else if (extrasNotesData.extraCharges && extrasNotesData.amount > 0) {
    // Fallback: Handle multiple charges (comma-separated) or single charge
    const chargeDescriptions = extrasNotesData.extraCharges.split(',').map(c => c.trim()).filter(c => c);
    const chargeAmounts = chargeDescriptions.length > 0 
      ? extrasNotesData.amount / chargeDescriptions.length 
      : extrasNotesData.amount;
    
    chargeDescriptions.forEach((description) => {
      items.push({
        description: description,
        quantity: 1,
        unitPrice: chargeAmounts,
        totalPrice: chargeAmounts,
      });
    });
  }

  // Calculate subtotal (sum of all items)
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate tax (difference between total and subtotal)
  const tax = Math.max(0, extrasNotesData.total - subtotal);

  const accountName = extrasNotesData.accountName?.trim() || '';
  const accountNumber = extrasNotesData.accountNumber?.trim() || '';
  const bankName = extrasNotesData.bankName?.trim() || '';
  const hasPaymentFields = !!(accountName || accountNumber || bankName);

  const result: {
    quoteType: 'from_project' | 'standalone';
    projectId?: number;
    customerName: string;
    customerAddress: string;
    customerEmail?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    status: 'draft' | 'sent';
    paymentInfo?: { accountName?: string; accountNumber?: string; bankName?: string } | null;
  } = {
    quoteType,
    customerName: overviewData.customerName,
    customerAddress: overviewData.siteAddress,
    items,
    subtotal,
    tax,
    total: extrasNotesData.total,
    status: 'draft', // Will be 'sent' when finalized
  };

  // Include projectId if quote is from a project
  if (quoteType === 'from_project' && projectId) {
    result.projectId = projectId;
  }

  // Include paymentInfo when user has entered at least one field; send null to clear on update
  if (hasPaymentFields) {
    result.paymentInfo = {
      accountName: accountName || undefined,
      accountNumber: accountNumber || undefined,
      bankName: bankName || undefined,
    };
  } else {
    result.paymentInfo = null;
  }

  return result;
}

export function createProjectData(
  descriptionData: ProjectDescriptionData,
  selectData: SelectProjectData,
  measurementData: ProjectMeasurementData,
  calculationSettings?: CalculationSettings
): ProjectData {
  const glazingDimensions = convertToGlazingDimensions(measurementData, selectData);

  return {
    projectName: descriptionData.projectName,
    customer: {
      name: descriptionData.customerName,
      // email, phone, address can be added later if collected in UI
    },
    siteAddress: descriptionData.siteAddress,
    description: descriptionData.description,
    glazingDimensions,
    calculationSettings: {
      stockLength: stockLengthForProjectPatch(calculationSettings?.stockLength),
      bladeKerf: calculationSettings?.bladeKerf ?? 5,
      wasteThreshold: calculationSettings?.wasteThreshold ?? 200,
      ...(calculationSettings?.netMargin != null ? { netMargin: calculationSettings.netMargin } : {}),
      ...(calculationSettings?.netRoll ? { netRoll: calculationSettings.netRoll } : {}),
    },
  };
}

/**
 * Converts ProjectData to ProjectCart format for calculation API
 */
export function projectDataToProjectCart(
  projectData: ProjectData
): { projectCart: ProjectCartItem[]; settings: CalculationSettings } {
  const projectCart = convertToProjectCart(projectData.glazingDimensions);
  const raw = projectData.calculationSettings;
  const settings = {
    stockLength: stockLengthForProjectPatch(raw?.stockLength),
    bladeKerf: raw?.bladeKerf ?? 5,
    wasteThreshold: raw?.wasteThreshold ?? 200,
    ...(raw?.netMargin != null ? { netMargin: raw.netMargin } : {}),
    ...(raw?.netRoll ? { netRoll: raw.netRoll } : {}),
  };

  return { projectCart, settings };
}

