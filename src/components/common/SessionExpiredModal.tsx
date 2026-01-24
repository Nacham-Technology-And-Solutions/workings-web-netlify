import React, { useEffect } from 'react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  message?: string;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onConfirm,
  message = 'Your session has expired. Please sign in again to continue.',
}) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Icon */}
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Session Expired
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6 text-center">{message}</p>

        {/* Action Button */}
        <button
          onClick={onConfirm}
          className="w-full px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
