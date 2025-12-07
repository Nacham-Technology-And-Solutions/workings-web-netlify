export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Draft';

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  lastUpdated: string; // ISO string date
  projectId?: string; // e.g. #000045
}

// Project flow types
export interface ProjectDescriptionData {
  projectName: string;
  customerName: string;
  siteAddress: string;
}

export interface SelectProjectData {
  windows: string[];
  doors: string[];
  skylights: string[];
  glassPanels: string[];
}

export interface DimensionItem {
  id: string;
  type: string;
  width: string;
  height: string;
  quantity: string;
  panel: string;
}

export interface ProjectMeasurementData {
  dimensions: DimensionItem[];
  unit: string;
}

