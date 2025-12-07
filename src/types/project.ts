export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Draft';

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  lastUpdated: string; // ISO string date
  projectId?: string; // e.g. #000045
}

