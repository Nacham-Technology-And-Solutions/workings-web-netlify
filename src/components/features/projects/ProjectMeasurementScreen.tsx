import React, { useState } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectMeasurementData, DimensionItem } from '@/types';

interface ProjectMeasurementScreenProps {
  onBack: () => void;
  onNext: (data: ProjectMeasurementData) => void;
  previousData?: any;
}

const ProjectMeasurementScreen: React.FC<ProjectMeasurementScreenProps> = ({ onBack, onNext, previousData }) => {
  const [unit, setUnit] = useState<string>('mm');
  const [type, setType] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [panel, setPanel] = useState<string>('');
  const [dimensions, setDimensions] = useState<DimensionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleEditDimension = (dimension: DimensionItem) => {
    setType(dimension.type);
    setWidth(dimension.width);
    setHeight(dimension.height);
    setQuantity(dimension.quantity);
    setPanel(dimension.panel);
    setEditingId(dimension.id);
  };

  const handleAddDimension = () => {
    if (isFormValid) {
      if (editingId) {
        // Update existing dimension
        const updatedDimensions = dimensions.map(dim =>
          dim.id === editingId
            ? { id: editingId, type, width, height, quantity, panel }
            : dim
        );
        setDimensions(updatedDimensions);
        setEditingId(null);
      } else {
        // Add new dimension
        const newDimension: DimensionItem = {
          id: `dim-${Date.now()}`,
          type,
          width,
          height,
          quantity,
          panel
        };
        setDimensions([...dimensions, newDimension]);
      }
      // Clear form
      setType('');
      setWidth('');
      setHeight('');
      setQuantity('');
      setPanel('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setType('');
    setWidth('');
    setHeight('');
    setQuantity('');
    setPanel('');
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
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
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

                {/* Visual Representation */}
                {(() => {
                  const hasType = type !== '';
                  const hasWidth = width !== '' && !isNaN(Number(width)) && Number(width) > 0;
                  const hasHeight = height !== '' && !isNaN(Number(height)) && Number(height) > 0;
                  const hasPanel = panel !== '' && !isNaN(Number(panel)) && Number(panel) > 0;
                  const panelCount = hasPanel ? parseInt(panel) : 1;

                  // Calculate canvas dimensions proportionally
                  const maxCanvasSize = 400; // Maximum canvas size
                  const minCanvasSize = 200; // Minimum canvas size
                  let canvasWidth = 280; // Default width
                  let canvasHeight = 280; // Default height

                  if (hasWidth && hasHeight) {
                    const widthValue = Number(width);
                    const heightValue = Number(height);
                    const aspectRatio = widthValue / heightValue;
                    
                    // Calculate dimensions maintaining aspect ratio
                    if (aspectRatio >= 1) {
                      // Width is larger or equal
                      canvasWidth = Math.min(maxCanvasSize, Math.max(minCanvasSize, maxCanvasSize));
                      canvasHeight = canvasWidth / aspectRatio;
                      if (canvasHeight < minCanvasSize) {
                        canvasHeight = minCanvasSize;
                        canvasWidth = canvasHeight * aspectRatio;
                      }
                    } else {
                      // Height is larger
                      canvasHeight = Math.min(maxCanvasSize, Math.max(minCanvasSize, maxCanvasSize));
                      canvasWidth = canvasHeight * aspectRatio;
                      if (canvasWidth < minCanvasSize) {
                        canvasWidth = minCanvasSize;
                        canvasHeight = canvasWidth / aspectRatio;
                      }
                    }
                  } else if (hasWidth) {
                    canvasWidth = Math.min(maxCanvasSize, Math.max(minCanvasSize, 280));
                    canvasHeight = canvasWidth;
                  } else if (hasHeight) {
                    canvasHeight = Math.min(maxCanvasSize, Math.max(minCanvasSize, 280));
                    canvasWidth = canvasHeight;
                  }

                  if (hasType && (hasWidth || hasHeight || hasPanel)) {
                    // Frame dimensions - scale to fit but maintain proportions
                    const maxFrameSize = 350;
                    let frameWidth = Math.min(canvasWidth, maxFrameSize);
                    let frameHeight = Math.min(canvasHeight, maxFrameSize);
                    
                    // Maintain aspect ratio if both dimensions provided
                    if (hasWidth && hasHeight) {
                      const aspectRatio = Number(width) / Number(height);
                      if (frameWidth / frameHeight > aspectRatio) {
                        frameWidth = frameHeight * aspectRatio;
                      } else {
                        frameHeight = frameWidth / aspectRatio;
                      }
                    }
                    
                    // Space for labels outside frame
                    const labelPadding = 70;
                    const totalWidth = frameWidth + labelPadding;
                    const totalHeight = frameHeight + labelPadding * 2;
                    
                    return (
                      <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
                        <div className="relative" style={{ 
                          width: `${totalWidth}px`, 
                          height: `${totalHeight}px`,
                          maxWidth: 'calc(100% - 96px)', 
                          maxHeight: 'calc(100% - 96px)' 
                        }}>
                          {/* Frame container - positioned with space for labels */}
                          <div className="absolute" style={{ 
                            top: `${labelPadding}px`, 
                            left: '0px',
                            width: `${frameWidth}px`, 
                            height: `${frameHeight}px` 
                          }}>
                            {/* Outer Frame (Dark Gray) */}
                            <div className="absolute inset-0 bg-gray-700 rounded-sm shadow-xl">
                              {/* Inner Frame (Medium Gray) */}
                              <div className="absolute inset-3 bg-gray-600">
                                {/* Glass Area Container */}
                                <div className="absolute inset-2 bg-white flex">
                                  {/* Panel dividers */}
                                  {hasPanel && panelCount > 1 && (
                                    <>
                                      {Array.from({ length: panelCount }).map((_, index) => (
                                        <div key={index} className="flex-1 relative">
                                          {/* Glass panel with light blue tint */}
                                          <div className="absolute inset-1 bg-blue-50 border border-gray-400"></div>
                                          {/* Vertical divider between panels */}
                                          {index < panelCount - 1 && (
                                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gray-600"></div>
                                          )}
                                        </div>
                                      ))}
                                    </>
                                  )}
                                  {/* Single panel if no panel count */}
                                  {(!hasPanel || panelCount === 1) && (
                                    <div className="flex-1 relative">
                                      <div className="absolute inset-1 bg-blue-50 border border-gray-400"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Width dimension line - positioned above frame, aligned with frame edges */}
                          {hasWidth && (
                            <div className="absolute" style={{ 
                              top: `${labelPadding - 45}px`, 
                              left: '0px',
                              width: `${frameWidth}px`
                            }}>
                              <div className="flex flex-col items-center w-full">
                                {/* Horizontal dimension line with vertical end markers */}
                                <div className="relative w-full flex items-center justify-center" style={{ height: '16px' }}>
                                  {/* Left vertical marker */}
                                  <div className="absolute left-0 w-0.5 h-4 bg-gray-900"></div>
                                  {/* Horizontal line spanning full width */}
                                  <div className="absolute left-0 right-0 h-0.5 bg-gray-900"></div>
                                  {/* Right vertical marker */}
                                  <div className="absolute right-0 w-0.5 h-4 bg-gray-900"></div>
                                </div>
                                {/* Dimension text centered above line */}
                                <div className="text-base font-bold text-gray-900 mt-1.5 text-center">
                                  {width} {unit}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Height dimension line - positioned to the right of frame, aligned with frame edges */}
                          {hasHeight && (
                            <div className="absolute" style={{ 
                              top: `${labelPadding}px`, 
                              bottom: `${labelPadding}px`,
                              left: `${frameWidth + 8}px`,
                              width: `${labelPadding - 8}px`
                            }}>
                              <div className="flex items-center h-full">
                                {/* Vertical dimension line with horizontal end markers */}
                                <div className="relative h-full flex items-center justify-center" style={{ width: '16px' }}>
                                  {/* Top horizontal marker */}
                                  <div className="absolute top-0 w-4 h-0.5 bg-gray-900"></div>
                                  {/* Vertical line spanning full height */}
                                  <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900"></div>
                                  {/* Bottom horizontal marker */}
                                  <div className="absolute bottom-0 w-4 h-0.5 bg-gray-900"></div>
                                </div>
                                {/* Dimension text - rotated 90 degrees clockwise, centered to the right */}
                                <div className="ml-3 flex flex-col items-center">
                                  <div className="text-base font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">
                                    {height} {unit}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Panel count label - positioned directly below frame, centered */}
                          {hasPanel && (
                            <div className="absolute" style={{ 
                              top: `${labelPadding + frameHeight + 15}px`, 
                              left: '0px',
                              width: `${frameWidth}px`
                            }}>
                              <div className="text-center w-full">
                                <div className="text-base font-semibold text-gray-900">
                                  {panelCount} Panel{panelCount > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg relative">
                          <span className="text-sm font-medium">Enter measurements below</span>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                        </div>
                      </div>
                    );
                  }
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
                  >
                    <option value="">Select type</option>
                    {glazingTypes.map((glazingType) => (
                      <option key={glazingType} value={glazingType}>{glazingType}</option>
                    ))}
                  </select>
                </div>

                {/* Width and Height */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
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
                      placeholder="Eg : 120mm"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
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
                      placeholder="Eg : 120mm"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>

                {/* Quantity and Panel */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
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
                      placeholder="Eg : 3"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="panel" className="block text-sm font-medium text-gray-700 mb-2">
                      Panel
                    </label>
                    <input
                      type="text"
                      id="panel"
                      value={panel}
                      onChange={(e) => setPanel(e.target.value)}
                      placeholder="Eg : 3"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>

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
                        {dimensions.map((dim, index) => (
                          <tr key={dim.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-3 px-3 text-gray-900 text-xs">{index + 1}.</td>
                            <td className="py-3 px-3 text-gray-900 text-xs">
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
                        ))}
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
