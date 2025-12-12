import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL from environment or default to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});
 

// Request interceptor - Add auth token and email to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (userEmail) {
      config.headers.email = userEmail;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const userEmail = localStorage.getItem('userEmail');

      // If we have refresh token, try to refresh
      if (refreshToken && userEmail) {
        try {
          const response = await axios.post(
            `${BASE_URL}/api/v1/auth/refresh-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                email: userEmail,
              },
              withCredentials: true,
            }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.response;

          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - fall through to redirect
        }
      }

      // No refresh token or refresh failed - redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
      
      // Redirect immediately
      window.location.href = '/login';
      
      // Return a rejected promise with a special flag to indicate redirect
      const redirectError = new Error('Authentication required');
      (redirectError as any).isAuthError = true;
      (redirectError as any).redirecting = true;
      return Promise.reject(redirectError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

