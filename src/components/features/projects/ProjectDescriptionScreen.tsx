import React, { useState } from 'react';
import Input from '@/components/common/Input';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';

interface ProjectDescriptionData {
  projectName: string;
  customerName: string;
  siteAddress: string;
}

interface ProjectDescriptionScreenProps {
  onBack: () => void;
  onNext: (data: ProjectDescriptionData) => void;
}

const ProjectDescriptionScreen: React.FC<ProjectDescriptionScreenProps> = ({ onBack, onNext }) => {
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  const handleNext = () => {
    if (projectName && customerName && siteAddress) {
      onNext({
        projectName,
        customerName,
        siteAddress
      });
    }
  };

  const isFormValid = projectName.trim() !== '' && customerName.trim() !== '' && siteAddress.trim() !== '';

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>Projects</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Project-description</span>
          </div>

          <div className="flex items-start gap-4">
            {/* Progress Circle */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke="#1F2937"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="138"
                  strokeDashoffset="103.5" // 25% progress (1/4)
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600">
                1 of 4
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Project description</h1>
              <p className="text-gray-500 text-sm">Fill in all the necessary details to get started with your estimation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Name */}
            <Input
              id="projectName"
              label="Project name"
              placeholder="Enter Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-white border-gray-200"
            />

            {/* Customer's Name */}
            <Input
              id="customerName"
              label="Customer's name"
              placeholder="Clientname"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-white border-gray-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Site Address */}
            <Input
              id="siteAddress"
              label="Site address"
              placeholder="Site address"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="bg-white border-gray-200"
            />
            {/* Empty column to match design */}
            <div className="hidden md:block"></div>
          </div>

          {/* Next Button */}
          <div className="pt-8">
            <button
              onClick={handleNext}
              disabled={!isFormValid}
              className={`w-full py-4 font-semibold rounded-lg transition-colors ${isFormValid
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDescriptionScreen;
