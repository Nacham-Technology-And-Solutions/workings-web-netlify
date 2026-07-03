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

export interface MaterialListSummary {
  id: number;
  projectId: number;
  projectName: string;
  siteAddress: string | null;
  projectStatus: 'draft' | 'calculated' | 'archived';
  calculated: boolean;
  lastCalculatedAt: string | null;
  itemCount: number;
  itemsTotal: number;
  pointsCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialListListResponse {
  materialLists: MaterialListSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

export const materialListsService = {
  /**
   * List material list summaries (replaces projects + N+1 fan-out)
   */
  list: async (
    page = 1,
    limit = 20,
    options?: { status?: 'draft' | 'calculated' | 'archived'; search?: string }
  ): Promise<ApiResponse<MaterialListListResponse>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (options?.status) params.set('status', options.status);
    if (options?.search?.trim()) params.set('search', options.search.trim());

    const response = await apiClient.get<ApiResponse<MaterialListListResponse>>(
      `/api/v1/material-lists?${params.toString()}`
    );
    return response.data;
  },

  create: async (data: CreateMaterialListRequest): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.post<ApiResponse<{ materialList: MaterialList }>>(
      '/api/v1/material-lists',
      data
    );
    return response.data;
  },

  getByProject: async (projectId: number): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: MaterialList }>>(
      `/api/v1/material-lists/project/${projectId}`
    );
    return response.data;
  },

  getById: async (materialListId: number): Promise<ApiResponse<{ materialList: MaterialList }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: MaterialList }>>(
      `/api/v1/material-lists/${materialListId}`
    );
    return response.data;
  },

  delete: async (materialListId: number): Promise<ApiResponse<{ message?: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message?: string }>>(
      `/api/v1/material-lists/${materialListId}`
    );
    return response.data;
  },
};
