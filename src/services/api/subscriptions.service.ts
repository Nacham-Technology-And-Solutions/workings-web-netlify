import apiClient from './apiClient';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export interface CurrentSubscription {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  expiresAt: string | null;
  pointsBalance: number;
  subscriptionStatus: string;
}

export interface SubscribeRequest {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
}

export interface SubscribeResponse {
  reference: string;
  authorizationUrl: string;
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Subscriptions Service
export const subscriptionsService = {
  /**
   * Get all available subscription plans
   */
  getPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/api/v1/subscriptions/plans');
    return response.data;
  },

  /**
   * Get user's current subscription details (includes points balance)
   */
  getCurrent: async (): Promise<ApiResponse<CurrentSubscription>> => {
    const response = await apiClient.get<ApiResponse<CurrentSubscription>>('/api/v1/subscriptions/current');
    return response.data;
  },

  /**
   * Subscribe to a plan (initiates Paystack payment)
   */
  subscribe: async (data: SubscribeRequest): Promise<ApiResponse<SubscribeResponse>> => {
    const response = await apiClient.post<ApiResponse<SubscribeResponse>>('/api/v1/subscriptions/subscribe', data);
    return response.data;
  },

  /**
   * Cancel current subscription
   */
  cancel: async (reason?: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/subscriptions/cancel', {
      reason: reason || undefined,
    });
    return response.data;
  },
};

