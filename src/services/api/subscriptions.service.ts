import apiClient from './apiClient';

export type SubscriptionPlanId = 'free' | 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  pointsPerMonth: number;
  projectsLimit: number | null;
  modules: string[];
  features: string[];
}

export interface PaymentProviderInfo {
  name: PaymentProvider;
  enabled: boolean;
  priority: number;
}

export interface PaymentProvidersResponse {
  providers: PaymentProviderInfo[];
  defaultProvider: PaymentProvider;
}

export interface CurrentSubscription {
  plan: SubscriptionPlanId;
  billingCycle: BillingCycle;
  startDate: string | null;
  endDate: string | null;
  status: SubscriptionStatus;
  pointsBalance: number;
}

export interface SubscribeRequest {
  plan: SubscriptionPlanId;
  billingCycle: BillingCycle;
  paymentProvider?: PaymentProvider;
}

export interface SubscribeResponse {
  authorizationUrl: string;
  accessCode?: string; // Paystack only
  reference: string;
  paymentProvider: PaymentProvider;
  amount: number;
  plan: SubscriptionPlanId;
  billingCycle: BillingCycle;
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
  getPlans: async (): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> => {
    const response = await apiClient.get<ApiResponse<{ plans: SubscriptionPlan[] }>>('/api/v1/subscriptions/plans');
    return response.data;
  },

  /**
   * Get available payment providers
   */
  getPaymentProviders: async (): Promise<ApiResponse<PaymentProvidersResponse>> => {
    const response = await apiClient.get<ApiResponse<PaymentProvidersResponse>>('/api/v1/subscriptions/payment-providers');
    return response.data;
  },

  /**
   * Get user's current subscription details (includes points balance)
   */
  getCurrent: async (): Promise<ApiResponse<{ subscription: CurrentSubscription }>> => {
    const response = await apiClient.get<ApiResponse<{ subscription: CurrentSubscription }>>('/api/v1/subscriptions/current');
    return response.data;
  },

  /**
   * Subscribe to a plan (initiates payment with selected provider)
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

