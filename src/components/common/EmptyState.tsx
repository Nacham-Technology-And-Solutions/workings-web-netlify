import React from 'react';
import { EmptyStateIcon } from '@/assets/icons/IconComponents';

interface EmptyStateProps {
  title: string;
  message: string;
  onAction: () => void;
  actionText: string;
  /** Optional: custom icon image src (e.g. screen-specific illustration) */
  iconSrc?: string;
  /** Optional: when set, show a round plus-style button instead of text button */
  actionIcon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, onAction, actionText, iconSrc, actionIcon }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
      {iconSrc ? (
        <img src={iconSrc} alt="" aria-hidden />
      ) : (
        <EmptyStateIcon className="mb-4" />
      )}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="max-w-xs mx-auto mb-6 text-gray-500">{message}</p>
      {actionIcon ? (
        <button
          onClick={onAction}
          className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform hover:scale-110"
          aria-label={actionText}
        >
          {actionIcon}
        </button>
      ) : (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
