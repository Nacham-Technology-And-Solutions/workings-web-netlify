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

