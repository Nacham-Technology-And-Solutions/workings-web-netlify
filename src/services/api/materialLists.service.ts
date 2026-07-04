import apiClient from './apiClient';
import type { MaterialListSource } from '@/types/material';

export interface MaterialListItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type?: string;
  unit?: string;
}

export interface MaterialListSummary {
  id: number;
  projectId: number | null;
  projectName: string;
  listSource: MaterialListSource;
  status: 'draft' | 'completed';
  itemCount: number;
  itemsTotal: number;
  preparedBy: string | null;
  issueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedMaterialListResponse {
  id: number;
  projectId: number | null;
  listSource: MaterialListSource;
  status: 'draft' | 'completed';
  savedToLibrary: boolean;
  displayName: string | null;
  preparedBy: string | null;
  issueDate: string | null;
  projectName: string;
  items: MaterialListItemPayload[];
  total: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    projectName?: string;
  };
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
  listSource: MaterialListSource;
  projectId?: number;
  displayName?: string;
  preparedBy?: string;
  issueDate?: string;
  status?: 'draft' | 'completed';
  items: MaterialListItemPayload[];
  total?: number;
}

export interface UpdateMaterialListRequest {
  displayName?: string;
  preparedBy?: string | null;
  issueDate?: string | null;
  status?: 'draft' | 'completed';
  items?: MaterialListItemPayload[];
  total?: number;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

export const materialListsService = {
  list: async (
    page = 1,
    limit = 20,
    options?: {
      status?: 'draft' | 'completed';
      listSource?: MaterialListSource;
      search?: string;
    }
  ): Promise<ApiResponse<MaterialListListResponse>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (options?.status) params.set('status', options.status);
    if (options?.listSource) params.set('listSource', options.listSource);
    if (options?.search?.trim()) params.set('search', options.search.trim());

    const response = await apiClient.get<ApiResponse<MaterialListListResponse>>(
      `/api/v1/material-lists?${params.toString()}`
    );
    return response.data;
  },

  create: async (
    data: CreateMaterialListRequest
  ): Promise<ApiResponse<{ materialList: FormattedMaterialListResponse }>> => {
    const response = await apiClient.post<ApiResponse<{ materialList: FormattedMaterialListResponse }>>(
      '/api/v1/material-lists',
      data
    );
    return response.data;
  },

  update: async (
    materialListId: number,
    data: UpdateMaterialListRequest
  ): Promise<ApiResponse<{ materialList: FormattedMaterialListResponse }>> => {
    const response = await apiClient.patch<ApiResponse<{ materialList: FormattedMaterialListResponse }>>(
      `/api/v1/material-lists/${materialListId}`,
      data
    );
    return response.data;
  },

  getByProject: async (
    projectId: number
  ): Promise<ApiResponse<{ materialList: FormattedMaterialListResponse }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: FormattedMaterialListResponse }>>(
      `/api/v1/material-lists/project/${projectId}`
    );
    return response.data;
  },

  getById: async (
    materialListId: number
  ): Promise<ApiResponse<{ materialList: FormattedMaterialListResponse }>> => {
    const response = await apiClient.get<ApiResponse<{ materialList: FormattedMaterialListResponse }>>(
      `/api/v1/material-lists/${materialListId}`
    );
    return response.data;
  },

  delete: async (materialListId: number): Promise<ApiResponse<{ id: number }>> => {
    const response = await apiClient.delete<ApiResponse<{ id: number }>>(
      `/api/v1/material-lists/${materialListId}`
    );
    return response.data;
  },
};
