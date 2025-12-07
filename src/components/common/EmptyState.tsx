import React from 'react';
import { EmptyStateIcon } from '@/assets/icons/IconComponents';

interface EmptyStateProps {
  title: string;
  message: string;
  onAction: () => void;
  actionText: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, onAction, actionText }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
      <EmptyStateIcon className="mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="max-w-xs mx-auto mb-6 text-gray-500">{message}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
      >
        {actionText}
      </button>
    </div>
  );
};

export default EmptyState;
