import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = (currentStep / totalSteps) * circumference;

  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 72 72">
        <circle
          className="text-gray-200"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="36"
          cy="36"
        />
        <circle
          className="text-cyan-600"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="36"
          cy="36"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gray-800 font-medium text-sm">
          {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
