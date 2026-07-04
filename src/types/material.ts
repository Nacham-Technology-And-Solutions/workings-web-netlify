export type MaterialListStatus = 'Draft' | 'Completed';

export type MaterialListSource = 'from_project' | 'standalone';

export interface MaterialList {
  id: string;
  projectName: string;
  listNumber: string;
  status: MaterialListStatus;
  listSource: MaterialListSource;
  issueDate: string; // ISO string date
}

export interface MaterialListItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: string;
  type?: string;
}

export interface FullMaterialList {
  id: string;
  projectId?: number;
  projectName: string;
  date: string; // ISO string date
  preparedBy: string;
  status: MaterialListStatus;
  listSource?: MaterialListSource;
  items: MaterialListItem[];
  total: number;
}

