import apiClient from './apiClient';
import type { ProjectData, GlazingDimension } from '@/types/project';
import type { CalculationResult } from '@/types/calculations';

export interface Project {
  id: number;
  userId: number;
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
  calculationSettings: {
    stockLength: number;
    bladeKerf: number;
    wasteThreshold: number;
  };
  calculated: boolean;
  lastCalculatedAt: string | null;
  status: 'draft' | 'calculated' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
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

export interface UpdateProjectRequest {
  projectName?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  siteAddress?: string;
  description?: string;
  glazingDimensions?: GlazingDimension[];
  calculationSettings?: {
    stockLength?: number;
    bladeKerf?: number;
    wasteThreshold?: number;
  };
  status?: 'draft' | 'calculated' | 'archived';
}

export interface ProjectsListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

/** GET project response: project + optional last calculation result (when calculated) */
export interface GetProjectByIdResponse {
  project: Project;
  lastCalculationResult: CalculationResult | null;
}

/** Response from POST /projects/:projectId/calculate */
export interface ProjectCalculateResponse {
  project: Project;
  calculationResult: {
    materialList: { id: number; materialList: unknown[]; pointsCost?: number };
    cuttingList: { id: number; cuttingList: unknown[]; elements?: { id: string; title: string; color: string }[] };
    glassCuttingList: { id: number; glassList: unknown; rubberTotals?: unknown[]; accessoryTotals?: unknown[]; elements?: { id: string; title: string; color: string }[] };
    result: CalculationResult;
  };
  pointsDeducted?: number;
  balanceAfter?: number;
}

// Projects Service
export const projectsService = {
  /**
   * Create a new project
   */
  create: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post<ApiResponse<Project>>('/api/v1/projects', data);
    return response.data;
  },

  /**
   * Get all projects for the authenticated user
   */
  list: async (page: number = 1, limit: number = 50, search?: string): Promise<ApiResponse<ProjectsListResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('q', search);
    }
    const response = await apiClient.get<ApiResponse<ProjectsListResponse>>(`/api/v1/projects?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single project by ID. When the project has been calculated, response includes lastCalculationResult.
   */
  getById: async (projectId: number): Promise<ApiResponse<GetProjectByIdResponse>> => {
    const response = await apiClient.get<ApiResponse<GetProjectByIdResponse>>(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  /**
   * Update a project
   */
  update: async (projectId: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await apiClient.patch<ApiResponse<Project>>(`/api/v1/projects/${projectId}`, data);
    return response.data;
  },

  /**
   * Delete a project
   */
  delete: async (projectId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  /**
   * Run calculation on a project. Uses stored glazingDimensions and calculationSettings.
   * Results are saved to the project and returned. GET project will include lastCalculationResult.
   */
  calculate: async (projectId: number): Promise<ApiResponse<ProjectCalculateResponse>> => {
    const response = await apiClient.post<ApiResponse<ProjectCalculateResponse>>(
      `/api/v1/projects/${projectId}/calculate`,
      {}
    );
    return response.data;
  },
};

