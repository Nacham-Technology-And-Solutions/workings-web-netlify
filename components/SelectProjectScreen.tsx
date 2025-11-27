import React, { useState } from 'react';
import ProgressIndicator from './ProgressIndicator';
import { ChevronLeftIcon } from './icons/IconComponents';

interface SelectProjectScreenProps {
  onBack: () => void;
  onNext: (data: SelectProjectData) => void;
  previousData?: any;
}

export interface SelectProjectData {
  windows: string[];
  doors: string[];
  skylights: string[];
  glassPanels: string[];
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
      name: 'Windows',
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
      name: 'Doors',
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
      name: 'Skylights',
      options: [
        { value: 'fixed-skylight', label: 'Fixed Skylight' },
        { value: 'vented-skylight', label: 'Vented Skylight' },
        { value: 'tubular-skylight', label: 'Tubular Skylight' },
        { value: 'flat-skylight', label: 'Flat Skylight' },
      ],
    },
    {
      id: 'glassPanels',
      name: 'Glass Panels',
      options: [
        { value: 'structural-glass', label: 'Structural Glass' },
        { value: 'curtain-wall', label: 'Curtain Wall' },
        { value: 'glass-partition', label: 'Glass Partition' },
        { value: 'glass-balustrade', label: 'Glass Balustrade' },
      ],
    },
  ];

  const isFormValid = Object.values(selectedValues).some(arr => arr.length > 0);
  const hasAnySelection = Object.values(selectedValues).some(arr => arr.length > 0);

  const toggleAccordion = (categoryId: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSelect = (categoryId: keyof SelectProjectData, value: string) => {
    setSelectedValues(prev => {
      const currentSelections = prev[categoryId];
      const isSelected = currentSelections.includes(value);

      return {
        ...prev,
        [categoryId]: isSelected
          ? currentSelections.filter(v => v !== value)
          : [...currentSelections, value]
      };
    });
  };

  const handleRemoveSelection = (categoryId: keyof SelectProjectData, value: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(v => v !== value)
    }));
  };

  const getLabelForValue = (categoryId: keyof SelectProjectData, value: string): string => {
    const category = glazingCategories.find(cat => cat.id === categoryId);
    const option = category?.options.find(opt => opt.value === value);
    return option?.label || value;
  };

  const getAllSelectedItems = () => {
    const items: Array<{ categoryId: keyof SelectProjectData; value: string; label: string }> = [];
    (Object.keys(selectedValues) as Array<keyof SelectProjectData>).forEach(categoryId => {
      selectedValues[categoryId].forEach(value => {
        items.push({
          categoryId,
          value,
          label: getLabelForValue(categoryId, value)
        });
      });
    });
    return items;
  };

  const handleNext = () => {
    if (isFormValid) {
      onNext(selectedValues);
    }
  };

  const handleReset = () => {
    setSelectedValues({
      windows: [],
      doors: [],
      skylights: [],
      glassPanels: [],
    });
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
          <div className="mb-6 flex items-center gap-4">
            <ProgressIndicator currentStep={2} totalSteps={4} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Project</h2>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-600 mb-4">What type of project are your measurements?</p>

          {/* Selected Items as Chips */}
          {hasAnySelection && (
            <div className="mb-6 flex flex-wrap gap-2">
              {getAllSelectedItems().map((item, index) => (
                <div
                  key={`${item.categoryId}-${item.value}-${index}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full"
                >
                  <span className="text-gray-900 text-sm">{item.label}</span>
                  <button
                    onClick={() => handleRemoveSelection(item.categoryId, item.value)}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label={`Remove ${item.label}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Accordion List */}
          <div className="bg-white">
            {glazingCategories.map((category, index) => {
              const isOpen = openAccordions[category.id];

              return (
                <div key={category.id}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleAccordion(category.id)}
                    className="w-full flex justify-between items-center py-4 px-0 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-900 font-normal">{category.name}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="pb-4 pt-2">
                      <div className="grid grid-cols-1 gap-2">
                        {category.options.map((option) => {
                          const isSelected = selectedValues[category.id].includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleSelect(category.id, option.value)}
                              className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${isSelected
                                  ? 'bg-gray-100 border-gray-200'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                              <span className="text-gray-900">{option.label}</span>
                              {isSelected && (
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Separator line - except for last item */}
                  {index < glazingCategories.length - 1 && (
                    <div className="border-b border-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with Next and Reset Buttons */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReset}
            disabled={!hasAnySelection}
            className={`w-full py-4 rounded-lg font-semibold transition-colors ${hasAnySelection
                ? 'bg-white text-gray-800 border-2 border-gray-400 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent'
              }`}
          >
            Reset
          </button>
          <button
            onClick={handleNext}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-lg font-semibold transition-colors ${isFormValid
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectProjectScreen;
