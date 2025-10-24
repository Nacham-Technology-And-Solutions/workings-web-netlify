
export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
}

export interface Door {
  id:string;
  position: Point;
  width: number;
}

export interface Window {
  id: string;
  position: Point;
  width: number;
}

export interface FloorPlan {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export interface EstimateCategory {
  name: string;
  items: EstimateItem[];
}

export type Tool = 'SELECT' | 'WALL' | 'DOOR' | 'WINDOW';

export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold';

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  lastUpdated: string; // ISO string date
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Paid';

export interface Quote {
  id:string;
  quoteNumber: string;
  projectName: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  issueDate: string; // ISO string date
}

export interface QuotePreviewData {
  projectName: string;
  siteAddress: string;
  customerName: string;
  customerEmail: string;
  quoteId: string;
  issueDate: string;
  items: QuoteItem[];
  summary: {
    subtotal: number;
    charges: { label: string, amount: number }[];
    grandTotal: number;
  };
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface FullQuoteData {
  id: string;
  projectName: string;
  location: string;
  projectStatus: ProjectStatus;
  quoteId: string;
  issueDate: string; // ISO string date
  customerName: string;
  customerEmail: string;
  items: QuoteItem[];
  summary: {
    subtotal: number;
    charges: { label: string, amount: number }[];
    grandTotal: number;
  };
}

export type MaterialListStatus = 'Draft' | 'Completed';

export interface MaterialList {
  id: string;
  projectName: string;
  listNumber: string;
  status: MaterialListStatus;
  issueDate: string; // ISO string date
}

export interface MaterialListItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FullMaterialList {
  id: string;
  projectName: string;
  date: string; // ISO string date
  preparedBy: string;
  status: MaterialListStatus;
  items: MaterialListItem[];
  total: number;
}
