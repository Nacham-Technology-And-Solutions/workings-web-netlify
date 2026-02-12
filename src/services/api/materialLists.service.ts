import apiClient from './apiClient';

export interface MaterialListItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialList {
  id: number;
  projectId: number;
  items: MaterialListItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    projectName: string;
    siteAddress?: string;
  };
}

export interface CreateMaterialListRequest {
  projectId?: number;
  projectName?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  total: number;
  preparedBy?: string;
  date?: string;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Material Lists Service
export const materialListsService = {
  /**
   * Create a new material list
   */
  create: async (data: CreateMaterialListRequest): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.post<ApiResponse<{ materialList: MaterialList }>>(
      '/api/v1/material-lists',
      data
    );
    return response.data;
  },

  /**
   * Get material list by project ID
   * Gets the latest material list for a project
   */
  getByProject: async (projectId: number): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: MaterialList }>>(
      `/api/v1/material-lists/project/${projectId}`
    );
    return response.data;
  },

  /**
   * Get material list by ID
   */
  getById: async (materialListId: number): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: MaterialList }>>(
      `/api/v1/material-lists/${materialListId}`
    );
    return response.data;
  },
};

