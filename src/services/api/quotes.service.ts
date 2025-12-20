import apiClient from './apiClient';

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateQuoteRequest {
  quoteType: 'from_project' | 'standalone';
  projectId?: number | null; // Optional - only for from_project type
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'unpaid';
}

export interface Quote {
  id: number;
  userId: number;
  projectId: number | null;
  quoteType: 'from_project' | 'standalone';
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  quoteNumber: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'unpaid';
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  project: any | null;
}

export interface CreateQuoteResponse {
  quote: Quote;
  pointsDeducted: number;
  balanceAfter: number;
}

export interface QuotesListResponse {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Quotes Service
export const quotesService = {
  /**
   * Create a new quote (from project OR standalone)
   * @param data - Quote creation data
   * @returns Created quote with points deduction info
   */
  create: async (data: CreateQuoteRequest): Promise<ApiResponse<CreateQuoteResponse>> => {
    // For standalone quotes, omit projectId field entirely (don't send null)
    const requestData: any = {
      quoteType: data.quoteType,
      customerName: data.customerName,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: data.status,
    };

    // Only include projectId if it exists (for from_project type)
    if (data.quoteType === 'from_project' && data.projectId) {
      requestData.projectId = data.projectId;
    }

    // Include optional fields if provided
    if (data.customerAddress) {
      requestData.customerAddress = data.customerAddress;
    }
    if (data.customerEmail) {
      requestData.customerEmail = data.customerEmail;
    }

    const response = await apiClient.post<ApiResponse<CreateQuoteResponse>>('/api/v1/quotes', requestData);
    return response.data;
  },

  /**
   * Get all quotes for the authenticated user
   */
  list: async (page: number = 1, limit: number = 50, status?: string, quoteType?: string): Promise<ApiResponse<QuotesListResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    if (quoteType) {
      params.append('quoteType', quoteType);
    }
    const response = await apiClient.get<ApiResponse<any>>(`/api/v1/quotes?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single quote by ID
   */
  getById: async (quoteId: number): Promise<ApiResponse<Quote>> => {
    const response = await apiClient.get<ApiResponse<Quote>>(`/api/v1/quotes/${quoteId}`);
    return response.data;
  },

  /**
   * Update a quote
   */
  update: async (quoteId: number, data: Partial<CreateQuoteRequest>): Promise<ApiResponse<Quote>> => {
    const response = await apiClient.patch<ApiResponse<Quote>>(`/api/v1/quotes/${quoteId}`, data);
    return response.data;
  },

  /**
   * Delete a quote
   */
  delete: async (quoteId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/quotes/${quoteId}`);
    return response.data;
  },
};

