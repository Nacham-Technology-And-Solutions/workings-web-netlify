export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Draft';

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  lastUpdated: string; // ISO string date
  projectId?: string; // e.g. #000045
}

// Project flow types (Frontend UI format)
export interface ProjectDescriptionData {
  projectName: string;
  customerName: string;
  siteAddress: string;
  description?: string;
}

export interface SelectProjectData {
  windows: string[];
  doors: string[];
  skylights: string[];
  glassPanels: string[];
}

export interface DimensionItem {
  id: string;
  type: string; // e.g., "Casement (D/curve)"
  width: string;
  height: string;
  quantity: string;
  panel: string; // Used for N (panels) in M1, or N_v in M9
  openingPanels?: string; // O - Opening panels for M1
  verticalPanels?: string; // N_v - Vertical panels for M9
  horizontalPanels?: string; // N_h - Horizontal panels for M9
  title?: string; // Optional label (e.g. "Living room"); max 100 chars; sent to backend for element titling
  color?: string; // Optional hex (e.g. "#3B82F6"); sent to backend for element color
}

export interface ProjectMeasurementData {
  dimensions: DimensionItem[];
  unit: string;
}

// Backend-compatible types (matches architecture plan)
export type GlazingCategory = 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall';

export interface GlazingDimension {
  glazingCategory: GlazingCategory;
  glazingType: string; // e.g., "Casement Window (D/Curve)"
  moduleId: string; // e.g., "M1_Casement_DCurve"
  parameters: {
    W?: number;
    H?: number;
    N?: number;
    N_v?: number;
    N_h?: number;
    O?: number;
    qty?: number;
    in_to_in_width?: number;
    in_to_in_height?: number;
    cell_heights?: number[];
    cell_width?: number[];
    // ... other module-specific parameters
  };
  title?: string; // Optional: frontend label (e.g. "Living room"); max 100 chars
  color?: string; // Optional: hex (e.g. "#3B82F6"); backend uses default palette if omitted
}

export interface ProjectData {
  projectName: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  siteAddress: string;
  description?: string;
  glazingDimensions: GlazingDimension[];
  calculationSettings?: {
    stockLength: number;
    bladeKerf: number;
    wasteThreshold: number;
  };
}

