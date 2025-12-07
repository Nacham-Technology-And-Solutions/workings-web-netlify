import React from 'react';

const SetupWorkspaceScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 font-sans">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Loading spinner matching the image */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div 
            className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          ></div>
        </div>
        <p className="text-gray-600 text-lg font-medium">Setting up your workspace...</p>
      </div>
    </div>
  );
};

export default SetupWorkspaceScreen;
