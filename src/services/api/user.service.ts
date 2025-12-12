import apiClient from './apiClient';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  companyName: string;
  subscriptionStatus: 'free' | 'pro' | 'starter' | 'enterprise';
  subscriptionExpiresAt: string | null;
  pointsBalance: number;
  isAdmin: boolean;
  isActive: boolean;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  companyName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateBankDetailsRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface PointsTransaction {
  id: number;
  userId: number;
  type: 'deduction' | 'credit' | 'subscription_renewal';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedTo: {
    type: 'calculation' | 'quote' | 'subscription';
    referenceId: number;
  };
  description: string;
  createdAt: string;
}

export interface PointsHistoryResponse {
  transactions: PointsTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// User Service
export const userService = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId: number): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>(`/api/v1/user/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: number, data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.patch<ApiResponse<UserProfile>>(`/api/v1/user/${userId}`, data);
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (userId: number, data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>(`/api/v1/user/${userId}/password`, data);
    return response.data;
  },

  /**
   * Update bank details
   */
  updateBankDetails: async (userId: number, data: UpdateBankDetailsRequest): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.patch<ApiResponse<UserProfile>>(`/api/v1/user/${userId}/bank-details`, data);
    return response.data;
  },

  /**
   * Get points transaction history
   */
  getPointsHistory: async (userId: number, limit: number = 50, offset: number = 0): Promise<ApiResponse<PointsHistoryResponse>> => {
    const response = await apiClient.get<ApiResponse<PointsHistoryResponse>>(
      `/api/v1/user/${userId}/points-history?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },
};

