/**
 * Calculation Engine Types
 * These match the backend architecture plan format
 */

// Project Cart Item (input format for calculation engine)
export interface ProjectCartItem {
  module_id: string; // e.g., "M1_Casement_DCurve", "M9_Curtain_Wall_Grid"
  // Parameters vary by module
  W?: number; // Width
  H?: number; // Height
  N?: number; // Panels (for casement)
  N_v?: number; // Vertical panels (for curtain wall)
  N_h?: number; // Horizontal panels (for curtain wall)
  O?: number; // Opening panels
  qty?: number; // Quantity
  in_to_in_width?: number; // For net modules
  in_to_in_height?: number; // For net modules
  cell_heights?: number[]; // For curtain wall
  cell_width?: number[]; // For curtain wall
  // ... other module-specific parameters
}

// Calculation Settings
export interface CalculationSettings {
  stockLength: number; // 6 or 5.58 (meters)
  bladeKerf: number; // 5 (mm)
  wasteThreshold: number; // 200 (mm)
}

// Glazing element (one per project cart item: Window 1, Window 2, …). Used to label/color-code cuts.
export interface GlazingElement {
  id: string; // e.g. "el_0", "el_1"
  title: string; // e.g. "Window 1", "Window 2"
  color: string; // Hex, e.g. "#3B82F6"
}

// Calculation Result (output format from calculation engine)
export interface CalculationResult {
  materialList: MaterialListItem[];
  cuttingList: CuttingListItem[];
  glassList: GlassListResult;
  rubberTotals: RubberTotal[];
  accessoryTotals: AccessoryTotal[];
  elements?: GlazingElement[];
}

export interface MaterialListItem {
  item: string; // e.g., "Transom (55x55mm)"
  units: number; // Total quantity
  type: 'Profile' | 'Accessory_Pair' | 'Sheet' | 'Roll' | 'Meter';
  unitPrice?: number;
  totalPrice?: number;
}

// One piece in a cutting plan bar (new format with element attribution)
export interface CuttingPlanPiece {
  cut: string; // e.g. "cut_1900mm", "offcut_2055mm"
  elementId?: string; // e.g. "el_0". Omitted for offcut/waste.
}

export interface CuttingListItem {
  profile_name: string;
  stock_length: number; // 5850 or 6000 (mm)
  plan: {
    [key: string]: string[] | CuttingPlanPiece[]; // Legacy: string[]. New: CuttingPlanPiece[] with elementId.
  }[];
}

/** One rectangle on a glass sheet (piece or waste), mm coordinates, top-left origin. */
export interface GlassPlacement {
  kind: 'piece' | 'waste';
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  elementId?: string;
  rotated?: boolean;
  nominalWidthMm?: number;
  nominalHeightMm?: number;
}

/** Distinct 2D nest pattern; may repeat for multiple physical sheets. */
export interface GlassLayout {
  layoutId: string;
  repeatCount: number;
  stock: { widthMm: number; heightMm: number };
  placements: GlassPlacement[];
}

export interface GlassListResult {
  sheet_type: string; // e.g., "3310x2140mm"
  total_sheets: number;
  cuts: {
    h: number; // Height
    w: number; // Width
    qty: number; // Quantity of this size
    elementId?: string; // e.g. "el_0" for "Window 1 glass"
  }[];
  /** When present with placements, authoritative 2D nest for the UI (see docs). */
  layouts?: GlassLayout[];
}

export interface RubberTotal {
  name: string;
  total_meters: number;
}

export interface AccessoryTotal {
  name: string;
  qty: number;
  unit?: string; // e.g. "pcs", "pair"
}

