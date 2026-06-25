import React, { useState, useMemo } from 'react';
import type { SelectProjectData, GlazingCategoryKey, ProjectCalculationSettings } from '@/types';
import { defaultProjectCalculationSettings } from '@/types';
import { isCategoryEnabled, getEnabledTypesForCategory, MODULE_CONFIG } from '@/utils/moduleConfig';
import type { GlazingCategory as ModuleGlazingCategory } from '@/utils/moduleMapping';
import { migrateSelectProjectWindows } from '@/utils/slidingWindow';

interface SelectProjectScreenProps {
  onBack: () => void;
  onNext: (data: SelectProjectData) => void;
  previousData?: SelectProjectData;
}

interface GlazingOption {
  value: string;
  label: string;
}

interface ProjectGlazingCategory {
  id: GlazingCategoryKey;
  name: string;
  options: GlazingOption[];
}

const MEASUREMENT_UNITS = ['m', 'mm', 'cm', 'ft', 'in'] as const;

function pickGlazingSelections(data?: SelectProjectData): Pick<SelectProjectData, GlazingCategoryKey> {
  return {
    windows: migrateSelectProjectWindows(Array.isArray(data?.windows) ? data.windows : []),
    doors: Array.isArray(data?.doors) ? data.doors : [],
    skylights: Array.isArray(data?.skylights) ? data.skylights : [],
    glassPanels: Array.isArray(data?.glassPanels) ? data.glassPanels : [],
  };
}

