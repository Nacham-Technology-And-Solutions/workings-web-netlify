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

// Calculation Result (output format from calculation engine)
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
    h: number; // Height
    w: number; // Width
    qty: number; // Quantity of this size
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

