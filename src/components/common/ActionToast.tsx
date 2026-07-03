import React, { useEffect } from 'react';

interface ActionToastProps {
  message: string;
  type?: 'success' | 'error';
  onDismiss: () => void;
  durationMs?: number;
}

const ActionToast: React.FC<ActionToastProps> = ({
  message,
  type = 'success',
  onDismiss,
  durationMs = 4000,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[120] mx-auto max-w-md p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
      role="status"
    >
      <p className="text-white font-medium text-center text-sm">{message}</p>
    </div>
  );
};

export default ActionToast;
