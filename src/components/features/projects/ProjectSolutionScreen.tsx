import React, { useState, useEffect } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectDescriptionData } from './ProjectDescriptionScreen';
import type { SelectProjectData } from './SelectProjectScreen';
import type { ProjectMeasurementData, DimensionItem } from './ProjectMeasurementScreen';
import { 
  exportMaterialListToPDF, 
  exportCuttingListToPDF, 
  exportMaterialListToExcel,
  exportCuttingListToExcel,
  shareData 
} from '@/services/export/exportService';

interface ProjectSolutionScreenProps {
  onBack: () => void;
  onGenerate: () => void;
  onCreateQuote: (materialCost?: number) => void;
  previousData?: {
    projectDescription?: ProjectDescriptionData;
    selectProject?: SelectProjectData;
    projectMeasurement?: ProjectMeasurementData;
  };
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  originalQuantity: number; // Store original calculated quantity
  unit: string;
  unitPrice: number;
  total: number;
  wasteFactor: number; // Percentage (e.g., 10 for 10%)
}

interface CuttingLayout {
  id: string;
  layout: string;
  repetition: number;
  cuts: { length: number; unit: string }[];
  offCut: number;
}

interface GlassSheet {
  id: string;
  sheetNumber: number;
  dimensions: { width: number; height: number };
  quantity: number;
  pieces: {
    width: number;
    height: number;
    count: number;
    rows: number;
    cols: number;
  };
  offcuts: {
    right?: { width: number; height: number };
    bottom?: { width: number; height: number };
  };
}

