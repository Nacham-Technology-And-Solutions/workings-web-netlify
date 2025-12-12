/**
 * API Response Helper Utilities
 * 
 * Backend API responses do NOT include a success field.
 * Successful responses have structure: { responseMessage?: string, response: T }
 * Errors are returned as HTTP error status codes (4xx, 5xx)
 */

export interface ApiResponse<T> {
  responseMessage?: string;
  message?: string;
  response: T;
}

/**
 * Normalizes an API response to ensure consistent structure
 * Note: Backend doesn't send success field - if we get a response, it's successful
 * @param response - The API response from backend
 * @returns Normalized response with success field (always true if response exists)
 */
export function normalizeApiResponse<T>(response: any): {
  success: boolean;
  message: string;
  response: T;
} {
  // Backend doesn't send success field - if we have a response, it's successful
  // Errors come as HTTP error status codes, not success: false

  // If response has a 'response' field, it's successful
  if (response.response !== undefined) {
    return {
      success: true,
      message: response.responseMessage || response.message || 'Success',
      response: response.response,
    };
  }

  // If response is the data itself (no wrapper), wrap it
  return {
    success: true,
    message: response.responseMessage || response.message || 'Success',
    response: response as T,
  };
}

/**
 * Checks if an API response is successful
 * @param response - The API response
 * @returns true if successful, false otherwise
 */
export function isApiResponseSuccess<T>(response: any): boolean {
  const normalized = normalizeApiResponse<T>(response);
  return normalized.success === true;
}

/**
 * Extracts the data from an API response
 * @param response - The API response
 * @returns The response data
 */
export function getApiResponseData<T>(response: any): T {
  const normalized = normalizeApiResponse<T>(response);
  return normalized.response;
}

/**
 * Gets the error message from an API response
 * @param response - The API response
 * @returns Error message or default message
 */
export function getApiResponseMessage(response: any): string {
  const normalized = normalizeApiResponse(response);
  if (!normalized.success) {
    return normalized.message || 'An error occurred';
  }
  return normalized.message || 'Success';
}

