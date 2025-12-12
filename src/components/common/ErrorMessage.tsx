import React, { useState } from 'react';

export interface ErrorMessageProps {
  message: string;
  detailedMessage?: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  detailedMessage,
  onDismiss,
  className = '',
  variant = 'error',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Safely convert detailedMessage to string if it's an object
  const detailedMessageStr = typeof detailedMessage === 'string' 
    ? detailedMessage 
    : detailedMessage 
      ? JSON.stringify(detailedMessage, null, 2)
      : '';
  
  const hasDetails = detailedMessageStr && detailedMessageStr.trim() !== '' && detailedMessageStr !== message;

  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const buttonColors = {
    error: 'text-red-700 hover:text-red-900 hover:bg-red-100',
    warning: 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100',
    info: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100',
  };

  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-lg border ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[variant]}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {variant === 'error' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
          {variant === 'warning' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          )}
          {variant === 'info' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          
          {/* Expandable detailed message */}
          {hasDetails && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`text-xs font-medium ${buttonColors[variant]} px-2 py-1 rounded transition-colors duration-200 flex items-center gap-1`}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Hide details' : 'Show details'}
              >
                <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="mt-2 p-3 bg-white/50 rounded border border-current/20">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {detailedMessageStr}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${iconColors[variant]} hover:opacity-75 transition-opacity`}
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