const ProjectSolutionScreen: React.FC<ProjectSolutionScreenProps> = ({ onBack, onGenerate, onCreateQuote, previousData }) => {
  const [activeTab, setActiveTab] = useState<'material' | 'cutting' | 'glass'>('material');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [cuttingLayouts, setCuttingLayouts] = useState<CuttingLayout[]>([]);
  const [glassSheets, setGlassSheets] = useState<GlassSheet[]>([]);
  const [materialLength] = useState(6); // meters - could be made dynamic
  const [materialQuantity, setMaterialQuantity] = useState(0);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);

  // Generate materials based on actual data from previous steps
  useEffect(() => {
    if (!previousData?.projectMeasurement) return;

    const dimensions = previousData.projectMeasurement.dimensions || [];
    const unit = previousData.projectMeasurement.unit || 'mm';
    const selectedGlazingTypes = previousData.selectProject || {};
    
    // Calculate materials from dimensions
    const materials = calculateMaterialsFromDimensions(dimensions, unit, selectedGlazingTypes);
    setMaterialList(materials);

    // Generate cutting layouts
    const layouts = generateCuttingLayouts(dimensions, unit);
    setCuttingLayouts(layouts);
    setMaterialQuantity(layouts.reduce((sum, layout) => sum + layout.repetition, 0));

    // Generate glass cutting sheets
    const sheets = generateGlassSheets(dimensions, unit);
    setGlassSheets(sheets);
  }, [previousData]);

  const calculateMaterialsFromDimensions = (dimensions: DimensionItem[], unit: string, glazingTypes?: SelectProjectData): MaterialItem[] => {
    const materials: MaterialItem[] = [];
    let materialId = 1;

    dimensions.forEach((dim) => {
      const width = parseFloat(dim.width) || 0;
      const height = parseFloat(dim.height) || 0;
      const quantity = parseInt(dim.quantity) || 0;
      const panels = parseInt(dim.panel) || 1;

      // Calculate perimeter for frames (Width materials)
      const perimeterInMM = (width * 2 + height * 2);
      const widthQuantity = Math.ceil((perimeterInMM / 1000) * quantity); // Convert to meters
      
      // Add or update Width material
      const widthMaterial = materials.find(m => m.name === 'Width');
      if (widthMaterial) {
        widthMaterial.quantity += widthQuantity;
        widthMaterial.originalQuantity += widthQuantity;
      } else {
        materials.push({
          id: String(materialId++),
          name: 'Width',
          quantity: widthQuantity,
          originalQuantity: widthQuantity,
          unit: 'units',
          unitPrice: 0,
          total: 0,
          wasteFactor: 10 // Default 10% waste factor
        });
      }

      // Calculate height materials (vertical sections)
      const heightQuantity = Math.ceil(height / 1000) * quantity * 2; // Both sides
      const heightMaterial = materials.find(m => m.name === 'Height');
      if (heightMaterial) {
        heightMaterial.quantity += heightQuantity;
        heightMaterial.originalQuantity += heightQuantity;
      } else {
        materials.push({
          id: String(materialId++),
          name: 'Height',
          quantity: heightQuantity,
          originalQuantity: heightQuantity,
          unit: 'units',
          unitPrice: 0,
          total: 0,
          wasteFactor: 10
        });
      }

      // Calculate mullions (dividers between panels)
      if (panels > 1) {
        const mullionQuantity = (panels - 1) * quantity;
        const mullionMaterial = materials.find(m => m.name === 'Mullion');
        if (mullionMaterial) {
          mullionMaterial.quantity += mullionQuantity;
          mullionMaterial.originalQuantity += mullionQuantity;
      } else {
        materials.push({
          id: String(materialId++),
          name: 'Mullion',
          quantity: mullionQuantity,
          originalQuantity: mullionQuantity,
          unit: 'units',
          unitPrice: 0,
          total: 0,
          wasteFactor: 5
        });
      }
      }

      // Calculate glass area
      const glassAreaPerPanel = (width * height) / (1000000); // Convert to square meters
      const totalGlassArea = glassAreaPerPanel * panels * quantity;
      const glassMaterial = materials.find(m => m.name === 'Glass');
      if (glassMaterial) {
        glassMaterial.quantity += Math.ceil(totalGlassArea);
        glassMaterial.originalQuantity += Math.ceil(totalGlassArea);
      } else {
        materials.push({
          id: String(materialId++),
          name: 'Glass',
          quantity: Math.ceil(totalGlassArea),
          originalQuantity: Math.ceil(totalGlassArea),
          unit: 'sqm',
          unitPrice: 0,
          total: 0,
          wasteFactor: 15 // Glass typically has higher waste
        });
      }

      // Add hardware based on glazing type
      if (dim.type.toLowerCase().includes('sliding')) {
        const hardwareMaterial = materials.find(m => m.name === 'Sliding Track');
        if (hardwareMaterial) {
          hardwareMaterial.quantity += quantity;
          hardwareMaterial.originalQuantity += quantity;
        } else {
          materials.push({
            id: String(materialId++),
            name: 'Sliding Track',
            quantity,
            originalQuantity: quantity,
            unit: 'sets',
            unitPrice: 0,
            total: 0,
            wasteFactor: 0
          });
        }
      } else if (dim.type.toLowerCase().includes('casement')) {
        const hardwareMaterial = materials.find(m => m.name === 'Casement Hinges');
        if (hardwareMaterial) {
          hardwareMaterial.quantity += quantity * 2; // 2 hinges per unit
          hardwareMaterial.originalQuantity += quantity * 2;
        } else {
          materials.push({
            id: String(materialId++),
            name: 'Casement Hinges',
            quantity: quantity * 2,
            originalQuantity: quantity * 2,
            unit: 'pieces',
            unitPrice: 0,
            total: 0,
            wasteFactor: 5
          });
        }
      }

      // Add locks/handles
      const lockMaterial = materials.find(m => m.name === 'Locks & Handles');
      if (lockMaterial) {
        lockMaterial.quantity += quantity;
        lockMaterial.originalQuantity += quantity;
      } else {
        materials.push({
          id: String(materialId++),
          name: 'Locks & Handles',
          quantity,
          originalQuantity: quantity,
          unit: 'sets',
          unitPrice: 0,
          total: 0,
          wasteFactor: 0
        });
      }
    });

    // Add silicone/sealant based on total perimeter
    const totalPerimeter = dimensions.reduce((sum, dim) => {
      const width = parseFloat(dim.width) || 0;
      const height = parseFloat(dim.height) || 0;
      const quantity = parseInt(dim.quantity) || 0;
      return sum + ((width * 2 + height * 2) * quantity);
    }, 0);
    
    if (totalPerimeter > 0) {
      const siliconeTubes = Math.ceil((totalPerimeter / 1000) / 10); // 10m per tube
      materials.push({
        id: String(materialId++),
        name: 'Silicone Sealant',
        quantity: siliconeTubes,
        originalQuantity: siliconeTubes,
        unit: 'tubes',
        unitPrice: 0,
        total: 0,
        wasteFactor: 20 // Sealant typically has higher waste
      });
    }

    return materials;
  };

  const generateCuttingLayouts = (dimensions: DimensionItem[], unit: string): CuttingLayout[] => {
    const layouts: CuttingLayout[] = [];
    const standardLength = materialLength; // 6 meters

    dimensions.forEach((dim, index) => {
      const width = parseFloat(dim.width) || 0;
      const height = parseFloat(dim.height) || 0;
      const quantity = parseInt(dim.quantity) || 0;
      
      // Convert to meters
      const widthM = unit === 'mm' ? width / 1000 : width;
      const heightM = unit === 'mm' ? height / 1000 : height;

      // Determine how many pieces fit in standard length
      const piecesPerLength = Math.floor(standardLength / heightM);
      
      if (piecesPerLength > 0 && quantity > 0) {
        const cutsPerLayout = Math.min(piecesPerLength, 3); // Max 3 cuts per layout
        const cutLength = parseFloat(heightM.toFixed(1));
        const offCut = standardLength - (cutLength * cutsPerLayout);

        // Create array of individual cuts
        const cutsArray = [];
        for (let i = 0; i < cutsPerLayout; i++) {
          cutsArray.push({ length: cutLength, unit: 'm' });
        }

        layouts.push({
          id: String.fromCharCode(65 + index), // A, B, C...
          layout: String.fromCharCode(65 + index),
          repetition: Math.ceil(quantity / cutsPerLayout),
          cuts: cutsArray,
          offCut: offCut > 0.1 ? parseFloat(offCut.toFixed(1)) : 0
        });
      }
    });

    return layouts.length > 0 ? layouts : [
      { id: 'A', layout: 'A', repetition: 1, cuts: [{ length: 4.5, unit: 'm' }], offCut: 1.5 }
    ];
  };

  const generateGlassSheets = (dimensions: DimensionItem[], unit: string): GlassSheet[] => {
    const sheets: GlassSheet[] = [];
    const standardSheetWidth = 3000; // Standard glass sheet width in mm
    const standardSheetHeight = 2140; // Standard glass sheet height in mm

    dimensions.forEach((dim, index) => {
      const width = parseFloat(dim.width) || 0;
      const height = parseFloat(dim.height) || 0;
      const quantity = parseInt(dim.quantity) || 0;
      const panels = parseInt(dim.panel) || 1;

      // Convert to mm if needed
      const widthMM = unit === 'mm' ? width : width * 1000;
      const heightMM = unit === 'mm' ? height : height * 1000;

      // Calculate piece size (divide by panels)
      const pieceWidth = widthMM / panels;
      const pieceHeight = heightMM;

      // Validate dimensions fit within sheet
      if (pieceWidth > standardSheetWidth || pieceHeight > standardSheetHeight) {
        console.warn(`Dimension ${dim.type} too large for standard sheet`);
        return;
      }

      // Calculate how many pieces fit in a standard sheet
      const piecesPerRow = Math.floor(standardSheetWidth / pieceWidth);
      const piecesPerCol = Math.floor(standardSheetHeight / pieceHeight);
      const piecesPerSheet = piecesPerRow * piecesPerCol;

      if (piecesPerSheet > 0 && quantity > 0) {
        const totalPieces = quantity * panels;
        const sheetsNeeded = Math.ceil(totalPieces / piecesPerSheet);

        // Calculate offcuts
        const usedWidth = pieceWidth * piecesPerRow;
        const usedHeight = pieceHeight * piecesPerCol;
        const rightOffcut = standardSheetWidth - usedWidth;
        const bottomOffcut = standardSheetHeight - usedHeight;

        sheets.push({
          id: String(index + 1),
          sheetNumber: index + 1,
          dimensions: { width: standardSheetWidth, height: standardSheetHeight },
          quantity: sheetsNeeded,
          pieces: {
            width: Math.round(pieceWidth),
            height: Math.round(pieceHeight),
            count: Math.min(piecesPerSheet, totalPieces), // Don't show more pieces than needed
            rows: piecesPerCol,
            cols: piecesPerRow
          },
          offcuts: {
            right: rightOffcut > 50 ? { width: Math.round(rightOffcut), height: standardSheetHeight } : undefined,
            bottom: bottomOffcut > 50 ? { width: standardSheetWidth, height: Math.round(bottomOffcut) } : undefined
          }
        });
      }
    });

    return sheets;
  };

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateItemPrice = (id: string, price: string) => {
    const numericPrice = parseFloat(price) || 0;
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const total = item.quantity * numericPrice;
        return { ...item, unitPrice: numericPrice, total };
      }
      return item;
    }));
  };

  const updateItemQuantity = (id: string, newQuantity: number) => {
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const quantity = Math.max(0, newQuantity); // Prevent negative
        const total = quantity * item.unitPrice;
        return { ...item, quantity, total };
      }
      return item;
    }));
  };

  const incrementQuantity = (id: string) => {
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const quantity = item.quantity + 1;
        const total = quantity * item.unitPrice;
        return { ...item, quantity, total };
      }
      return item;
    }));
  };

  const decrementQuantity = (id: string) => {
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const quantity = Math.max(0, item.quantity - 1);
        const total = quantity * item.unitPrice;
        return { ...item, quantity, total };
      }
      return item;
    }));
  };

  const updateWasteFactor = (id: string, wasteFactor: string) => {
    const factor = parseFloat(wasteFactor) || 0;
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const wasteMultiplier = 1 + (factor / 100);
        const adjustedQuantity = Math.ceil(item.originalQuantity * wasteMultiplier);
        const total = adjustedQuantity * item.unitPrice;
        return { ...item, quantity: adjustedQuantity, wasteFactor: factor, total };
      }
      return item;
    }));
  };

  const resetToOriginalQuantity = (id: string) => {
    setMaterialList(prev => prev.map(item => {
      if (item.id === id) {
        const total = item.originalQuantity * item.unitPrice;
        return { ...item, quantity: item.originalQuantity, wasteFactor: 0, total };
      }
      return item;
    }));
  };

  const handleEditItem = (id: string) => {
    // Toggle expansion to edit
    if (!expandedItems[id]) {
      toggleItemExpansion(id);
    }
  };

  const handleDeleteItem = (id: string) => {
    setMaterialList(prev => prev.filter(item => item.id !== id));
    setExpandedItems(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[id];
      return newExpanded;
    });
  };

  const calculateGrandTotal = () => {
    return materialList.reduce((total, item) => total + item.total, 0);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handleGenerateClick = () => {
    setShowGenerateModal(true);
  };

  const handleGenerateOption = (option: 'material' | 'cutting' | 'quote') => {
    setShowGenerateModal(false);
    
    if (option === 'quote') {
      // Pass material cost to quote configuration screen
      const grandTotal = calculateGrandTotal();
      onCreateQuote(grandTotal);
    } else {
      // Handle other generation options
      console.log(`Generating ${option}`);
      onGenerate();
    }
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportOption = async (format: 'pdf' | 'excel' | 'share') => {
    const projectName = previousData?.projectDescription?.projectName || 'Project';
    const customerName = previousData?.projectDescription?.customerName || 'Customer';
    const grandTotal = calculateGrandTotal();

    try {
      if (activeTab === 'material') {
        if (format === 'pdf') {
          exportMaterialListToPDF(materialList, projectName, customerName, grandTotal);
          setExportMessage('Material List PDF downloaded successfully!');
        } else if (format === 'excel') {
          exportMaterialListToExcel(materialList, projectName, customerName, grandTotal);
          setExportMessage('Material List Excel file downloaded successfully!');
        } else if (format === 'share') {
          const result = await shareData('material', materialList, projectName);
          setExportMessage(result.message);
        }
      } else if (activeTab === 'cutting') {
        if (format === 'pdf') {
          exportCuttingListToPDF(cuttingLayouts, projectName, materialLength, materialQuantity);
          setExportMessage('Cutting List PDF downloaded successfully!');
        } else if (format === 'excel') {
          exportCuttingListToExcel(cuttingLayouts, projectName, materialLength, materialQuantity);
          setExportMessage('Cutting List Excel file downloaded successfully!');
        } else if (format === 'share') {
          const result = await shareData('cutting', cuttingLayouts, projectName);
          setExportMessage(result.message);
        }
      }
    } catch (error) {
      setExportMessage('Export failed. Please try again.');
      console.error('Export error:', error);
    }

    setShowExportModal(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setExportMessage(null), 3000);
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
        <h1 className="text-xl font-bold text-gray-900 flex-1">
          {previousData?.projectDescription?.projectName || 'Olumide Residence Renovat...'}
        </h1>
        
        {/* Export Button - Show on all tabs with data */}
        {((activeTab === 'material' && materialList.length > 0) || 
          (activeTab === 'cutting' && cuttingLayouts.length > 0) || 
          (activeTab === 'glass' && glassSheets.length > 0)) && (
          <button 
            onClick={handleExportClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Export</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Progress Indicator */}
          <div className="mb-6 flex items-center gap-4">
            <ProgressIndicator currentStep={4} totalSteps={4} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Solution</h2>
              <p className="text-gray-600 text-sm mt-1">Find all the necessary details about your project below.</p>
            </div>
          </div>

          {/* Tabs - Scrollable */}
          <div className="mb-6 border-b border-gray-200 overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max">
              <button
                onClick={() => setActiveTab('material')}
                className={`pb-3 px-0 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === 'material'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Material List
                {activeTab === 'material' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('cutting')}
                className={`pb-3 px-0 text-sm font-normal transition-colors relative whitespace-nowrap ${
                  activeTab === 'cutting'
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Cutting List (C.L)
                {activeTab === 'cutting' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900"></div>
                )}
                {activeTab !== 'cutting' && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('glass')}
                className={`pb-3 px-0 text-sm font-normal transition-colors relative whitespace-nowrap ${
                  activeTab === 'glass'
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Glass Cutting List
                {activeTab === 'glass' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900"></div>
                )}
                {activeTab !== 'glass' && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
                )}
              </button>
            </div>
          </div>


          {/* Profile Section Header - Only for Material List */}
          {activeTab === 'material' && (
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span className="text-sm">Filter</span>
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Material List Items */}
          {activeTab === 'material' && (
            <div className="space-y-3 pb-40">
              {materialList.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-lg mb-2">No materials calculated yet</p>
                  <p className="text-sm">Please complete the previous steps to see material calculations</p>
                </div>
              ) : (
                materialList.map((item) => (
                <div key={item.id} className="bg-white">
                  <button
                    onClick={() => toggleItemExpansion(item.id)}
                    className="w-full flex justify-between items-center py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-900 font-normal">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-full">
                        {item.quantity} {item.unit}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedItems[item.id] ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </button>
                  
                  {/* Expanded Content - Detailed Form */}
                  {expandedItems[item.id] && (
                    <div className="px-4 py-4 bg-white border border-gray-200 rounded-lg mb-3 space-y-4">
                      {/* Item Info */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item Info :</span>
                        <span className="text-gray-900 font-medium">{item.name}</span>
                      </div>
                      
                      {/* Quantity with +/- buttons */}
                      <div>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-600">Qty(s) :</span>
                          <span className="text-xs text-gray-500">
                            (Original: {item.originalQuantity})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => decrementQuantity(item.id)}
                            className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
                          >
                            -
                          </button>
                          {editingQuantity === item.id ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                              onBlur={() => setEditingQuantity(null)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => setEditingQuantity(item.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-semibold cursor-pointer hover:bg-gray-50"
                            >
                              {item.quantity}
                            </div>
                          )}
                          <button
                            onClick={() => incrementQuantity(item.id)}
                            className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                        {item.quantity !== item.originalQuantity && (
                          <button
                            onClick={() => resetToOriginalQuantity(item.id)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Reset to original
                          </button>
                        )}
                      </div>

                      {/* Waste Factor */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          Waste Factor (%)
                        </label>
                        <input
                          type="number"
                          value={item.wasteFactor}
                          onChange={(e) => updateWasteFactor(item.id, e.target.value)}
                          min="0"
                          max="100"
                          step="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Adjusts quantity for waste/overages
                        </p>
                      </div>
                      
                      {/* Price Input */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Price :</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">₦</span>
                          <input
                            type="text"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItemPrice(item.id, e.target.value)}
                            placeholder="Enter your price..."
                            className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-semibold">Total :</span>
                        <span className="text-gray-900 font-bold">{formatCurrency(item.total)}</span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleEditItem(item.id)}
                          className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
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
                          <span className="text-sm">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
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
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!expandedItems[item.id] && (
                    <div className="border-b border-gray-200"></div>
                  )}
                </div>
              ))
              )}
            </div>
          )}

          {/* Cutting List Tab Content */}
          {activeTab === 'cutting' && (
            <div className="pb-6">
              {cuttingLayouts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-lg mb-2">No cutting layouts available</p>
                  <p className="text-sm">Add dimensions in Step 3 to generate cutting layouts</p>
                </div>
              ) : (
                <>
                  {/* Cutting Layout Header */}
                  <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cutting Layout</h3>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <span className="text-sm">Filter</span>
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                  </button>
                </div>
                
                {/* Material Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material Length</span>
                    <span className="text-gray-900 font-medium">{materialLength} meters</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span className="text-gray-900 font-medium">{materialQuantity} length</span>
                  </div>
                </div>
                
                <div className="border-b border-gray-200"></div>
              </div>

              {/* Layout Cards */}
              <div className="space-y-4">
                {cuttingLayouts.map((layout) => {
                  const totalCutLength = layout.cuts.reduce((sum, cut) => sum + cut.length, 0);
                  const cutPercentage = (totalCutLength / materialLength) * 100;
                  const offCutPercentage = (layout.offCut / materialLength) * 100;
                  
                  return (
                    <div key={layout.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      {/* Layout Header */}
                      <div className="flex justify-between mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Layout</div>
                          <div className="text-2xl font-bold text-gray-900">{layout.layout}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Repetition</div>
                          <div className="text-xl font-bold text-gray-900">{layout.repetition}X</div>
                        </div>
                      </div>
                      
                      {/* Visual Bar Representation */}
                      <div className="mb-3">
                        <div className="flex h-12 rounded overflow-hidden border border-gray-300">
                          {/* Cut sections */}
                          {layout.cuts.map((cut, index) => {
                            const cutWidth = (cut.length / materialLength) * 100;
                            return (
                              <div
                                key={index}
                                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-r border-white"
                                style={{ width: `${cutWidth}%` }}
                              >
                                {cut.length}{cut.unit}
                              </div>
                            );
                          })}
                          
                          {/* Off-cut section */}
                          {layout.offCut > 0 && (
                            <div
                              className="bg-gray-300 flex items-center justify-center"
                              style={{ 
                                width: `${offCutPercentage}%`,
                                backgroundImage: 'repeating-linear-gradient(45deg, #d1d5db 0, #d1d5db 2px, #e5e7eb 2px, #e5e7eb 6px)'
                              }}
                            ></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Off-cut Info */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Off-cut:</span> {layout.offCut}m
                      </div>
                    </div>
                  );
                })}
              </div>
                </>
              )}
            </div>
          )}

          {/* Glass Cutting List Tab Content */}
          {activeTab === 'glass' && (
            <div className="pb-6">
              {/* Canvas/Diagram Area with Dotted Background */}
              <div className="mb-8 relative rounded-lg" style={{ minHeight: '450px' }}>
                {/* Dotted grid pattern background */}
                <div 
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #D1D5DB 1.5px, transparent 1.5px)',
                    backgroundSize: '16px 16px'
                  }}
                />
                
                {selectedSheet === null ? (
                  /* Empty State */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg relative">
                      <span className="text-sm font-medium">Select a layout to continue</span>
                      {/* Arrow pointing down */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                    </div>
                  </div>
                ) : (
                  /* Cutting Diagram for Selected Sheet */
                  <div className="relative z-10 py-8">
                    {(() => {
                      const sheet = glassSheets.find(s => s.sheetNumber === selectedSheet);
                      if (!sheet) return null;
                      
                      const scale = 0.09; // Scale factor - smaller to not fill canvas
                      const displayWidth = sheet.dimensions.width * scale;
                      const displayHeight = sheet.dimensions.height * scale;
                      const pieceWidth = sheet.pieces.width * scale;
                      const pieceHeight = sheet.pieces.height * scale;
                      const leftMargin = (sheet.offcuts.bottom?.width || 0) * scale;
                      
                      return (
                        <>
                          {/* Sheet Label */}
                          <div className="flex justify-center mb-6">
                            <span className="px-6 py-2 bg-gray-700 text-white text-sm rounded-lg font-medium">
                              Sheet {sheet.sheetNumber}
                            </span>
                          </div>
                          
                          {/* Cutting Diagram - Centered */}
                          <div className="flex justify-center mb-8">
                            <div className="relative inline-block">
                              <div
                                className="bg-gray-50 relative"
                                style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
                              >
                                {/* Left margin strip */}
                                {sheet.offcuts.bottom && (
                                  <div
                                    className="absolute left-0 top-0 bg-gray-300 flex items-end justify-center text-xs text-gray-700 pb-1"
                                    style={{
                                      width: `${leftMargin}px`,
                                      height: `${pieceHeight * sheet.pieces.rows}px`
                                    }}
                                  >
                                    <span>{sheet.offcuts.bottom.width}</span>
                                  </div>
                                )}
                                
                                {/* Main cutting grid */}
                                <div 
                                  className="grid absolute top-0"
                                  style={{ 
                                    left: `${leftMargin}px`,
                                    gridTemplateColumns: `repeat(${sheet.pieces.cols}, ${pieceWidth}px)`, 
                                    gridTemplateRows: `repeat(${sheet.pieces.rows}, ${pieceHeight}px)` 
                                  }}
                                >
                                  {Array.from({ length: sheet.pieces.count }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="bg-blue-400 border border-white flex flex-col items-center justify-center text-xs text-white font-semibold"
                                      style={{ width: `${pieceWidth}px`, height: `${pieceHeight}px` }}
                                    >
                                      <span>{sheet.pieces.width}</span>
                                      <span className="transform rotate-90 mt-1">{sheet.pieces.height}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Right offcut strip */}
                                {sheet.offcuts.right && (
                                  <div
                                    className="absolute top-0 bg-gray-300 border-l border-white flex flex-col items-center justify-center text-xs text-gray-700"
                                    style={{
                                      left: `${leftMargin + (pieceWidth * sheet.pieces.cols)}px`,
                                      width: `${sheet.offcuts.right.width * scale}px`,
                                      height: `${sheet.offcuts.right.height * scale}px`
                                    }}
                                  >
                                    <span>{sheet.offcuts.right.width}</span>
                                    <span className="transform rotate-90 mt-2">{sheet.offcuts.right.height}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Dimension labels */}
                              <div className="absolute -bottom-8 text-center text-sm font-medium text-gray-700" style={{ left: `${leftMargin}px`, width: `${pieceWidth * sheet.pieces.cols}px` }}>
                                {sheet.pieces.cols * sheet.pieces.width}
                              </div>
                              <div className="absolute top-0 -right-14 bottom-0 flex items-center">
                                <span className="transform rotate-90 text-sm font-medium text-gray-700 whitespace-nowrap">
                                  {sheet.dimensions.height}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pagination */}
                          <div className="flex justify-center items-center gap-4">
                            <button
                              onClick={() => setSelectedSheet(Math.max(1, selectedSheet - 1))}
                              disabled={selectedSheet === 1}
                              className="text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                            >
                              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M15 19l-7-7 7-7"></path>
                              </svg>
                            </button>
                            <span className="text-gray-900 font-medium">{selectedSheet}/{glassSheets.length}</span>
                            <button
                              onClick={() => setSelectedSheet(Math.min(glassSheets.length, selectedSheet + 1))}
                              disabled={selectedSheet === glassSheets.length}
                              className="text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                            >
                              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M9 5l7 7-7 7"></path>
                              </svg>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Glass Cutting Layout List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Glass Cutting Layout</h3>
                <div className="space-y-3">
                  {glassSheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setSelectedSheet(sheet.sheetNumber)}
                      className={`w-full p-4 rounded-lg border transition-colors ${
                        selectedSheet === sheet.sheetNumber
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <div className="text-sm text-gray-600 mb-1">Sheet {sheet.sheetNumber}</div>
                          <div className="text-lg font-bold text-gray-900">
                            {sheet.dimensions.width} X {sheet.dimensions.height}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Quantity</div>
                          <div className="text-lg font-bold text-gray-900">{sheet.quantity} pcs</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Grand Total and Generate Button (Only for Material List) */}
      {activeTab === 'material' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4">
            {/* Grand Total */}
            <div className="py-4 flex justify-between items-center">
              <span className="text-gray-700 font-medium">Grand Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(calculateGrandTotal())}</span>
            </div>
            
            {/* Generate Button */}
            <div className="pb-4">
              <button
                onClick={handleGenerateClick}
                className="w-full py-4 rounded-lg font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Success Message */}
      {exportMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          <p className="text-sm font-medium">{exportMessage}</p>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowExportModal(false)}
          ></div>
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up">
            <div className="max-w-2xl mx-auto">
              {/* Drag Indicator */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Export as:</h3>
              </div>
              
              {/* Options */}
              <div className="pb-6">
                <button
                  onClick={() => handleExportOption('pdf')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  <span>PDF Document</span>
                </button>
                <button
                  onClick={() => handleExportOption('excel')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
                  </svg>
                  <span>Excel Spreadsheet</span>
                </button>
                <button
                  onClick={() => handleExportOption('share')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-b border-gray-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                  <span>Share / Copy</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generate Options Modal */}
      {showGenerateModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowGenerateModal(false)}
          ></div>
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up">
            <div className="max-w-2xl mx-auto">
              {/* Drag Indicator */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Generate as:</h3>
              </div>
              
              {/* Options */}
              <div className="pb-6">
                <button
                  onClick={() => handleGenerateOption('material')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-gray-200"
                >
                  Material List
                </button>
                <button
                  onClick={() => handleGenerateOption('cutting')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-gray-200"
                >
                  Cutting List
                </button>
                <button
                  onClick={() => handleGenerateOption('quote')}
                  className="w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 transition-colors border-t border-b border-gray-200"
                >
                  Quote
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSolutionScreen;

