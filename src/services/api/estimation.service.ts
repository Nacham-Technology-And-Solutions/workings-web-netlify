import apiClient from './apiClient';
import type {
  PriceFillResponse,
  PriceFillSource,
  MaterialCatalogResponse,
  MaterialCatalogQueryParams,
  EstimationPreviewRequest,
  EstimationPreviewResponse,
  EstimationQuoteRequest,
  EstimationSaveResponse,
} from '@/types/estimation';

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

export const estimationService = {
  getMaterialCatalog: async (
    params?: MaterialCatalogQueryParams
  ): Promise<MaterialCatalogResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    const response = await apiClient.get<MaterialCatalogResponse>(
      `/api/v1/estimation/material-catalog${query ? `?${query}` : ''}`
    );
    return response.data;
  },

  getPriceFill: async (
    projectId: number,
    source: PriceFillSource = 'last_used'
  ): Promise<PriceFillResponse> => {
    const params = new URLSearchParams({
      projectId: String(projectId),
      source,
    });
    const response = await apiClient.get<PriceFillResponse>(
      `/api/v1/estimation/price-fill?${params.toString()}`
    );
    return response.data;
  },

  preview: async (data: EstimationPreviewRequest): Promise<EstimationPreviewResponse> => {
    const response = await apiClient.post<EstimationPreviewResponse>(
      '/api/v1/estimation/preview',
      data
    );
    return response.data;
  },

  createQuote: async (data: EstimationQuoteRequest): Promise<EstimationSaveResponse> => {
    const response = await apiClient.post<EstimationSaveResponse>(
      '/api/v1/estimation/quotes',
      data
    );
    return response.data;
  },
};
