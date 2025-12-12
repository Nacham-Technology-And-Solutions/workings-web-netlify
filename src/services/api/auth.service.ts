import apiClient from './apiClient';

export interface RegisterRequest {
  name: string;
  email: string;
  companyName: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userProfile: {
    id: number;
    name: string;
    email: string;
    companyName: string;
    subscriptionStatus: string;
    pointsBalance: number;
  };
}

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

// Auth Service
export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/log-in', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/v1/auth/log-out');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/auth/reset-password', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/api/v1/auth/refresh-token');
    return response.data;
  },
};

