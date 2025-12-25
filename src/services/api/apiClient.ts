import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import logger from '@/utils/logger';

// Base URL from environment or default to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.140.21.6:5000';
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Mutex to prevent concurrent token refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshPromise: Promise<string> | null = null;
let isRedirecting = false;

// Function to subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Function to notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

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
    const startTime = Date.now();

    // Store start time for duration calculation
    (config as any).__startTime = startTime;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else if (import.meta.env.DEV && !config.url?.includes('/auth/')) {
      // Warn in dev mode if making authenticated request without token
      console.warn('[API Request] Making request without access token:', config.url);
      logger.warn('API_REQUEST', 'Making request without access token', { url: config.url });
    }

    if (userEmail) {
      config.headers.email = userEmail;
    }

    // Ensure withCredentials is always true for cookie-based auth
    config.withCredentials = true;

    // Log the request
    logger.logRequest(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || '',
      config.headers,
      config.data
    );

    // Enhanced logging for debugging cookie issues
    if (import.meta.env.DEV && config.url?.includes('/projects')) {
      logger.debug('API_REQUEST', 'Projects request details', {
        hasAccessToken: !!accessToken,
        hasUserEmail: !!userEmail,
        withCredentials: config.withCredentials,
        url: config.url,
        // Note: Can't directly check cookies in JS due to security, but we can verify withCredentials
      });
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error('API_REQUEST', 'Request interceptor error', { error });
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { __startTime?: number };
    const duration = config.__startTime ? Date.now() - config.__startTime : undefined;
    
    // Log successful response
    logger.logResponse(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || '',
      response.status,
      response.data,
      duration
    );

    // Log cookie-related headers for login responses (to debug cookie issues)
    if (config.url?.includes('/auth/log-in')) {
      const setCookieHeader = response.headers['set-cookie'];
      logger.info('AUTH', 'Login response - cookie check', {
        status: response.status,
        hasSetCookieHeader: !!setCookieHeader,
        setCookieCount: Array.isArray(setCookieHeader) ? setCookieHeader.length : (setCookieHeader ? 1 : 0),
        // Note: set-cookie header might not be accessible due to CORS restrictions
        // If this shows false, cookies aren't being set or aren't accessible
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; __startTime?: number };
    const duration = originalRequest?.__startTime ? Date.now() - originalRequest.__startTime : undefined;

    // Log the error
    logger.logApiError(
      originalRequest?.method?.toUpperCase() || 'UNKNOWN',
      originalRequest?.url || '',
      error,
      duration
    );

    // Handle CORS errors - provide helpful error message
    if (!error.response && error.message) {
      // Network error or CORS error
      const isCorsError = error.message.includes('CORS') || 
                         error.message.includes('Access-Control') ||
                         error.message.includes('Network Error') ||
                         error.code === 'ERR_NETWORK';
      
      if (isCorsError) {
        logger.error('API_ERROR', 'CORS error detected', {
          url: originalRequest?.url,
          message: error.message,
          code: error.code,
        });
        const corsError = new Error(
          'Unable to connect to the server. This may be due to CORS configuration issues. Please contact support if this problem persists.'
        );
        (corsError as any).isCorsError = true;
        (corsError as any).originalError = error;
        return Promise.reject(corsError);
      }
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const userEmail = localStorage.getItem('userEmail');

      logger.warn('AUTH', '401 Unauthorized - attempting token refresh', {
        url: originalRequest.url,
        hasRefreshToken: !!refreshToken,
        hasUserEmail: !!userEmail,
        isRefreshing,
        waitingRequests: refreshSubscribers.length,
      });

      if (import.meta.env.DEV) {
        console.log('[API 401] Unauthorized request:', originalRequest.url, {
          hasRefreshToken: !!refreshToken,
          hasUserEmail: !!userEmail,
          isRefreshing,
          waitingRequests: refreshSubscribers.length,
        });
      }

      // If we don't have refresh token or email, redirect to login immediately
      if (!refreshToken || !userEmail) {
        logger.error('AUTH', 'Missing refresh token or email - redirecting to login', {
          url: originalRequest.url,
        });
        if (import.meta.env.DEV) {
          console.warn('[API 401] Missing refresh token or email - redirecting to login');
        }
        clearAuthAndRedirect();
        const redirectError = new Error('Authentication required');
        (redirectError as any).isAuthError = true;
        (redirectError as any).redirecting = true;
        return Promise.reject(redirectError);
      }

      // If already refreshing, wait for the refresh to complete
      if (isRefreshing && refreshPromise) {
        logger.debug('AUTH', 'Token refresh in progress, queuing request', {
          url: originalRequest.url,
          waitingRequests: refreshSubscribers.length + 1,
        });
        if (import.meta.env.DEV) {
          console.log('[API 401] Token refresh in progress, queuing request:', originalRequest.url);
        }
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            logger.debug('AUTH', 'Retrying queued request with new token', {
              url: originalRequest.url,
            });
            if (import.meta.env.DEV) {
              console.log('[API 401] Retrying queued request with new token:', originalRequest.url);
            }
            resolve(apiClient(originalRequest));
          });
        }).catch((err) => {
          // If refresh failed, reject with error
          return Promise.reject(err);
        });
      }

      // Start refresh process
      isRefreshing = true;
      logger.info('AUTH', 'Starting token refresh', {
        waitingRequests: refreshSubscribers.length,
      });
      refreshPromise = (async () => {
        try {
          if (import.meta.env.DEV) {
            console.log('[Token Refresh] Starting token refresh...');
          }

          const refreshStartTime = Date.now();
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

          // Check if response structure is correct
          if (!response.data || !response.data.response) {
            throw new Error('Invalid refresh token response');
          }

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.response;

          if (!newAccessToken || !newRefreshToken) {
            throw new Error('Missing tokens in refresh response');
          }

          // Update tokens in localStorage
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Update auth store if available
          try {
            const { useAuthStore } = await import('@/stores');
            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          } catch (storeError) {
            // Store might not be available, continue anyway
            console.warn('Could not update auth store:', storeError);
            logger.warn('AUTH', 'Could not update auth store', { error: storeError });
          }

          const refreshDuration = Date.now() - refreshStartTime;
          logger.info('AUTH', 'Token refresh successful', {
            duration: `${refreshDuration}ms`,
            waitingRequests: refreshSubscribers.length,
          });

          if (import.meta.env.DEV) {
            console.log('[Token Refresh] Token refresh successful. Notifying', refreshSubscribers.length, 'waiting requests');
          }

          // Notify all waiting requests
          onTokenRefreshed(newAccessToken);

          isRefreshing = false;
          refreshPromise = null;

          return newAccessToken;
        } catch (refreshError: any) {
          isRefreshing = false;
          refreshPromise = null;

          // Check if refresh token is also invalid (401)
          if (refreshError.response?.status === 401) {
            logger.error('AUTH', 'Refresh token is invalid or expired', {
              error: refreshError.response?.data,
              status: refreshError.response?.status,
            });
            console.error('[Token Refresh] Refresh token is invalid or expired');
            clearAuthAndRedirect();
            const authError = new Error('Session expired. Please sign in again.');
            (authError as any).isAuthError = true;
            (authError as any).redirecting = true;
            throw authError;
          }

          // Other errors during refresh
          logger.error('AUTH', 'Token refresh failed', {
            error: refreshError.message,
            status: refreshError.response?.status,
            data: refreshError.response?.data,
          });
          console.error('[Token Refresh] Token refresh failed:', refreshError);
          clearAuthAndRedirect();
          const refreshFailedError = new Error('Unable to refresh session. Please sign in again.');
          (refreshFailedError as any).isAuthError = true;
          (refreshFailedError as any).redirecting = true;
          throw refreshFailedError;
        }
      })();

      try {
        const newAccessToken = await refreshPromise;

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - error already handled in refreshPromise
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to clear auth and redirect to login
function clearAuthAndRedirect() {
  // Prevent multiple redirects
  if (isRedirecting) {
    logger.debug('AUTH', 'Redirect already in progress, skipping');
    return;
  }

  isRedirecting = true;

  const currentPath = window.location.pathname;
  logger.logRedirect(currentPath, '/login', 'Authentication failed or session expired');

  // Clear all auth data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');

  logger.info('AUTH', 'Cleared authentication data and redirecting to login');

  // Clear auth store if available
  import('@/stores').then(({ useAuthStore }) => {
    useAuthStore.getState().logout();
  }).catch(() => {
    // Store might not be available, continue anyway
  });

  // Redirect to login
  window.location.href = '/login';
}

export default apiClient;

