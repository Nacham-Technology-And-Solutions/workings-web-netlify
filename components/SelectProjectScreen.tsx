import React, { useState } from 'react';
import ProgressIndicator from './ProgressIndicator';
import AccordionItem from './AccordionItem';
import { ChevronLeftIcon } from './icons/IconComponents';

interface SelectProjectScreenProps {
  onBack: () => void;
  onNext: (data: SelectProjectData) => void;
  previousData?: any;
}

export interface SelectProjectData {
  windows: string;
  doors: string;
  skylights: string;
  glassPanels: string;
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
    windows: '',
    doors: '',
    skylights: '',
    glassPanels: '',
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

  const toggleAccordion = (categoryId: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSelect = (categoryId: keyof SelectProjectData, value: string) => {
    setSelectedValues(prev => ({ ...prev, [categoryId]: value }));
  };

  const isFormValid = Object.values(selectedValues).some(value => value !== '');
  const hasAnySelection = Object.values(selectedValues).some(value => value !== '');

  const handleNext = () => {
    if (isFormValid) {
      onNext(selectedValues);
    }
  };

  const handleReset = () => {
    setSelectedValues({
      windows: '',
      doors: '',
      skylights: '',
      glassPanels: '',
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
          <div className="mb-8 flex items-center gap-4">
            <ProgressIndicator currentStep={2} totalSteps={4} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Project</h2>
            </div>
          </div>

          {/* Accordion Categories */}
          <div className="space-y-4">
            {glazingCategories.map((category) => {
              const isOpen = openAccordions[category.id];
              const isCompleted = false;
              
              return (
                <AccordionItem
                  key={category.id}
                  title={category.name}
                  isOpen={isOpen}
                  onToggle={() => toggleAccordion(category.id)}
                  isCompleted={isCompleted}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(category.id, option.value)}
                        className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-900 transition-all"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AccordionItem>
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
            className={`w-full py-4 rounded-lg font-semibold transition-colors ${
              hasAnySelection
                ? 'bg-white text-gray-800 border-2 border-gray-400 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent'
            }`}
          >
            Reset
          </button>
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
    </div>
  );
};

export default SelectProjectScreen;
