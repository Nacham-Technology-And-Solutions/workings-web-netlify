import React from 'react';

const SetupWorkspaceScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 font-sans">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className="w-16 h-16 border-4 border-gray-200 border-t-sky-500 rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        ></div>
        <p className="text-gray-600 text-lg">Setting up your workspace...</p>
      </div>
    </div>
  );
};

export default SetupWorkspaceScreen;
