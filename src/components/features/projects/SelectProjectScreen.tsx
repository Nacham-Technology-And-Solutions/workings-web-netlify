import React, { useState } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';

interface SelectProjectData {
  windows: string[];
  doors: string[];
  skylights: string[];
  glassPanels: string[];
}

interface SelectProjectScreenProps {
  onBack: () => void;
  onNext: (data: SelectProjectData) => void;
  previousData?: any;
}

interface GlazingOption {
  value: string;
  label: string;
}

interface GlazingCategory {
  id: keyof SelectProjectData;
  name: string;
  options: GlazingOption[];
}

const SelectProjectScreen: React.FC<SelectProjectScreenProps> = ({ onBack, onNext, previousData }) => {
  const [selectedValues, setSelectedValues] = useState<SelectProjectData>({
    windows: [],
    doors: [],
    skylights: [],
    glassPanels: [],
  });

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    windows: false,
    doors: false,
    skylights: false,
    glassPanels: false,
  });

  const glazingCategories: GlazingCategory[] = [
    {
      id: 'windows',
      name: 'Window',
      options: [
        { value: 'single-pane', label: 'Single Pane' },
        { value: 'double-pane', label: 'Double Pane' },
        { value: 'triple-pane', label: 'Triple Pane' },
        { value: 'tempered', label: 'Tempered Glass' },
        { value: 'laminated', label: 'Laminated Glass' },
      ],
    },
    {
      id: 'doors',
      name: 'Door',
      options: [
        { value: 'sliding-door', label: 'Sliding Door' },
        { value: 'french-door', label: 'French Door' },
        { value: 'patio-door', label: 'Patio Door' },
        { value: 'security-door', label: 'Security Door' },
        { value: 'entrance-door', label: 'Entrance Door' },
      ],
    },
    {
      id: 'skylights',
      name: 'Net',
      options: [
        { value: 'fixed-skylight', label: 'Fixed Net' },
        { value: 'vented-skylight', label: 'Vented Net' },
      ],
    },
    {
      id: 'glassPanels',
      name: 'Curtain wall',
      options: [
        { value: 'structural-glass', label: 'Structural Glass' },
        { value: 'curtain-wall', label: 'Curtain Wall' },
      ],
    },
  ];

  // Added Partition category manually as it wasn't in the original interface but is in the design
  const partitionCategory = {
    id: 'partition' as any, // casting to any to bypass strict typing for now
    name: 'Partition',
    options: [
      { value: 'glass-partition', label: 'Glass Partition' },
      { value: 'office-partition', label: 'Office Partition' },
    ]
  };

  const allCategories = [...glazingCategories, partitionCategory];

  const isFormValid = (Object.values(selectedValues) as string[][]).some(arr => arr.length > 0);

  const toggleAccordion = (categoryId: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSelect = (categoryId: keyof SelectProjectData, value: string) => {
    setSelectedValues(prev => {
      const currentSelections = prev[categoryId] || [];
      const isSelected = currentSelections.includes(value);

      return {
        ...prev,
        [categoryId]: isSelected
          ? currentSelections.filter(v => v !== value)
          : [...currentSelections, value]
      };
    });
  };

  const handleNext = () => {
    if (isFormValid) {
      onNext(selectedValues);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>Projects</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Glazing-Type</span>
          </div>

          <div className="flex items-start justify-between">
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
                    strokeDashoffset="69" // 50% progress (2/4)
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600">
                  2 of 4
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Select Glazing Type</h1>
                <p className="text-gray-500 text-sm">What type of project are your measurements?</p>
              </div>
            </div>

            {/* Next Button (Top Right) */}
            <button
              onClick={handleNext}
              disabled={!isFormValid}
              className={`px-8 py-3 font-semibold rounded-lg transition-colors ${isFormValid
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Horizontal Accordions */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Selected Items as Chips */}
          {isFormValid && (
            <div className="mb-6 flex flex-wrap gap-2">
              {(Object.keys(selectedValues) as Array<keyof SelectProjectData>).map(categoryId => {
                const category = allCategories.find(cat => cat.id === categoryId);
                return selectedValues[categoryId].map(value => {
                  const option = category?.options.find(opt => opt.value === value);
                  return (
                    <div
                      key={`${categoryId}-${value}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
                    >
                      <span className="text-sm font-medium">{option?.label || value}</span>
                      <button
                        onClick={() => handleSelect(categoryId, value)}
                        className="text-teal-600 hover:text-teal-800"
                        aria-label={`Remove ${option?.label || value}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                });
              })}
            </div>
          )}

          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100">
            {allCategories.map((category, index) => {
              const isOpen = openAccordions[category.id];
              const isLast = index === allCategories.length - 1;

              return (
                <div key={category.id} className={`flex-1 relative ${!isLast ? 'border-r border-gray-200' : ''}`}>
                  <button
                    onClick={() => toggleAccordion(category.id)}
                    className="w-full flex justify-between items-center py-6 px-6 hover:bg-gray-50 transition-colors first:rounded-l-xl last:rounded-r-xl"
                  >
                    <span className="text-gray-700 font-medium text-base">{category.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Dropdown Content */}
                  {isOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 shadow-xl rounded-b-lg mt-1 min-w-[200px]">
                      <div className="py-2">
                        {category.options.map((option) => {
                          const isSelected = (selectedValues[category.id as keyof SelectProjectData] || []).includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleSelect(category.id as keyof SelectProjectData, option.value)}
                              className={`w-full text-left px-6 py-3 hover:bg-gray-50 flex items-center justify-between group`}
                            >
                              <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                {option.label}
                              </span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectProjectScreen;
