/**
 * Validation error utilities for API ZodError responses.
 * Aligns with docs/frontend/FRONTEND_ZOD_VALIDATION_ERROR_LIST.md.
 *
 * API returns 400 with:
 * { error: "ZodError(input validation error)", responseMessage: [ { code, path, message } ] }
 */

import { AxiosError } from 'axios';

export interface ValidationIssue {
  path: string;
  message: string;
  code?: string;
}

/** Raw issue from API responseMessage array */
interface ApiValidationIssue {
  code?: string;
  path: (string | number)[];
  message: string;
}

const ZOD_ERROR_LABEL = 'ZodError(input validation error)';

/**
 * Checks if the response data is the API's ZodError validation format.
 */
export function isZodErrorResponse(data: unknown): data is { responseMessage: ApiValidationIssue[] } {
  if (!data || typeof data !== 'object') return false;
  const d = data as { error?: string; responseMessage?: unknown };
  return (
    d.error === ZOD_ERROR_LABEL &&
    Array.isArray(d.responseMessage) &&
    d.responseMessage.length > 0
  );
}

/**
 * Converts API path array to a dot-notation string (e.g. ["body","items",0,"quantity"] -> "body.items.0.quantity").
 * Drops "body" prefix when present so we can map to form field names (e.g. customerName, items.0.quantity).
 */
export function pathToFieldKey(path: (string | number)[]): string {
  if (path.length === 0) return 'form';
  const parts = path.filter((p) => p !== 'body');
  return parts.length > 0 ? parts.join('.') : path.join('.');
}

/**
 * Extracts validation issues from API response data (e.g. 400 body).
 * Use when the API returns without throwing (e.g. normalized response with success: false).
 */
export function getValidationIssuesFromData(data: unknown): ValidationIssue[] {
  if (!isZodErrorResponse(data)) return [];
  return (data.responseMessage as ApiValidationIssue[]).map((issue) => ({
    path: pathToFieldKey(issue.path),
    message: issue.message || 'Invalid value',
    code: issue.code,
  }));
}

/**
 * Extracts validation issues from an Axios error when the API returned a ZodError.
 * Returns empty array if not a ZodError or no response.
 */
export function getValidationIssues(error: unknown): ValidationIssue[] {
  if (!(error instanceof AxiosError)) return [];
  const data = error.response?.data;
  return getValidationIssuesFromData(data);
}

/**
 * Builds a record of field key -> message for use with form state (e.g. setErrors).
 * For paths like "email", "customerName", "items.0.quantity" you get one message per field.
 * If multiple issues target the same path, the first message is used (or you can pass a reducer).
 */
export function getFieldErrorsFromIssues(
  issues: ValidationIssue[],
  options?: { pathToField?: (path: string) => string }
): Record<string, string> {
  const pathToField = options?.pathToField ?? ((p) => p);
  const acc: Record<string, string> = {};
  for (const issue of issues) {
    const field = pathToField(issue.path);
    if (!acc[field]) acc[field] = issue.message;
  }
  return acc;
}

/**
 * Common path -> form field name for login (email, password).
 */
export function authPathToField(path: string): string {
  const lower = path.toLowerCase();
  if (lower === 'name') return 'name';
  if (lower === 'email') return 'email';
  if (lower === 'password') return 'password';
  if (lower === 'companyname') return 'company'; // Registration form uses "company"
  return path;
}

/**
 * Path -> field for reset password (token, email, newPassword, confirmPassword).
 * API may send "password" for new password field.
 */
export function resetPasswordPathToField(path: string): string {
  const lower = path.toLowerCase();
  if (lower === 'email') return 'email';
  if (lower === 'password' || lower === 'newpassword') return 'newPassword';
  if (lower === 'token') return 'token';
  return path;
}

/**
 * Returns a single summary message from validation issues (e.g. for toast or alert title).
 */
export function getValidationSummaryMessage(issues: ValidationIssue[]): string {
  if (issues.length === 0) return 'Please check your input.';
  if (issues.length === 1) return issues[0].message;
  return `Please fix ${issues.length} validation error${issues.length > 1 ? 's' : ''}.`;
}
