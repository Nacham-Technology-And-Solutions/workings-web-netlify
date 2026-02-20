import React, { useState } from 'react';
import Input from '@/components/common/Input';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectDescriptionData } from '@/types';

interface ProjectDescriptionScreenProps {
  onBack: () => void;
  onNext: (data: ProjectDescriptionData) => void;
  previousData?: ProjectDescriptionData;
  onNavigateToStep?: (step: string) => void;
}

const ProjectDescriptionScreen: React.FC<ProjectDescriptionScreenProps> = ({ onBack, onNext, previousData, onNavigateToStep }) => {
  const [projectName, setProjectName] = useState(previousData?.projectName || '');
  const [customerName, setCustomerName] = useState(previousData?.customerName || '');
  const [siteAddress, setSiteAddress] = useState(previousData?.siteAddress || '');
  const [description, setDescription] = useState(previousData?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (!projectName || !customerName || !siteAddress || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = onNext({
        projectName,
        customerName,
        siteAddress,
        description: description.trim() || undefined
      });
      await Promise.resolve(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = projectName.trim() !== '' && customerName.trim() !== '' && siteAddress.trim() !== '';

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          {/* Mobile only: headline row = Back + "Projects" */}
          <div className="flex md:hidden items-center gap-3 mb-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 p-1 -ml-1" aria-label="Go back">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          </div>

          <div className="hidden md:block">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-default text-gray-400">Projects</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Project Description</span>
          </div>
          </div>

          {/* Project info bar: back + progress + title + subtitle (back hidden on mobile) */}
          <div className="flex items-start gap-4">
            <button onClick={onBack} className="hidden md:block text-gray-600 hover:text-gray-900 mt-1 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
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
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">Project description</h1>
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

          {/* Description */}
          <div className="w-full">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2 font-exo">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-400/20 focus:border-gray-400 transition-all duration-300 placeholder:text-gray-500 hover:border-gray-300 font-exo resize-none"
            />
          </div>

          {/* Next Button */}
          <div className="pt-8">
            <button
              onClick={handleNext}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${isFormValid && !isSubmitting
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDescriptionScreen;
