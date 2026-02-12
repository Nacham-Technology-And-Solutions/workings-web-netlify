import React from 'react';
import type { ValidationIssue } from '@/utils/validationErrors';

export interface ValidationErrorAlertProps {
  /** List of validation issues from API (path + message). Shown as a clear list. */
  issues: ValidationIssue[];
  onDismiss?: () => void;
  className?: string;
  /** Optional title; default "Please fix the following:" */
  title?: string;
}

/**
 * Shows API validation errors in a single, scannable block so users know exactly what to fix.
 * Use with getValidationIssues(error) when the API returns ZodError.
 */
const ValidationErrorAlert: React.FC<ValidationErrorAlertProps> = ({
  issues,
  onDismiss,
  className = '',
  title = 'Please fix the following:',
}) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-2">{title}</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-600 hover:opacity-75 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ValidationErrorAlert;
