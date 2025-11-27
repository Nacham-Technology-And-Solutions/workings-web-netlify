import React, { useState } from 'react';
import ProgressIndicator from './ProgressIndicator';
import { ChevronLeftIcon } from './icons/IconComponents';

interface ProjectMeasurementScreenProps {
  onBack: () => void;
  onNext: (data: ProjectMeasurementData) => void;
  previousData?: any;
}

export interface DimensionItem {
  id: string;
  type: string;
  width: string;
  height: string;
  quantity: string;
  panel: string;
}

export interface ProjectMeasurementData {
  dimensions: DimensionItem[];
  unit: string;
}

const ProjectMeasurementScreen: React.FC<ProjectMeasurementScreenProps> = ({ onBack, onNext, previousData }) => {
  const [unit, setUnit] = useState<string>('mm');
  const [type, setType] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [panel, setPanel] = useState<string>('');
  const [dimensions, setDimensions] = useState<DimensionItem[]>([]);

  const glazingTypes = [
    'Casement (D/curve)',
    'Casement (EBM)',
    'Sliding (Normal)',
    'Sliding (EBM)',
    'Sliding (Ghana)',
    'Fixed Window',
    'Awning Window',
    'Louvre Window'
  ];

  const isFormValid = type !== '' && width !== '' && height !== '' && quantity !== '' && panel !== '';

  const handleAddDimension = () => {
    if (isFormValid) {
      const newDimension: DimensionItem = {
        id: `dim-${Date.now()}`,
        type,
        width,
        height,
        quantity,
        panel
      };
      setDimensions([...dimensions, newDimension]);
      // Clear form
      setType('');
      setWidth('');
      setHeight('');
      setQuantity('');
      setPanel('');
    }
  };

  const handleRemoveDimension = (id: string) => {
    setDimensions(dimensions.filter(dim => dim.id !== id));
  };

  const handleEditDimension = (id: string) => {
    const dimToEdit = dimensions.find(dim => dim.id === id);
    if (dimToEdit) {
      // Populate form with dimension to edit
      setType(dimToEdit.type);
      setWidth(dimToEdit.width);
      setHeight(dimToEdit.height);
      setQuantity(dimToEdit.quantity);
      setPanel(dimToEdit.panel);
      // Remove the dimension from list (will be re-added when user clicks "Add")
      handleRemoveDimension(id);
    }
  };

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
            <ProgressIndicator currentStep={3} totalSteps={4} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project description</h2>
              <p className="text-gray-600 text-sm mt-1">Fill in all the necessary details</p>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="relative bg-white border border-gray-200 rounded-lg mb-3" style={{ height: '240px' }}>
            {/* Dotted grid pattern */}
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                backgroundImage: 'radial-gradient(circle, #D1D5DB 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Visual Representation - Updates in Real-Time */}
            {(() => {
              // Only show canvas if type is selected AND at least one dimension field has valid data
              const hasType = type !== '';
              const hasWidth = width !== '' && !isNaN(Number(width)) && Number(width) > 0;
              const hasHeight = height !== '' && !isNaN(Number(height)) && Number(height) > 0;
              const hasPanel = panel !== '' && !isNaN(Number(panel)) && Number(panel) > 0;
              const panelCount = hasPanel ? parseInt(panel) : 1;
              
              // Show canvas only if type AND (width OR height OR panel) are valid
              if (hasType && (hasWidth || hasHeight || hasPanel)) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative">
                      {/* Main frame/window representation */}
                      <div className="relative" style={{ width: '160px', height: '160px' }}>
                        {/* Window/Door Frame */}
                        <div className="absolute inset-0 border-4 border-gray-700 bg-blue-50 rounded-sm">
                          {/* Panel dividers - only show if panel count is valid and > 1 */}
                          {hasPanel && panelCount > 1 && (
                            <>
                              {Array.from({ length: panelCount - 1 }).map((_, index) => (
                                <div
                                  key={index}
                                  className="absolute top-0 bottom-0 w-1 bg-gray-700"
                                  style={{
                                    left: `${((index + 1) * 100) / panelCount}%`,
                                    transform: 'translateX(-50%)'
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </div>

                        {/* Width dimension line - Only show if width is valid */}
                        {hasWidth && (
                          <div className="absolute -top-8 left-0 right-0 flex flex-col items-center">
                            <div className="flex items-center w-full relative">
                              <div className="flex-1 border-t-2 border-gray-600"></div>
                              <div className="absolute left-0 top-0 w-0.5 h-3 bg-gray-600"></div>
                              <div className="absolute right-0 top-0 w-0.5 h-3 bg-gray-600"></div>
                            </div>
                            <div className="text-xs font-semibold text-gray-700 mt-1 bg-white px-1">
                              {width} {unit}
                            </div>
                          </div>
                        )}

                        {/* Height dimension line - Only show if height is valid */}
                        {hasHeight && (
                          <div className="absolute -right-12 top-0 bottom-0 flex flex-row items-center">
                            <div className="flex flex-col items-center h-full relative">
                              <div className="flex-1 border-l-2 border-gray-600"></div>
                              <div className="absolute top-0 left-0 h-0.5 w-3 bg-gray-600"></div>
                              <div className="absolute bottom-0 left-0 h-0.5 w-3 bg-gray-600"></div>
                            </div>
                            <div className="text-xs font-semibold text-gray-700 ml-2 bg-white px-1 transform rotate-90 origin-center whitespace-nowrap">
                              {height} {unit}
                            </div>
                          </div>
                        )}

                        {/* Panel count label - Only show if panel is valid */}
                        {hasPanel && (
                          <div className="absolute -bottom-8 left-0 right-0 text-center">
                            <div className="text-sm font-semibold text-gray-700">
                              {panelCount} Panel{panelCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Show tooltip when no valid data
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg relative">
                      <span className="text-sm font-medium">Enter measurements below</span>
                      {/* Arrow pointing down */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>

          {/* Unit selector - Below Canvas */}
          <div className="mb-6 flex justify-end">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>

          {/* Input Fields - Compact Layout */}
          <div className="space-y-4 mb-6">
            {/* Type - Full Width */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-900 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px', paddingRight: '40px' }}
              >
                <option value="">Select a glazing type</option>
                {glazingTypes.map((glazingType) => (
                  <option key={glazingType} value={glazingType}>{glazingType}</option>
                ))}
              </select>
            </div>

            {/* Width and Height - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Width */}
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                  Width
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  id="width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Eg-; 120mm"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Height */}
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                  Height
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Eg-; 120mm"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Quantity and Panel - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
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
                  placeholder="Eg-; 3"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Panel */}
              <div>
                <label htmlFor="panel" className="block text-sm font-medium text-gray-900 mb-2">
                  Panel
                </label>
                <input
                  type="text"
                  id="panel"
                  value={panel}
                  onChange={(e) => setPanel(e.target.value)}
                  placeholder="Eg-; 3"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Add a dimension Button */}
          <div className="mb-6">
            <button
              onClick={handleAddDimension}
              disabled={!isFormValid}
              className={`w-full py-4 rounded-lg font-semibold transition-colors flex items-center justify-between px-6 ${
                isFormValid
                  ? 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent'
              }`}
            >
              <span>Add a dimension</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isFormValid ? 'bg-gray-800 text-white' : 'bg-gray-400 text-white'
              }`}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4"></path>
                </svg>
              </div>
            </button>
          </div>

          {/* Preview Section - Table Format */}
          {dimensions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Preview</h3>
              <div className="bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-0 text-left font-medium text-gray-700 text-sm">S/N</th>
                      <th className="py-3 px-3 text-left font-medium text-gray-700 text-sm">Dimension(s)</th>
                      <th className="py-3 px-3 text-left font-medium text-gray-700 text-sm">Panel(s)</th>
                      <th className="py-3 px-3 text-left font-medium text-gray-700 text-sm">Qty(s)</th>
                      <th className="py-3 px-3 text-left font-medium text-gray-700 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensions.map((dim, index) => (
                      <tr key={dim.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-4 px-0 text-gray-900 text-sm align-top">{index + 1}.</td>
                        <td className="py-4 px-3 text-gray-900 text-sm align-top">
                          <div className="leading-relaxed">
                            <div>{dim.width} x {dim.height}</div>
                            <div className="text-gray-600">({dim.type})</div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-gray-900 text-sm align-top">{dim.panel}</td>
                        <td className="py-4 px-3 text-gray-900 text-sm align-top">{dim.quantity}</td>
                        <td className="py-4 px-3 text-gray-900 text-sm align-top">
                          <button
                            onClick={() => handleEditDimension(dim.id)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            aria-label="Edit dimension"
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
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calculate Now Button */}
          <div className="pb-6">
            <button
              onClick={handleCalculateNow}
              disabled={dimensions.length === 0}
              className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                dimensions.length > 0
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Calculate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMeasurementScreen;

