import { AxiosError } from 'axios';

/**
 * Safely converts responseMessage to string, handling ZodError objects
 */
function parseResponseMessage(responseMessage: string | object | undefined): string {
  if (!responseMessage) return '';
  
  if (typeof responseMessage === 'string') {
    return responseMessage;
  }
  
  if (typeof responseMessage === 'object' && responseMessage !== null) {
    const zodError = responseMessage as any;
    if (zodError.issues && Array.isArray(zodError.issues) && zodError.issues.length > 0) {
      // Format ZodError issues into readable messages
      return zodError.issues.map((issue: any, index: number) => {
        const path = issue.path && issue.path.length > 0 
          ? issue.path.join('.') 
          : 'field';
        return `${index + 1}. ${path}: ${issue.message || 'Validation failed'}`;
      }).join('\n');
    }
    // Fallback: stringify the object
    return JSON.stringify(responseMessage, null, 2);
  }
  
  return String(responseMessage);
}

/**
 * API Error Response Structure
 */
export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  responseMessage?: string | {
    issues?: Array<{
      validation?: string;
      code?: string;
      message?: string;
      path?: (string | number)[];
      name?: string;
    }>;
  }; // Backend sends detailed error in this field (can be string or ZodError object)
  errors?: {
    [key: string]: string | string[];
  };
  details?: string;
}

/**
 * User-friendly error message structure
 */
export interface ErrorMessage {
  message: string;
  detailedMessage?: string;
  field?: string;
  code?: string;
}

/**
 * Maps HTTP status codes to user-friendly messages
 */
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This resource already exists. Please use a different value.',
  422: 'Validation error. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service is currently under maintenance. Please try again later.',
  504: 'Request timeout. Please try again.',
};

/**
 * Maps common error messages to user-friendly versions
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Email already exists': 'This email is already registered. Please sign in or use a different email.',
  'Invalid email or password': 'The email or password you entered is incorrect. Please try again.',
  'User not found': 'No account found with this email address.',
  'Invalid token': 'Your session has expired. Please sign in again.',
  'Token expired': 'Your session has expired. Please sign in again.',
  'Insufficient points': 'You do not have enough points to perform this action. Please upgrade your subscription.',
  'Subscription expired': 'Your subscription has expired. Please renew to continue using this feature.',
  'Invalid module_id': 'Invalid glazing type selected. Please try again.',
  'Calculation failed': 'The calculation could not be completed. Please check your inputs and try again.',
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout': 'The request took too long. Please try again.',
};

/**
 * Extracts error message from Axios error
 */
export function extractErrorMessage(error: unknown): ErrorMessage {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const response = error.response;
    const request = error.request;

    // Network error (no response received)
    if (!response && request) {
      return {
        message: ERROR_MESSAGE_MAP['Network Error'] || 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // Response received with error
    if (response) {
      const status = response.status;
      const data = response.data as ApiErrorResponse;

      // Priority 1: Check for responseMessage (backend's detailed error message)
      if (data.responseMessage) {
        let detailedMessageStr: string;
        let shortMessage: string;
        
        // Handle ZodError structure (responseMessage is an object with issues)
        if (typeof data.responseMessage === 'object' && data.responseMessage !== null) {
          const zodError = data.responseMessage as { issues?: Array<{ message?: string; path?: (string | number)[] }> };
          
          if (zodError.issues && Array.isArray(zodError.issues) && zodError.issues.length > 0) {
            // Extract the first issue message as the main message
            const firstIssue = zodError.issues[0];
            const fieldPath = firstIssue.path && firstIssue.path.length > 0 
              ? firstIssue.path.join('.') 
              : 'field';
            
            shortMessage = firstIssue.message || 'Validation error';
            
            // Build detailed message from all issues
            const allIssues = zodError.issues.map((issue, index) => {
              const path = issue.path && issue.path.length > 0 
                ? issue.path.join('.') 
                : 'unknown';
              return `${index + 1}. ${path}: ${issue.message || 'Validation failed'}`;
            }).join('\n');
            
            detailedMessageStr = `Validation Errors:\n${allIssues}`;
          } else {
            // Fallback if issues array is empty or malformed
            detailedMessageStr = JSON.stringify(data.responseMessage, null, 2);
            shortMessage = data.error || 'Validation error';
          }
        } else {
          // responseMessage is a string
          detailedMessageStr = data.responseMessage;
          shortMessage = ERROR_MESSAGE_MAP[data.responseMessage] || 
                         (data.error ? ERROR_MESSAGE_MAP[data.error] || data.error : 'An error occurred');
        }
        
        return {
          message: shortMessage,
          detailedMessage: detailedMessageStr,
          code: `API_ERROR_${status}`,
        };
      }

      // Priority 2: Try to extract field-specific errors
      if (data.errors && typeof data.errors === 'object') {
        const firstError = Object.entries(data.errors)[0];
        if (firstError) {
          const [field, errorValue] = firstError;
          const errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
          const detailedMessage = data.responseMessage || data.message || data.error || data.details || JSON.stringify(data.errors, null, 2);
          return {
            message: errorMessage,
            detailedMessage: detailedMessage !== errorMessage ? detailedMessage : undefined,
            field,
            code: `FIELD_ERROR_${field.toUpperCase()}`,
          };
        }
      }

      // Priority 3: Try to extract general error message
      if (data.message) {
        const rawMessage = data.message;
        const mappedMessage = ERROR_MESSAGE_MAP[rawMessage] || rawMessage;
        const detailedMessage = parseResponseMessage(data.responseMessage) || data.error || data.details || (rawMessage !== mappedMessage ? rawMessage : undefined);
        return {
          message: mappedMessage,
          detailedMessage: detailedMessage,
          code: `API_ERROR_${status}`,
        };
      }

      // Priority 4: Check error field
      if (data.error) {
        const rawError = data.error;
        const mappedMessage = ERROR_MESSAGE_MAP[rawError] || rawError;
        const detailedMessage = parseResponseMessage(data.responseMessage) || data.details || (rawError !== mappedMessage ? rawError : undefined);
        return {
          message: mappedMessage,
          detailedMessage: detailedMessage,
          code: `API_ERROR_${status}`,
        };
      }

      // Fallback to status code message
      const statusMessage = STATUS_CODE_MESSAGES[status] || `An error occurred (${status}). Please try again.`;
      const detailedMessage = parseResponseMessage(data.responseMessage) || data.details || (data.message ? data.message : undefined);
      return {
        message: statusMessage,
        detailedMessage: detailedMessage,
        code: `HTTP_${status}`,
      };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: ERROR_MESSAGE_MAP[error] || error,
      code: 'STRING_ERROR',
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const mappedMessage = ERROR_MESSAGE_MAP[error.message] || error.message;
    return {
      message: mappedMessage || 'An unexpected error occurred. Please try again.',
      code: 'ERROR_OBJECT',
    };
  }

  // Default fallback
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Extracts field-specific errors from API response
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error instanceof AxiosError) {
    const response = error.response;
    if (response?.data) {
      const data = response.data as ApiErrorResponse;
      if (data.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([field, errorValue]) => {
          fieldErrors[field] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
      }
    }
  }

  return fieldErrors;
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
}

/**
 * Checks if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}

/**
 * Checks if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
}

/**
 * Gets a user-friendly error message for display
 */
export function getUserFriendlyError(error: unknown): string {
  return extractErrorMessage(error).message;
}

