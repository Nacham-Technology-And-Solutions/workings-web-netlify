import apiClient from './apiClient';
import type { ProjectCartItem, CalculationSettings, CalculationResult } from '@/types/calculations';

export interface CalculateRequest {
  projectCart: ProjectCartItem[];
  settings: CalculationSettings;
}

export interface VerifyRequest {
  projectCart: ProjectCartItem[];
  settings: CalculationSettings;
  frontendResult: CalculationResult;
}

export interface VerifyResponse {
  isValid: boolean;
  differences?: {
    materialList?: string[];
    cuttingList?: string[];
    glassList?: string[];
    rubberTotals?: string[];
    accessoryTotals?: string[];
  };
  backendResult?: CalculationResult;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Calculations Service
export const calculationsService = {
  /**
   * Run calculation engine on Project Cart
   * Points are deducted after successful calculation
   */
  calculate: async (data: CalculateRequest): Promise<ApiResponse<CalculationResult>> => {
    const response = await apiClient.post<ApiResponse<CalculationResult>>('/api/v1/calculations/calculate', data);
    return response.data;
  },

  /**
   * Verify frontend calculation results against backend
   * No points deduction
   */
  verify: async (data: VerifyRequest): Promise<ApiResponse<VerifyResponse>> => {
    const response = await apiClient.post<ApiResponse<VerifyResponse>>('/api/v1/calculations/verify', data);
    return response.data;
  },
};

