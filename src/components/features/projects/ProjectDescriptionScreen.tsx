import React, { useState } from 'react';
import Input from '@/components/common/Input';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';

interface ProjectDescriptionScreenProps {
  onBack: () => void;
  onNext: (data: ProjectDescriptionData) => void;
}

export interface ProjectDescriptionData {
  projectName: string;
  customerName: string;
  siteAddress: string;
}

const ProjectDescriptionScreen: React.FC<ProjectDescriptionScreenProps> = ({ onBack, onNext }) => {
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  const isFormValid = projectName.trim() !== '' && customerName.trim() !== '' && siteAddress.trim() !== '';

  const handleNext = () => {
    if (isFormValid) {
      const data: ProjectDescriptionData = {
        projectName: projectName.trim(),
        customerName: customerName.trim(),
        siteAddress: siteAddress.trim(),
      };
      onNext(data);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-gray-200">
        <button 
          onClick={onBack} 
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Project</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center gap-4">
            <ProgressIndicator currentStep={1} totalSteps={4} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Description</h2>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <Input
              id="projectName"
              label="Project Name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />

            <Input
              id="customerName"
              label="Customer Name"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <Input
              id="siteAddress"
              label="Site Address"
              placeholder="Enter site address"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Footer with Next Button */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-lg font-semibold transition-colors ${
            isFormValid
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProjectDescriptionScreen;
