import apiClient from './apiClient';
import type {
  QuoteFormatConfig,
  PaymentMethod,
  PaymentMethodConfig,
  PDFExportConfig,
  MaterialPrice,
  MaterialPricesConfig,
  SavedTemplate,
  SavedTemplateType,
} from '@/types/templates';

export interface TemplateConfig {
  quoteFormat: QuoteFormatConfig;
  paymentMethods: PaymentMethod[];
  paymentMethodConfig: PaymentMethodConfig;
  pdfExport: PDFExportConfig;
  materialPrices: MaterialPrice[];
  materialPricesConfig: MaterialPricesConfig;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Templates Service - with localStorage fallback
export const templatesService = {
  /**
   * Get all template configurations from API
   * Falls back to localStorage if API is unavailable
   */
  getTemplates: async (): Promise<TemplateConfig | null> => {
    try {
      const response = await apiClient.get<ApiResponse<TemplateConfig>>('/api/v1/templates');
      return response.data.response;
    } catch (error: any) {
      // Fallback to localStorage
      console.warn('[TemplatesService] API unavailable, using localStorage:', error.message);
      const stored = localStorage.getItem('template-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.state || null;
        } catch (e) {
          console.error('[TemplatesService] Error parsing localStorage:', e);
          return null;
        }
      }
      return null;
    }
  },

  /**
   * Save all template configurations to API
   * Falls back to localStorage if API is unavailable
   */
  saveTemplates: async (config: TemplateConfig): Promise<boolean> => {
    try {
      await apiClient.put<ApiResponse<{ success: boolean }>>('/api/v1/templates', config);
      return true;
    } catch (error: any) {
      // Fallback to localStorage (handled by persist middleware)
      console.warn('[TemplatesService] API unavailable, using localStorage:', error.message);
      // The persist middleware will handle saving to localStorage
      return false;
    }
  },

  /**
   * Get payment methods from API
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ paymentMethods: PaymentMethod[] }>>(
        '/api/v1/templates/payment-methods'
      );
      return response.data.response.paymentMethods;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for payment methods:', error.message);
      return [];
    }
  },

  /**
   * Create a payment method
   */
  createPaymentMethod: async (
    method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>
  ): Promise<PaymentMethod | null> => {
    try {
      const response = await apiClient.post<ApiResponse<{ paymentMethod: PaymentMethod }>>(
        '/api/v1/templates/payment-methods',
        method
      );
      return response.data.response.paymentMethod;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for creating payment method:', error.message);
      return null;
    }
  },

  /**
   * Update a payment method
   */
  updatePaymentMethod: async (id: string, method: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
    try {
      const response = await apiClient.patch<ApiResponse<{ paymentMethod: PaymentMethod }>>(
        `/api/v1/templates/payment-methods/${id}`,
        method
      );
      return response.data.response.paymentMethod;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for updating payment method:', error.message);
      return null;
    }
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete<ApiResponse<{ success: boolean }>>(`/api/v1/templates/payment-methods/${id}`);
      return true;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for deleting payment method:', error.message);
      return false;
    }
  },

  /**
   * Get material prices from API
   */
  getMaterialPrices: async (): Promise<MaterialPrice[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ materialPrices: MaterialPrice[] }>>(
        '/api/v1/templates/material-prices'
      );
      return response.data.response.materialPrices;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for material prices:', error.message);
      return [];
    }
  },

  /**
   * Create a material price
   */
  createMaterialPrice: async (
    price: Omit<MaterialPrice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MaterialPrice | null> => {
    try {
      const response = await apiClient.post<ApiResponse<{ materialPrice: MaterialPrice }>>(
        '/api/v1/templates/material-prices',
        price
      );
      return response.data.response.materialPrice;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for creating material price:', error.message);
      return null;
    }
  },

  /**
   * Update a material price
   */
  updateMaterialPrice: async (id: string, price: Partial<MaterialPrice>): Promise<MaterialPrice | null> => {
    try {
      const response = await apiClient.patch<ApiResponse<{ materialPrice: MaterialPrice }>>(
        `/api/v1/templates/material-prices/${id}`,
        price
      );
      return response.data.response.materialPrice;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for updating material price:', error.message);
      return null;
    }
  },

  /**
   * Delete a material price
   */
  deleteMaterialPrice: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete<ApiResponse<{ success: boolean }>>(`/api/v1/templates/material-prices/${id}`);
      return true;
    } catch (error: any) {
      console.warn('[TemplatesService] API unavailable for deleting material price:', error.message);
      return false;
    }
  },

  // --- Saved Templates (user presets) - /api/v1/saved-templates ---

  /**
   * List saved templates for the current user.
   * Response: { responseMessage, response: { savedTemplates: SavedTemplate[] } }
   */
  getSavedTemplates: async (): Promise<SavedTemplate[]> => {
    const response = await apiClient.get<ApiResponse<{ savedTemplates: SavedTemplate[] }>>(
      '/api/v1/saved-templates'
    );
    const list = response.data?.response?.savedTemplates;
    if (!Array.isArray(list)) return [];
    return list.map((t) => ({ ...t, source: 'user' as const }));
  },

  /**
   * Create a saved template. Backend limit: max 3 per user (400 if exceeded).
   * Body: { name, type, quoteFormat?, pdfExport? }
   * Response (201): { responseMessage, response: { savedTemplate: SavedTemplate } }
   */
  createSavedTemplate: async (body: {
    name: string;
    type: SavedTemplateType;
    quoteFormat?: QuoteFormatConfig;
    pdfExport?: PDFExportConfig;
  }): Promise<SavedTemplate> => {
    const response = await apiClient.post<ApiResponse<{ savedTemplate: SavedTemplate }>>(
      '/api/v1/saved-templates',
      body
    );
    const saved = response.data?.response?.savedTemplate;
    if (!saved) throw new Error('Invalid response from server');
    return { ...saved, source: 'user' as const };
  },

  /**
   * Update a saved template (rename and/or snapshot).
   * Body: { name?, quoteFormat?, pdfExport? }
   * Response (200): { responseMessage, response: { savedTemplate: SavedTemplate } }
   */
  updateSavedTemplate: async (
    id: string,
    body: { name?: string; quoteFormat?: QuoteFormatConfig; pdfExport?: PDFExportConfig }
  ): Promise<SavedTemplate> => {
    const response = await apiClient.patch<ApiResponse<{ savedTemplate: SavedTemplate }>>(
      `/api/v1/saved-templates/${id}`,
      body
    );
    const saved = response.data?.response?.savedTemplate;
    if (!saved) throw new Error('Invalid response from server');
    return { ...saved, source: 'user' as const };
  },

  /**
   * Delete a saved template.
   * Response (200): { responseMessage, response: { success: true } }
   */
  deleteSavedTemplate: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<{ success: boolean }>>(`/api/v1/saved-templates/${id}`);
  },
};

