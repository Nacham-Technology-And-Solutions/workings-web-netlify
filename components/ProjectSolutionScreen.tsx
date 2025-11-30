import React, { useState } from 'react';

interface ProjectSolutionScreenProps {
  onBack: () => void;
  onGenerate: () => void;
  previousData?: any;
  initialTab?: 'material' | 'cutting' | 'glass';
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const ProjectSolutionScreen: React.FC<ProjectSolutionScreenProps> = ({ onBack, onGenerate, previousData, initialTab = 'material' }) => {
  const [activeTab, setActiveTab] = useState<'material' | 'cutting' | 'glass'>(initialTab);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  // Sample data - Profile items
  const profileItems: MaterialItem[] = [
    { id: '1', name: 'Width', quantity: 10, unit: 'units' },
    { id: '2', name: 'Height', quantity: 10, unit: 'units' },
    { id: '3', name: 'Mcllium', quantity: 10, unit: 'units' },
    { id: '4', name: 'Glass', quantity: 10, unit: 'units' },
    { id: '5', name: 'D/Curve', quantity: 10, unit: 'units' },
  ];

  // Sample data - Accessories items
  const accessoriesItems: MaterialItem[] = [
    { id: '6', name: 'Hinges', quantity: 10, unit: 'units' },
    { id: '7', name: 'Stopper', quantity: 10, unit: 'units' },
    { id: '8', name: 'Handle', quantity: 10, unit: 'units' },
    { id: '9', name: 'Rubber', quantity: 10, unit: 'units' },
    { id: '10', name: 'Screw', quantity: 10, unit: 'units' },
  ];

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const grandTotal = 255000; // Sample total

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>Projects</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600">Glazing-Type</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Create New Quote</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Quote</h1>
              </div>
            </div>

            {/* Header Actions */}
            {activeTab === 'cutting' || activeTab === 'glass' ? (
              <button
                onClick={() => console.log('Exporting cutting list...')}
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
              >
                <span>Export</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onGenerate}
                className="px-8 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
              >
                Generate Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('material')}
                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'material'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Material List
                {activeTab === 'material' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('cutting')}
                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'cutting'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Cutting List (C.L)
                {activeTab === 'cutting' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('glass')}
                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'glass'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Glass Cutting List (C.L)
                {activeTab === 'glass' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>

              {/* Filter Button */}
              <button className="ml-auto pb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span className="text-sm">Filter</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Material List Content */}
          {activeTab === 'material' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Profile</h3>
                <div className="space-y-3">
                  {profileItems.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleItemExpansion(item.id)}
                        className="w-full flex justify-between items-center py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900 font-normal">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                            {item.quantity} {item.unit}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedItems[item.id] ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedItems[item.id] && (
                        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                          {/* Item Info */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Item Info</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-medium">{item.name}</span>
                          </div>

                          {/* Quantity */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Qty(s)</span>
                            <span className="text-gray-900">:</span>
                            <input
                              type="number"
                              defaultValue={item.quantity}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                          </div>

                          {/* Price */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price</span>
                            <span className="text-gray-900">:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900">₦</span>
                              <input
                                type="text"
                                placeholder="Enter your price..."
                                className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-gray-400"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Total</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-bold">₦ 0.00</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button className="p-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button className="p-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessories Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Accessories</h3>
                <div className="space-y-3">
                  {accessoriesItems.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleItemExpansion(item.id)}
                        className="w-full flex justify-between items-center py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900 font-normal">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                            {item.quantity} {item.unit}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedItems[item.id] ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedItems[item.id] && (
                        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                          {/* Item Info */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Item Info</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-medium">{item.name}</span>
                          </div>

                          {/* Quantity */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Qty(s)</span>
                            <span className="text-gray-900">:</span>
                            <input
                              type="number"
                              defaultValue={item.quantity}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                          </div>

                          {/* Price */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price</span>
                            <span className="text-gray-900">:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900">₦</span>
                              <input
                                type="text"
                                placeholder="Enter your price..."
                                className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-gray-400"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Total</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-bold">₦ 0.00</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button className="p-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button className="p-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cutting List Content */}
          {activeTab === 'cutting' && (
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-base font-semibold text-gray-900">Cutting Layout</h3>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Material Length: </span>
                    <span className="font-medium text-gray-900">6 meters</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity: </span>
                    <span className="font-medium text-gray-900">20 length</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Layout A */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs text-gray-500 uppercase block mb-1">Layout</span>
                      <span className="text-lg font-medium text-gray-900">A</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase block mb-1">Repetition</span>
                      <span className="text-lg font-medium text-gray-900">6X</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex h-12 mb-2">
                    <div className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900" style={{ width: '75%' }}>
                      4.5m
                    </div>
                    <div className="h-full bg-gray-100 flex items-center justify-center relative" style={{ width: '25%', backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                      <div className="absolute inset-0 border-l border-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Off-cut: </span>
                    <span className="text-sm font-medium text-gray-900">1.5m</span>
                  </div>
                </div>

                {/* Layout B */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs text-gray-500 uppercase block mb-1">Layout</span>
                      <span className="text-lg font-medium text-gray-900">B</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase block mb-1">Repetition</span>
                      <span className="text-lg font-medium text-gray-900">3X</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex h-12 mb-2">
                    <div className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900 border-r border-white/20" style={{ width: '30%' }}>
                      1.2m
                    </div>
                    <div className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900 border-r border-white/20" style={{ width: '30%' }}>
                      1.2m
                    </div>
                    <div className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900" style={{ width: '28%' }}>
                      1.1m
                    </div>
                    <div className="h-full bg-gray-100 flex items-center justify-center relative" style={{ width: '12%', backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                      <div className="absolute inset-0 border-l border-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Off-cut: </span>
                    <span className="text-sm font-medium text-gray-900">0.2m</span>
                  </div>
                </div>

                {/* Layout C */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs text-gray-500 uppercase block mb-1">Layout</span>
                      <span className="text-lg font-medium text-gray-900">C</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase block mb-1">Repetition</span>
                      <span className="text-lg font-medium text-gray-900">3X</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex h-12 mb-2">
                    <div className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900" style={{ width: '30%' }}>
                      1.2m
                    </div>
                    <div className="h-full bg-gray-100 flex items-center justify-center relative" style={{ width: '70%', backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                      <div className="absolute inset-0 border-l border-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Off-cut: </span>
                    <span className="text-sm font-medium text-gray-900">2.4m</span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Glass Cutting List Content */}
          {activeTab === 'glass' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-6">Glass Cutting Layout</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Grid Area */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 min-h-[500px] relative flex flex-col items-center justify-center">
                  {/* Grid Background */}
                  <div className="absolute inset-0 m-4 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#E2E8F0 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

                  {!selectedSheet ? (
                    /* Default State - Tooltip */
                    <div className="relative z-10 bg-[#4A8B9F] text-white px-4 py-3 rounded shadow-lg text-center">
                      <p className="text-xs font-medium">Enter</p>
                      <p className="text-xs">measurements below</p>
                      {/* Tooltip Arrow */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#4A8B9F] rotate-45"></div>
                    </div>
                  ) : (
                    /* Selected State - Layout Visualization */
                    <div className="relative z-10 w-full max-w-2xl">
                      {/* Sheet Badge */}
                      <div className="flex justify-center mb-4">
                        <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">Sheet 1</span>
                      </div>

                      {/* Layout Diagram */}
                      <div className="border-2 border-gray-400 bg-gray-200 p-0.5 flex">
                        {/* Main Cuts Area */}
                        <div className="flex-1 flex flex-col">
                          {/* Row 1 */}
                          <div className="flex h-40">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={`r1-${i}`} className="flex-1 border border-gray-600 bg-[#C8DEE5] relative flex items-center justify-center">
                                <span className="absolute top-1 text-xs font-medium">500</span>
                                <span className="absolute -rotate-90 text-xs font-medium">1050</span>
                              </div>
                            ))}
                          </div>
                          {/* Row 2 */}
                          <div className="flex h-40">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={`r2-${i}`} className="flex-1 border border-gray-600 bg-[#C8DEE5] relative flex items-center justify-center">
                                <span className="absolute top-1 text-xs font-medium">500</span>
                                <span className="absolute -rotate-90 text-xs font-medium">1050</span>
                              </div>
                            ))}
                          </div>
                          {/* Bottom Offcut */}
                          <div className="h-8 border border-gray-600 bg-gray-300 relative flex items-center justify-center">
                            <span className="absolute left-2 text-xs font-medium">40</span>
                            <span className="absolute bottom-1 text-xs font-medium">3000</span>
                          </div>
                        </div>

                        {/* Right Offcut */}
                        <div className="w-12 border border-gray-600 bg-gray-300 relative flex flex-col items-center justify-center">
                          <span className="absolute top-2 text-xs font-medium">310</span>
                          <span className="absolute -rotate-90 text-xs font-medium">2140</span>
                        </div>
                      </div>

                      {/* Pagination */}
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button className="p-1 rounded-full hover:bg-gray-100">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-gray-900">1/2</span>
                        <button className="p-1 rounded-full hover:bg-gray-100">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel - Sheet List */}
                <div className="space-y-4">
                  {/* Sheet 1 */}
                  <button
                    onClick={() => setSelectedSheet('sheet1')}
                    className={`w-full text-left border rounded-lg p-6 transition-colors ${selectedSheet === 'sheet1'
                      ? 'bg-[#EBF5F8] border-[#EBF5F8] ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className="text-sm text-gray-500 mb-2">Sheet 1</h4>
                    <p className="text-lg font-medium text-gray-900 mb-4">827 X 2140</p>
                    <div className={`border-t border-dashed pt-4 ${selectedSheet === 'sheet1' ? 'border-blue-200' : 'border-gray-200'}`}>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-base font-medium text-gray-900">4 pcs</p>
                    </div>
                  </button>

                  {/* Sheet 2 */}
                  <button
                    onClick={() => setSelectedSheet('sheet2')}
                    className={`w-full text-left border rounded-lg p-6 transition-colors ${selectedSheet === 'sheet2'
                      ? 'bg-[#EBF5F8] border-[#EBF5F8] ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className="text-sm text-gray-500 mb-2">Sheet 2</h4>
                    <p className="text-lg font-medium text-gray-900 mb-4">827 X 2140</p>
                    <div className={`border-t border-dashed pt-4 ${selectedSheet === 'sheet2' ? 'border-blue-200' : 'border-gray-200'}`}>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-base font-medium text-gray-900">4 pcs</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Grand Total and Generate Button */}
      {/* Footer with Grand Total and Generate Button */}
      {activeTab === 'material' && (
        <div className="border-t border-gray-200 bg-white px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Grand Total</span>
              <span className="text-2xl font-bold text-gray-900">₦{grandTotal.toLocaleString()}</span>
            </div>
            <button
              onClick={onGenerate}
              className="w-full py-4 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
            >
              Generate Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSolutionScreen;