const SelectProjectScreen: React.FC<SelectProjectScreenProps> = ({ onBack, onNext, previousData }) => {
  const [selectedValues, setSelectedValues] = useState<Pick<SelectProjectData, GlazingCategoryKey>>(() =>
    pickGlazingSelections(previousData)
  );
  const [unit, setUnit] = useState<string>(previousData?.unit ?? 'mm');
  const [calculationSettings, setCalculationSettings] = useState<ProjectCalculationSettings>(
    () => previousData?.calculationSettings ?? defaultProjectCalculationSettings()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const categoryMap: Record<GlazingCategoryKey, ModuleGlazingCategory> = {
    windows: 'Window',
    doors: 'Door',
    skylights: 'Net',
    glassPanels: 'Curtain Wall',
  };

  const allCategories = useMemo(() => {
    const allPossibleCategories: ProjectGlazingCategory[] = [
      {
        id: 'windows',
        name: 'Window',
        options: getEnabledTypesForCategory('Window').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      {
        id: 'doors',
        name: 'Door',
        options: getEnabledTypesForCategory('Door').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      {
        id: 'skylights',
        name: 'Net',
        options: getEnabledTypesForCategory('Net').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      {
        id: 'glassPanels',
        name: MODULE_CONFIG['Curtain Wall'].name,
        options: getEnabledTypesForCategory('Curtain Wall').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
    ];

    return allPossibleCategories.filter((category) => {
      const moduleCategory = categoryMap[category.id];
      return moduleCategory ? isCategoryEnabled(moduleCategory) : false;
    });
  }, []);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allCategories.forEach((cat) => {
      initial[cat.id] = false;
    });
    return initial;
  });

  const isFormValid = (Object.values(selectedValues) as string[][]).some(arr => arr.length > 0);

  const toggleAccordion = (categoryId: string) => {
    setOpenAccordions(prev => {
      const isCurrentlyOpen = prev[categoryId];
      if (isCurrentlyOpen) {
        return {
          ...prev,
          [categoryId]: false
        };
      } else {
        const closed = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {} as Record<string, boolean>);
        return {
          ...closed,
          [categoryId]: true
        };
      }
    });
  };

  const handleSelect = (categoryId: GlazingCategoryKey, value: string) => {
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

  const updateCalculationSetting = <K extends keyof ProjectCalculationSettings>(
    key: K,
    value: ProjectCalculationSettings[K]
  ) => {
    setCalculationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (isFormValid) {
      onNext({
        ...selectedValues,
        unit,
        calculationSettings,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
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
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={onBack}>Project Description</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Glazing Category</span>
          </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="hidden md:block text-gray-600 hover:text-gray-900 mt-1 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
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
                    strokeDashoffset="69"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600">
                  2 of 4
                </div>
              </div>

              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">Select Glazing Category</h1>
                <p className="text-gray-500 text-sm">What type of project are your measurements?</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!isFormValid}
              className={`hidden md:inline-flex px-8 py-3 font-semibold rounded-lg transition-colors ${isFormValid
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {isFormValid && (
            <div className="mb-6 flex flex-wrap gap-2">
              {allCategories.map(category => {
                const categoryValues = selectedValues[category.id] || [];
                return categoryValues.map(value => {
                  const option = category.options.find(opt => opt.value === value);
                  return (
                    <div
                      key={`${category.id}-${value}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
                    >
                      <span className="text-sm font-medium">{option?.label || value}</span>
                      <button
                        onClick={() => handleSelect(category.id, value)}
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

          <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {allCategories.map((category, index) => {
              const isOpen = openAccordions[category.id];
              const isLast = index === allCategories.length - 1;

              return (
                <div key={category.id} className={`flex-1 flex flex-col min-w-0 ${!isLast ? 'border-b md:border-b-0 md:border-r border-gray-200' : ''}`}>
                  <button
                    onClick={() => toggleAccordion(category.id)}
                    className="w-full flex justify-between items-center py-6 px-6 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl md:first:rounded-t-none md:first:rounded-l-xl md:last:rounded-r-xl md:last:rounded-b-none flex-shrink-0"
                  >
                    <span className="text-gray-700 font-medium text-base">{category.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
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

                  {isOpen && (
                    <div className="flex-1 min-h-0 border-t border-gray-200 bg-gray-50/50 overflow-y-auto">
                      <div className="py-2">
                        {category.options.map((option) => {
                          const isSelected = (selectedValues[category.id] || []).includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleSelect(category.id, option.value)}
                              className="w-full text-left px-6 py-3 hover:bg-gray-50 flex items-center justify-between group"
                            >
                              <span className={`text-sm truncate ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                {option.label}
                              </span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-gray-900 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setSettingsOpen(prev => !prev)}
              className="w-full flex justify-between items-center py-5 px-6 hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-700 font-medium text-base">Calculation Settings</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${settingsOpen ? 'rotate-180' : ''}`}
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

            {settingsOpen && (
              <div className="border-t border-gray-200 px-6 py-5 space-y-5 bg-gray-50/50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock length</label>
                  <div className="flex flex-wrap gap-3">
                    {([6, 5.85] as const).map((value) => (
                      <label
                        key={value}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                          calculationSettings.stockLength === value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="stockLength"
                          value={value}
                          checked={calculationSettings.stockLength === value}
                          onChange={() => updateCalculationSetting('stockLength', value)}
                          className="sr-only"
                        />
                        {value === 6 ? '6 m' : '5.85 m'}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="bladeKerf" className="block text-sm font-medium text-gray-700 mb-2">
                    Blade kerf (mm)
                  </label>
                  <input
                    id="bladeKerf"
                    type="number"
                    min={1}
                    step={1}
                    value={calculationSettings.bladeKerf}
                    onChange={(e) => updateCalculationSetting('bladeKerf', Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full max-w-xs px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="wasteThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Waste threshold (mm)
                  </label>
                  <input
                    id="wasteThreshold"
                    type="number"
                    min={1}
                    step={1}
                    value={calculationSettings.wasteThreshold}
                    onChange={(e) => updateCalculationSetting('wasteThreshold', Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full max-w-xs px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Measurement unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full max-w-xs px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    {MEASUREMENT_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="md:hidden flex-shrink-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`w-full py-3.5 font-semibold rounded-lg transition-colors ${isFormValid
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SelectProjectScreen;
