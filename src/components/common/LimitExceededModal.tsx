import React, { useEffect } from 'react';

interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message: string;
  title?: string;
}

const LimitExceededModal: React.FC<LimitExceededModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  message,
  title = 'Limit Reached',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] transition-all duration-300">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 flex flex-col items-center text-center transform scale-100 transition-transform duration-300">
        {/* Premium Upgrade Badge/Icon */}
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
          <svg
            className="w-8 h-8 text-amber-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:order-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full sm:order-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitExceededModal;
