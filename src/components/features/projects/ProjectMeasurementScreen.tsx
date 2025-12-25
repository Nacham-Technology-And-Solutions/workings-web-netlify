import React, { useState, useMemo, useEffect } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectMeasurementData, DimensionItem, SelectProjectData } from '@/types';
import { getEnabledTypesForCategory, MODULE_CONFIG } from '@/utils/moduleConfig';
import type { GlazingCategory } from '@/utils/moduleMapping';
import { getModuleFieldRequirements } from '@/utils/moduleRequirements';
import { mapGlazingTypeToModuleId } from '@/utils/moduleMapping';
import {
  CasementIllustration,
  SlidingWindowIllustration,
  NetIllustration,
  CurtainWallIllustration,
} from '@/components/features/projects/illustrations/ModuleIllustrations';

interface ProjectMeasurementScreenProps {
  onBack: () => void;
  onNext: (data: ProjectMeasurementData) => void;
  previousData?: SelectProjectData;
  onNavigateToStep?: (step: string) => void;
}

const ProjectMeasurementScreen: React.FC<ProjectMeasurementScreenProps> = ({ onBack, onNext, previousData, onNavigateToStep }) => {
  // Extract selected project data
  const selectProjectData = previousData || {
    windows: [],
    doors: [],
    skylights: [],
    glassPanels: [],
  };

  // Map SelectProjectData keys to moduleConfig category names
  const categoryMap: Record<keyof SelectProjectData, GlazingCategory> = {
    windows: 'Window',
    doors: 'Door',
    skylights: 'Net',
    glassPanels: 'Curtain Wall',
  };

  // Map to get display labels for selected items
  // Dynamically loaded from MODULE_CONFIG to match SelectProjectScreen
  const categoryLabels: Record<keyof SelectProjectData, { name: string; options: { value: string; label: string }[] }> = useMemo(() => {
    return {
      windows: {
        name: MODULE_CONFIG.Window.name,
        options: getEnabledTypesForCategory('Window').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      doors: {
        name: MODULE_CONFIG.Door.name,
        options: getEnabledTypesForCategory('Door').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      skylights: {
        name: MODULE_CONFIG.Net.name,
        options: getEnabledTypesForCategory('Net').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
      glassPanels: {
        name: MODULE_CONFIG['Curtain Wall'].name,
        options: getEnabledTypesForCategory('Curtain Wall').map(type => ({
          value: type.value,
          label: type.label,
        })),
      },
    };
  }, []);

  // Build selected items for display
  const selectedItemsForDisplay = useMemo(() => {
    const items: Array<{ category: string; label: string; value: string }> = [];
    
    (Object.keys(selectProjectData) as Array<keyof SelectProjectData>).forEach((categoryId) => {
      const categoryData = categoryLabels[categoryId];
      const selectedValues = selectProjectData[categoryId] || [];
      
      selectedValues.forEach((value) => {
        const option = categoryData.options.find(opt => opt.value === value);
        if (option) {
          items.push({
            category: categoryData.name,
            label: option.label,
            value: value,
          });
        }
      });
    });
    
    return items;
  }, [selectProjectData]);
  const [unit, setUnit] = useState<string>('mm');
  const [type, setType] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [panel, setPanel] = useState<string>('');
  const [openingPanels, setOpeningPanels] = useState<string>('');
  const [verticalPanels, setVerticalPanels] = useState<string>('');
  const [horizontalPanels, setHorizontalPanels] = useState<string>('');
  const [dimensions, setDimensions] = useState<DimensionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Get enabled categories from selected project data
  const enabledCategories = useMemo(() => {
    const categories: Array<{ key: keyof SelectProjectData; name: string; moduleCategory: 'Window' | 'Door' | 'Net' | 'Curtain Wall' }> = [];
    
    (Object.keys(selectProjectData) as Array<keyof SelectProjectData>).forEach((key) => {
      if (selectProjectData[key] && selectProjectData[key].length > 0) {
        const moduleCategory = categoryMap[key];
        const categoryData = categoryLabels[key];
        if (moduleCategory && categoryData) {
          categories.push({
            key,
            name: categoryData.name,
            moduleCategory,
          });
        }
      }
    });
    
    return categories;
  }, [selectProjectData]);

  // Get enabled glazing types from all selected categories
  const glazingTypes = useMemo(() => {
    const allTypes: Array<{ value: string; label: string; category: string }> = [];
    
    enabledCategories.forEach((cat) => {
      const enabledTypes = getEnabledTypesForCategory(cat.moduleCategory);
      enabledTypes.forEach((type) => {
        allTypes.push({
          value: type.value,
          label: type.label,
          category: cat.name,
        });
      });
    });
    
    return allTypes;
  }, [enabledCategories]);

  // Filter types by selected category
  const filteredGlazingTypes = useMemo(() => {
    if (!selectedCategory) {
      return glazingTypes;
    }
    return glazingTypes.filter(t => t.category === selectedCategory);
  }, [glazingTypes, selectedCategory]);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategory && enabledCategories.length > 0) {
      setSelectedCategory(enabledCategories[0].name);
    }
  }, [enabledCategories, selectedCategory]);

  // Get field requirements for selected type
  const fieldRequirements = useMemo(() => {
    if (!type) {
      return null;
    }
    // Find the category for the selected type
    const selectedType = glazingTypes.find(gt => gt.value === type);
    if (!selectedType) {
      return null;
    }
    const category = enabledCategories.find(cat => cat.name === selectedType.category)?.moduleCategory || 'Window';
    return getModuleFieldRequirements(type, category);
  }, [type, enabledCategories, glazingTypes]);

  // Form validation - dynamic based on module requirements
  const isFormValid = useMemo(() => {
    if (!type || !fieldRequirements) return false;
    
    let valid = type !== '' && width !== '' && height !== '' && quantity !== '';
    
    if (fieldRequirements.requiresPanel) {
      valid = valid && panel !== '';
    }
    
    if (fieldRequirements.requiresOpeningPanels) {
      valid = valid && openingPanels !== '';
      // Validate O <= N
      const n = parseFloat(panel) || 0;
      const o = parseFloat(openingPanels) || 0;
      valid = valid && o <= n && o >= 0;
    }
    
    if (fieldRequirements.requiresVerticalPanels) {
      valid = valid && verticalPanels !== '';
      const nv = parseFloat(verticalPanels) || 0;
      valid = valid && nv >= 1;
    }
    
    if (fieldRequirements.requiresHorizontalPanels) {
      valid = valid && horizontalPanels !== '';
      const nh = parseFloat(horizontalPanels) || 0;
      valid = valid && nh >= 1;
    }
    
    return valid;
  }, [type, width, height, quantity, panel, openingPanels, verticalPanels, horizontalPanels, fieldRequirements]);

  const handleEditDimension = (dimension: DimensionItem) => {
    setType(dimension.type);
    setWidth(dimension.width);
    setHeight(dimension.height);
    setQuantity(dimension.quantity);
    setPanel(dimension.panel);
    setOpeningPanels(dimension.openingPanels || '');
    setVerticalPanels(dimension.verticalPanels || '');
    setHorizontalPanels(dimension.horizontalPanels || '');
    setEditingId(dimension.id);
  };

  const handleAddDimension = () => {
    if (isFormValid) {
      const dimensionData: DimensionItem = {
        id: editingId || `dim-${Date.now()}`,
        type,
        width,
        height,
        quantity,
        panel,
        ...(openingPanels && { openingPanels }),
        ...(verticalPanels && { verticalPanels }),
        ...(horizontalPanels && { horizontalPanels }),
      };

      if (editingId) {
        // Update existing dimension
        const updatedDimensions = dimensions.map(dim =>
          dim.id === editingId ? dimensionData : dim
        );
        setDimensions(updatedDimensions);
        setEditingId(null);
      } else {
        // Add new dimension
        setDimensions([...dimensions, dimensionData]);
      }
      // Clear form
      setType('');
      setWidth('');
      setHeight('');
      setQuantity('');
      setPanel('');
      setOpeningPanels('');
      setVerticalPanels('');
      setHorizontalPanels('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setType('');
    setWidth('');
    setHeight('');
    setQuantity('');
    setPanel('');
    setOpeningPanels('');
    setVerticalPanels('');
    setHorizontalPanels('');
  };

  // Clear form when type changes
  useEffect(() => {
    if (type) {
      // Only clear dimension fields, keep type and unit
      setWidth('');
      setHeight('');
      setQuantity('');
      setPanel('');
      setOpeningPanels('');
      setVerticalPanels('');
      setHorizontalPanels('');
    }
  }, [type]);

  const handleCalculateNow = () => {
    if (dimensions.length > 0) {
      const data: ProjectMeasurementData = {
        dimensions,
        unit
      };
      onNext(data);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => onNavigateToStep?.('projects') || onBack()}>Projects</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => onNavigateToStep?.('projectDescription') || onBack()}>Project-description</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={onBack}>Glazing-Type</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Measurement</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
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
                    strokeDashoffset="34.5"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600">
                  3 of 4
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Select Glazing Type</h1>
                <p className="text-gray-500 text-sm">What type of project are your measurements?</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Selected Glazing Types Display */}
          {selectedItemsForDisplay.length > 0 && (
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Glazing Types</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedItemsForDisplay.map((item, index) => (
                    <div
                      key={`${item.category}-${item.value}-${index}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
                    >
                      <span className="text-xs font-medium text-teal-600">{item.category}:</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  // Save current dimensions to preserve them when navigating back
                  // This ensures dimensions are not lost when adding more categories/types
                  if (dimensions.length > 0) {
                    const currentMeasurementData: ProjectMeasurementData = {
                      dimensions,
                      unit
                    };
                    // Call onNext to save current state before navigating
                    // This will preserve dimensions in the parent component's state
                    onNext(currentMeasurementData);
                  }
                  // Navigate back to SelectProjectScreen
                  if (onNavigateToStep) {
                    onNavigateToStep('selectProject');
                  } else {
                    onBack();
                  }
                }}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Category/Type
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Canvas */}
            <div className="flex flex-col gap-4">
              <div className="relative bg-white border border-gray-200 rounded-lg flex-1" style={{ minHeight: '500px' }}>
                {/* Dotted grid pattern */}
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #D1D5DB 1.5px, transparent 1.5px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Visual Representation - Module-Specific */}
                {(() => {
                  const hasType = type !== '';
                  const hasWidth = width !== '' && !isNaN(Number(width)) && Number(width) > 0;
                  const hasHeight = height !== '' && !isNaN(Number(height)) && Number(height) > 0;
                  
                  if (!hasType || (!hasWidth && !hasHeight)) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg relative">
                          <span className="text-sm font-medium">Enter measurements below</span>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                        </div>
                      </div>
                    );
                  }

                  // Get module ID to determine which illustration to use
                  const selectedType = glazingTypes.find(gt => gt.value === type);
                  const category = selectedType 
                    ? enabledCategories.find(cat => cat.name === selectedType.category)?.moduleCategory || 'Window'
                    : 'Window';
                  const moduleId = mapGlazingTypeToModuleId(type, category);

                  // Calculate frame dimensions
                  const maxFrameSize = 350;
                  const labelPadding = 70;
                  let frameWidth = maxFrameSize;
                  let frameHeight = maxFrameSize;

                  if (hasWidth && hasHeight) {
                    const aspectRatio = Number(width) / Number(height);
                    if (aspectRatio >= 1) {
                      frameWidth = maxFrameSize;
                      frameHeight = frameWidth / aspectRatio;
                    } else {
                      frameHeight = maxFrameSize;
                      frameWidth = frameHeight * aspectRatio;
                    }
                  } else if (hasWidth) {
                    frameWidth = maxFrameSize;
                    frameHeight = frameWidth;
                  } else if (hasHeight) {
                    frameHeight = maxFrameSize;
                    frameWidth = frameHeight;
                  }

                  // Render module-specific illustration
                  if (moduleId === 'M1_Casement_DCurve') {
                    const panelCount = panel !== '' && !isNaN(Number(panel)) ? parseInt(panel) : 1;
                    const openingPanelsCount = openingPanels !== '' && !isNaN(Number(openingPanels)) ? parseInt(openingPanels) : panelCount;
                    return (
                      <CasementIllustration
                        width={Number(width)}
                        height={Number(height)}
                        unit={unit}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        labelPadding={labelPadding}
                        panelCount={panelCount}
                        openingPanels={openingPanelsCount}
                      />
                    );
                  }

                  if (moduleId === 'M2_Sliding_2Sash' || moduleId === 'M3_Sliding_2Sash_Net' || moduleId === 'M4_Sliding_3Track' || moduleId === 'M5_Sliding_3Sash') {
                    const sashCount = moduleId === 'M4_Sliding_3Track' || moduleId === 'M5_Sliding_3Sash' ? 3 : 2;
                    return (
                      <SlidingWindowIllustration
                        width={Number(width)}
                        height={Number(height)}
                        unit={unit}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        labelPadding={labelPadding}
                        sashCount={sashCount as 2 | 3}
                      />
                    );
                  }

                  if (moduleId === 'M6_Net_1125_26' || moduleId === 'M7_EBM_Net_1125_26' || moduleId === 'M8_EBM_Net_UChannel') {
                    return (
                      <NetIllustration
                        width={Number(width)}
                        height={Number(height)}
                        unit={unit}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        labelPadding={labelPadding}
                      />
                    );
                  }

                  if (moduleId === 'M9_Curtain_Wall_Grid') {
                    const nv = verticalPanels !== '' && !isNaN(Number(verticalPanels)) ? parseInt(verticalPanels) : 1;
                    const nh = horizontalPanels !== '' && !isNaN(Number(horizontalPanels)) ? parseInt(horizontalPanels) : 1;
                    return (
                      <CurtainWallIllustration
                        width={Number(width)}
                        height={Number(height)}
                        unit={unit}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        labelPadding={labelPadding}
                        verticalPanels={nv}
                        horizontalPanels={nh}
                      />
                    );
                  }

                  // Default fallback illustration
                  return (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg relative">
                        <span className="text-sm font-medium">Enter measurements below</span>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Calculate Now Button - Below Canvas */}
              <button
                onClick={handleCalculateNow}
                disabled={dimensions.length === 0}
                className={`w-full py-4 font-semibold rounded-lg transition-colors ${dimensions.length > 0
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Calculate Now
              </button>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Unit Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="m">m</option>
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                    <option value="in">in</option>
                  </select>
                </div>

                <div className="h-px bg-gray-200 mb-6"></div>

                {/* Category Dropdown - Only show if multiple categories */}
                {enabledCategories.length > 1 && (
                  <div className="mb-6">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setType(''); // Clear type when category changes
                      }}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {enabledCategories.map((cat) => (
                        <option key={cat.key} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Type Dropdown */}
                <div className="mb-6">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={filteredGlazingTypes.length === 0}
                  >
                    <option value="">Select type</option>
                    {filteredGlazingTypes.map((glazingType) => (
                      <option key={glazingType.value} value={glazingType.value}>{glazingType.label}</option>
                    ))}
                  </select>
                </div>

                {/* Width and Height - Dynamic labels based on module */}
                {fieldRequirements && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="width" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                        {fieldRequirements.widthLabel}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {fieldRequirements.requiresInsideToInside && (
                          <span className="text-xs text-gray-500 font-normal">(inside-to-inside)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        id="width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder={`Eg: 120${unit}`}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="height" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                        {fieldRequirements.heightLabel}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {fieldRequirements.requiresInsideToInside && (
                          <span className="text-xs text-gray-500 font-normal">(inside-to-inside)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        id="height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder={`Eg: 120${unit}`}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                    <label htmlFor="quantity" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                    Quantity
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </label>
                  <input
                    type="text"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Eg: 3"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                {/* Dynamic Panel Fields based on module requirements */}
                {fieldRequirements && (
                  <>
                    {/* M1: Panels (N) and Opening Panels (O) */}
                    {fieldRequirements.requiresPanel && !fieldRequirements.requiresVerticalPanels && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="panel" className="block text-sm font-medium text-gray-700 mb-2">
                            {fieldRequirements.panelLabel}
                          </label>
                          <input
                            type="text"
                            id="panel"
                            value={panel}
                            onChange={(e) => setPanel(e.target.value)}
                            placeholder="Eg: 3"
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          />
                        </div>
                        {fieldRequirements.requiresOpeningPanels && (
                          <div>
                            <label htmlFor="openingPanels" className="block text-sm font-medium text-gray-700 mb-2">
                              Opening Panels (O)
                              <span className="text-xs text-gray-500 font-normal ml-1">(≤ {panel || 'N'})</span>
                            </label>
                            <input
                              type="text"
                              id="openingPanels"
                              value={openingPanels}
                              onChange={(e) => setOpeningPanels(e.target.value)}
                              placeholder="Eg: 1"
                              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* M9: Vertical and Horizontal Panels */}
                    {fieldRequirements.requiresVerticalPanels && fieldRequirements.requiresHorizontalPanels && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="verticalPanels" className="block text-sm font-medium text-gray-700 mb-2">
                            Vertical Panels (N_v)
                          </label>
                          <input
                            type="text"
                            id="verticalPanels"
                            value={verticalPanels}
                            onChange={(e) => setVerticalPanels(e.target.value)}
                            placeholder="Eg: 3"
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <label htmlFor="horizontalPanels" className="block text-sm font-medium text-gray-700 mb-2">
                            Horizontal Panels (N_h)
                          </label>
                          <input
                            type="text"
                            id="horizontalPanels"
                            value={horizontalPanels}
                            onChange={(e) => setHorizontalPanels(e.target.value)}
                            placeholder="Eg: 2"
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Add/Update Dimension Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDimension}
                    disabled={!isFormValid}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isFormValid
                      ? 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                      }`}
                  >
                    <span>{editingId ? 'Update dimension' : 'Add a dimension'}</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M5 13l4 4L19 7" : "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </button>
                  {editingId && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              {dimensions.length > 0 && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Preview</h3>
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="py-2 px-3 text-left font-medium text-gray-700 text-xs">S/N</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-700 text-xs">Dimension</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-700 text-xs">Panel</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-700 text-xs">Qty</th>
                          <th className="py-2 px-3 text-center font-medium text-gray-700 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dimensions.map((dim, index) => {
                          // Determine category for this dimension type
                          const dimensionCategory = glazingTypes.find(t => t.value === dim.type)?.category || 'Unknown';
                          return (
                          <tr key={dim.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-3 px-3 text-gray-900 text-xs">{index + 1}.</td>
                            <td className="py-3 px-3 text-gray-900 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                                  {dimensionCategory}
                                </span>
                              </div>
                              <div className="font-medium">{dim.width} x {dim.height}</div>
                              <div className="text-gray-500 text-[10px] mt-0.5">({dim.type})</div>
                            </td>
                            <td className="py-3 px-3 text-gray-900 text-xs">{dim.panel}</td>
                            <td className="py-3 px-3 text-gray-900 text-xs">{dim.quantity}</td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleEditDimension(dim)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                aria-label="Edit dimension"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectMeasurementScreen;
