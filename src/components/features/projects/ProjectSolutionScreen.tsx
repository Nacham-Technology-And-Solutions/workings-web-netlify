import React, { useState, useEffect, useMemo, useRef } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectDescriptionData, SelectProjectData, ProjectMeasurementData, DimensionItem } from '@/types';
import type { CalculationResult, MaterialListItem, CuttingListItem, GlassListResult, RubberTotal, AccessoryTotal } from '@/types/calculations';
import {
  exportMaterialListToPDF,
  exportCuttingListToPDF,
  exportMaterialListToExcel,
  exportCuttingListToExcel,
  exportGlassCuttingListToPDF,
  exportGlassCuttingListToExcel,
  shareData
} from '@/services/export/exportService';
import { calculationsService, projectsService } from '@/services/api';
import { createProjectData, projectDataToProjectCart } from '@/utils/dataTransformers';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData, getApiResponseMessage } from '@/utils/apiResponseHelper';

interface ProjectSolutionScreenProps {
  onBack: () => void;
  onGenerate: (materialCost: number) => void;
  previousData?: {
    projectDescription?: ProjectDescriptionData;
    selectProject?: SelectProjectData;
    projectMeasurement?: ProjectMeasurementData;
  };
  initialTab?: 'material' | 'cutting' | 'glass';
  draftProjectId?: number | null;
  onCreateQuote?: (materialCost?: number, calculationResult?: CalculationResult, projectMeasurement?: ProjectMeasurementData) => void;
  onProjectSaved?: () => void;
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const ProjectSolutionScreen: React.FC<ProjectSolutionScreenProps> = ({ onBack, onGenerate, previousData, initialTab = 'material', draftProjectId, onCreateQuote, onProjectSaved }) => {
  const [activeTab, setActiveTab] = useState<'material' | 'cutting' | 'glass'>(initialTab);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectSaved, setProjectSaved] = useState(false);
  const [pointsDeducted, setPointsDeducted] = useState<number | null>(null);
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  
  // Refs to prevent duplicate calculations and saves (especially with React StrictMode)
  const calculationInProgressRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const hasCalculatedRef = useRef(false);
  const hasSavedRef = useRef(false);
  
  // State for prices and quantities (itemId -> value) - persist to localStorage
  const [itemPrices, setItemPrices] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined' && draftProjectId) {
      const saved = localStorage.getItem(`project-prices-${draftProjectId}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  
  // Filter states
  const [materialFilter, setMaterialFilter] = useState<'all' | 'Profile' | 'Accessory_Pair'>('all');
  const [materialSearch, setMaterialSearch] = useState('');
  const [cuttingFilter, setCuttingFilter] = useState<string>('all');
  const [glassFilter, setGlassFilter] = useState<string>('all');
  
  // Export dropdown states
  const [showExportDropdown, setShowExportDropdown] = useState<'cutting' | 'glass' | null>(null);
  
  // Save prices to localStorage when they change
  useEffect(() => {
    if (draftProjectId && Object.keys(itemPrices).length > 0) {
      localStorage.setItem(`project-prices-${draftProjectId}`, JSON.stringify(itemPrices));
    }
  }, [itemPrices, draftProjectId]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown-container')) {
        setShowExportDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  // Transform calculation result to display format
  const allProfileItems: MaterialItem[] = calculationResult?.materialList
    ? calculationResult.materialList
        .filter(item => item.type === 'Profile')
        .map((item, index) => ({
          id: `profile-${index}`,
          name: item.item,
          quantity: item.units,
          unit: item.type === 'Profile' ? 'units' : item.type.toLowerCase(),
        }))
    : [];

  const allAccessoriesItems: MaterialItem[] = calculationResult?.accessoryTotals
    ? calculationResult.accessoryTotals.map((item, index) => ({
        id: `accessory-${index}`,
        name: item.name,
        quantity: item.qty,
        unit: 'units',
      }))
    : [];

  // Apply filters to material items
  const profileItems = useMemo(() => {
    let filtered = allProfileItems;
    if (materialFilter === 'Profile') {
      filtered = allProfileItems;
    } else if (materialFilter === 'Accessory_Pair') {
      filtered = [];
    }
    if (materialSearch) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(materialSearch.toLowerCase())
      );
    }
    return filtered;
  }, [allProfileItems, materialFilter, materialSearch]);

  const accessoriesItems = useMemo(() => {
    let filtered = allAccessoriesItems;
    if (materialFilter === 'Accessory_Pair') {
      filtered = allAccessoriesItems;
    } else if (materialFilter === 'Profile') {
      filtered = [];
    }
    if (materialSearch) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(materialSearch.toLowerCase())
      );
    }
    return filtered;
  }, [allAccessoriesItems, materialFilter, materialSearch]);

  // Load calculation on mount if we have previous data
  useEffect(() => {
    // Prevent duplicate calculations (React StrictMode runs effects twice in dev)
    if (hasCalculatedRef.current || calculationInProgressRef.current) {
      return;
    }
    
    if (previousData?.projectDescription && previousData?.selectProject && previousData?.projectMeasurement) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleCalculate = async () => {
    // Prevent duplicate calculations
    if (calculationInProgressRef.current || hasCalculatedRef.current) {
      console.log('[ProjectSolutionScreen] Calculation already in progress or completed, skipping');
      return;
    }

    if (!previousData?.projectDescription || !previousData?.selectProject || !previousData?.projectMeasurement) {
      setError('Missing project data');
      return;
    }

    calculationInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Transform frontend data to backend format
      const projectData = createProjectData(
        previousData.projectDescription,
        previousData.selectProject,
        previousData.projectMeasurement
      );

      // Convert to ProjectCart format
      const { projectCart, settings } = projectDataToProjectCart(projectData);

      // Call calculation API
      const response = await calculationsService.calculate({
        projectCart,
        settings,
      });

      const normalizedResponse = normalizeApiResponse(response);
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        
        // Debug: Log the response structure
        console.log('Calculation API response data:', responseData);
        
        // API response structure:
        // {
        //   responseMessage: "...",
        //   response: {
        //     result: { materialList: [...], cuttingList: [...], ... },
        //     pointsDeducted: 5,
        //     balanceAfter: 35
        //   }
        // }
        // After normalizeApiResponse, responseData = { result: {...}, pointsDeducted: 5, balanceAfter: 35 }
        // Extract the result object which contains the calculation data
        const calculationData = responseData?.result;
        
        // Extract points information
        const points = responseData?.pointsDeducted ?? null;
        const balance = responseData?.balanceAfter ?? null;
        const message = getApiResponseMessage(response) || null;
        
        setPointsDeducted(points);
        setBalanceAfter(balance);
        setResponseMessage(message);
        
        // Debug: Log the raw calculation data structure
        console.log('Calculation result data:', calculationData);
        console.log('Points deducted:', points);
        console.log('Balance after:', balance);
        
        // Validate calculation data structure
        if (!calculationData) {
          setError('Invalid calculation response: No result data received');
          console.error('Missing result in response:', responseData);
          return;
        }
        
        // Extract all calculation result fields (API uses camelCase)
        const materialListData = calculationData.materialList || [];
        const cuttingListData = calculationData.cuttingList || [];
        const glassListData = calculationData.glassList || { sheet_type: '', total_sheets: 0, cuts: [] };
        const rubberTotalsData = calculationData.rubberTotals || [];
        const accessoryTotalsData = calculationData.accessoryTotals || [];
        
        // Debug: Log extracted data
        console.log('Extracted materialList:', materialListData);
        console.log('Extracted accessoryTotals:', accessoryTotalsData);
        console.log('MaterialList length:', materialListData.length);
        console.log('AccessoryTotals length:', accessoryTotalsData.length);
        
        // Ensure all required arrays exist with proper defaults
        const validatedData: CalculationResult = {
          materialList: Array.isArray(materialListData) ? materialListData : [],
          cuttingList: Array.isArray(cuttingListData) ? cuttingListData : [],
          glassList: glassListData && typeof glassListData === 'object' ? glassListData : { sheet_type: '', total_sheets: 0, cuts: [] },
          rubberTotals: Array.isArray(rubberTotalsData) ? rubberTotalsData : [],
          accessoryTotals: Array.isArray(accessoryTotalsData) ? accessoryTotalsData : [],
        };
        
        console.log('Validated calculation data:', validatedData);
        console.log('Profile items count:', validatedData.materialList.filter(item => item.type === 'Profile').length);
        console.log('Accessory items count:', validatedData.accessoryTotals.length);
        setCalculationResult(validatedData);
        hasCalculatedRef.current = true;
        
        // Auto-save project after successful calculation (only once)
        await handleSaveProject();
      } else {
        setError(getApiResponseMessage(response) || 'Calculation failed');
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage.message);
      console.error('Calculation error:', err);
    } finally {
      setIsLoading(false);
      calculationInProgressRef.current = false;
    }
  };

  const handleSaveProject = async () => {
    // Prevent duplicate saves (React StrictMode or multiple calls)
    if (saveInProgressRef.current || hasSavedRef.current || projectSaved) {
      console.log('[ProjectSolutionScreen] Project already saved or save in progress, skipping');
      return;
    }

    if (!previousData?.projectDescription || !previousData?.selectProject || !previousData?.projectMeasurement) {
      return;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Transform frontend data to backend format
      const projectData = createProjectData(
        previousData.projectDescription,
        previousData.selectProject,
        previousData.projectMeasurement
      );

      let response;
      
      // If we have a draft project ID, update it instead of creating a new one
      if (draftProjectId) {
        console.log('[ProjectSolutionScreen] Updating existing draft project:', draftProjectId);
        // Update the existing draft project with full data
        response = await projectsService.update(draftProjectId, {
          glazingDimensions: projectData.glazingDimensions,
          calculationSettings: projectData.calculationSettings,
          status: 'calculated', // Update status from draft to calculated
        });
      } else {
        console.log('[ProjectSolutionScreen] Creating new project (no draft ID)');
        // Create new project (fallback if draft wasn't created)
        response = await projectsService.create({
          projectName: projectData.projectName,
          customer: projectData.customer,
          siteAddress: projectData.siteAddress,
          description: projectData.description,
          glazingDimensions: projectData.glazingDimensions,
          calculationSettings: projectData.calculationSettings,
        });
      }

      // Normalize and check response using API response helpers
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success) {
        setProjectSaved(true);
        hasSavedRef.current = true;
        console.log('[ProjectSolutionScreen] Project saved successfully', draftProjectId ? '(updated)' : '(created)');
        
        // Notify parent that project was saved (so it can clear draftProjectId)
        if (onProjectSaved) {
          onProjectSaved();
        }
        
        // Trigger refresh in parent component if callback exists
        // This will be handled by the parent component's refresh mechanism
      } else {
        setSaveError(normalizedResponse.message || 'Failed to save project');
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      
      // If update failed and we have a draft ID, try creating a new project as fallback
      if (draftProjectId && err?.response?.status !== 404) {
        console.warn('[ProjectSolutionScreen] Update failed, attempting to create new project as fallback');
        try {
          const projectData = createProjectData(
            previousData.projectDescription,
            previousData.selectProject,
            previousData.projectMeasurement
          );
          
          const fallbackResponse = await projectsService.create({
            projectName: projectData.projectName,
            customer: projectData.customer,
            siteAddress: projectData.siteAddress,
            description: projectData.description,
            glazingDimensions: projectData.glazingDimensions,
            calculationSettings: projectData.calculationSettings,
          });
          
          const normalizedFallback = normalizeApiResponse(fallbackResponse);
          if (normalizedFallback.success) {
            setProjectSaved(true);
            hasSavedRef.current = true;
            console.log('[ProjectSolutionScreen] Project created successfully (fallback after update failed)');
            
            // Notify parent that project was saved
            if (onProjectSaved) {
              onProjectSaved();
            }
            
            return; // Success, exit early
          }
        } catch (fallbackErr: any) {
          console.error('[ProjectSolutionScreen] Fallback create also failed:', fallbackErr);
        }
      }
      
      setSaveError(errorMessage.message);
      console.error('Save project error:', err);
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  };

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate item total (quantity * price)
  const getItemTotal = (itemId: string, defaultQuantity: number): number => {
    const quantity = itemQuantities[itemId] ?? defaultQuantity;
    const price = itemPrices[itemId] ?? 0;
    return quantity * price;
  };

  // Export handlers
  const handleExportCuttingList = (format: 'pdf' | 'excel') => {
    if (!calculationResult?.cuttingList || !previousData?.projectDescription) return;
    
    const projectName = previousData.projectDescription.projectName || 'Project';
    
    calculationResult.cuttingList.forEach((cuttingItem) => {
      const stockLengthMeters = cuttingItem.stock_length / 1000;
      const layouts = cuttingItem.plan.map((planEntry) => {
        const cutKeys = Object.keys(planEntry);
        const individualCuts: Array<{ length: number; unit: string }> = [];
        let totalRepetition = 0;
        
        cutKeys.forEach(cutKey => {
          const cutArray = planEntry[cutKey];
          const lengthMatch = cutKey.match(/(\d+)mm/);
          if (lengthMatch) {
            const lengthMm = parseInt(lengthMatch[1]);
            const lengthMeters = lengthMm / 1000;
            const label = `${lengthMeters.toFixed(1)}m`;
            
            for (let i = 0; i < cutArray.length; i++) {
              individualCuts.push({
                length: lengthMeters,
                unit: label
              });
            }
            
            totalRepetition = Math.max(totalRepetition, cutArray.length);
          }
        });
        
        const totalUsed = individualCuts.reduce((sum, cut) => sum + cut.length, 0);
        const offcut = stockLengthMeters - totalUsed;
        
        return {
          layout: String.fromCharCode(65 + cuttingItem.plan.indexOf(planEntry)),
          cuts: individualCuts,
          offcut,
          repetition: totalRepetition,
        };
      });
      
      const totalQuantity = layouts.reduce((sum, layout) => sum + layout.repetition, 0);
      
      if (format === 'pdf') {
        exportCuttingListToPDF(layouts, projectName, stockLengthMeters, totalQuantity);
      } else {
        exportCuttingListToExcel(layouts, projectName, stockLengthMeters, totalQuantity);
      }
    });
    
    setShowExportDropdown(null);
  };

  const handleExportGlassCuttingList = (format: 'pdf' | 'excel') => {
    if (!calculationResult?.glassList || !previousData?.projectDescription) return;
    
    const projectName = previousData.projectDescription.projectName || 'Project';
    const glassList = calculationResult.glassList;
    
    // Parse sheet dimensions
    const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
    const sheetWidth = sheetTypeMatch ? parseInt(sheetTypeMatch[1]) : 0;
    const sheetHeight = sheetTypeMatch ? parseInt(sheetTypeMatch[2]) : 0;
    
    // Create layouts for each sheet
    const layouts = Array.from({ length: glassList.total_sheets }).map((_, index) => ({
      sheetNumber: index + 1,
      sheetType: glassList.sheet_type,
      sheetWidth,
      sheetHeight,
      cuts: glassList.cuts || [],
      totalCuts: glassList.cuts?.reduce((sum, cut) => sum + cut.qty, 0) || 0,
    }));
    
    if (format === 'pdf') {
      exportGlassCuttingListToPDF(layouts, projectName);
    } else {
      exportGlassCuttingListToExcel(layouts, projectName);
    }
    
    setShowExportDropdown(null);
  };

  // Calculate grand total from all items
  const grandTotal = useMemo(() => {
    let total = 0;
    
    // Sum all profile items
    profileItems.forEach(item => {
      total += getItemTotal(item.id, item.quantity);
    });
    
    // Sum all accessory items
    accessoriesItems.forEach(item => {
      total += getItemTotal(item.id, item.quantity);
    });
    
    return total;
  }, [profileItems, accessoriesItems, itemPrices, itemQuantities]);

  // Initialize quantities from items when calculation result changes
  useEffect(() => {
    if (calculationResult) {
      const initialQuantities: Record<string, number> = {};
      
      // Get profile items
      const profiles = calculationResult.materialList
        ? calculationResult.materialList
            .filter(item => item.type === 'Profile')
            .map((item, index) => ({
              id: `profile-${index}`,
              quantity: item.units,
            }))
        : [];
      
      // Get accessory items
      const accessories = calculationResult.accessoryTotals
        ? calculationResult.accessoryTotals.map((item, index) => ({
            id: `accessory-${index}`,
            quantity: item.qty,
          }))
        : [];
      
      profiles.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      
      accessories.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      
      setItemQuantities(prev => ({ ...prev, ...initialQuantities }));
    }
  }, [calculationResult]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>Projects</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600">{previousData?.projectDescription?.projectName || 'Project'}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Calculation Results</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Project Calculation Results</h1>
                <p className="text-sm text-gray-500">{previousData?.projectDescription?.projectName || 'Project'}</p>
              </div>
            </div>

            {/* Action Buttons - Show after calculation completes */}
            {!isLoading && !error && calculationResult && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Debug logging
                    if (import.meta.env.DEV) {
                      console.log('[ProjectSolutionScreen] Generate Quote clicked:', {
                        hasOnCreateQuote: !!onCreateQuote,
                        hasCalculationResult: !!calculationResult,
                        hasProjectMeasurement: !!previousData?.projectMeasurement,
                        calculationResultType: typeof calculationResult,
                        projectMeasurementType: typeof previousData?.projectMeasurement,
                        calculationResultKeys: calculationResult ? Object.keys(calculationResult) : [],
                        projectMeasurementKeys: previousData?.projectMeasurement ? Object.keys(previousData.projectMeasurement) : [],
                        grandTotal
                      });
                    }
                    
                    if (onCreateQuote) {
                      onCreateQuote(grandTotal, calculationResult || undefined, previousData?.projectMeasurement);
                    } else {
                      onGenerate(grandTotal);
                    }
                  }}
                  disabled={isSaving}
                  className="px-6 py-3 font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Quote
                </button>
                <div className="relative export-dropdown-container">
                  <button
                    onClick={() => setShowExportDropdown(showExportDropdown === 'cutting' ? null : 'cutting')}
                    className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <span>Export Cutting List</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {showExportDropdown === 'cutting' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => handleExportCuttingList('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExportCuttingList('excel')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
                      >
                        Export as Excel
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative export-dropdown-container">
                  <button
                    onClick={() => setShowExportDropdown(showExportDropdown === 'glass' ? null : 'glass')}
                    className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <span>Export Glass List</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {showExportDropdown === 'glass' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => handleExportGlassCuttingList('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExportGlassCuttingList('excel')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
                      >
                        Export as Excel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Response Info - Points and Balance */}
      {(pointsDeducted !== null || balanceAfter !== null || responseMessage) && (
        <div className="px-8 pt-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {responseMessage && (
                    <p className="text-blue-800 font-medium mb-2">{responseMessage}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm">
                    {pointsDeducted !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium">Points Deducted:</span>
                        <span className="text-blue-900 font-semibold">{pointsDeducted}</span>
                      </div>
                    )}
                    {balanceAfter !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium">Balance After:</span>
                        <span className="text-blue-900 font-semibold">{balanceAfter}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Status Messages */}
      {(projectSaved || saveError) && (
        <div className="px-8 pt-4">
          <div className="max-w-7xl mx-auto">
            {projectSaved && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-medium">Project saved successfully!</p>
              </div>
            )}
            {saveError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-red-800 font-medium">{saveError}</p>
                <button
                  onClick={() => setSaveError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

              {/* Filter Dropdowns */}
              <div className="ml-auto pb-4 flex items-center gap-4">
                {activeTab === 'material' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter(e.target.value as 'all' | 'Profile' | 'Accessory_Pair')}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="all">All Types</option>
                      <option value="Profile">Profile</option>
                      <option value="Accessory_Pair">Accessory</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 w-48"
                    />
                  </div>
                )}
                {activeTab === 'cutting' && calculationResult?.cuttingList && (
                  <select
                    value={cuttingFilter}
                    onChange={(e) => setCuttingFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="all">All Profiles</option>
                    {calculationResult.cuttingList.map((item, index) => (
                      <option key={index} value={item.profile_name}>{item.profile_name}</option>
                    ))}
                  </select>
                )}
                {activeTab === 'glass' && (
                  <select
                    value={glassFilter}
                    onChange={(e) => setGlassFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="all">All Sheets</option>
                    {calculationResult?.glassList && Array.from({ length: calculationResult.glassList.total_sheets }).map((_, index) => (
                      <option key={index} value={`sheet${index + 1}`}>Sheet {index + 1}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600">Calculating...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={handleCalculate}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Material List Content */}
          {!isLoading && !error && activeTab === 'material' && (
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
                              value={itemQuantities[item.id] ?? item.quantity}
                              readOnly
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 bg-gray-50 cursor-not-allowed"
                            />
                          </div>

                          {/* Price */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price</span>
                            <span className="text-gray-900">:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900">₦</span>
                              <input
                                type="number"
                                placeholder="Enter your price..."
                                value={itemPrices[item.id] || ''}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  setItemPrices(prev => ({ ...prev, [item.id]: newPrice }));
                                }}
                                className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-gray-400"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Total</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-bold">₦{getItemTotal(item.id, item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                              value={itemQuantities[item.id] ?? item.quantity}
                              readOnly
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 bg-gray-50 cursor-not-allowed"
                            />
                          </div>

                          {/* Price */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price</span>
                            <span className="text-gray-900">:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900">₦</span>
                              <input
                                type="number"
                                placeholder="Enter your price..."
                                value={itemPrices[item.id] || ''}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  setItemPrices(prev => ({ ...prev, [item.id]: newPrice }));
                                }}
                                className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-gray-400"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Total</span>
                            <span className="text-gray-900">:</span>
                            <span className="text-gray-900 font-bold">₦{getItemTotal(item.id, item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
          {!isLoading && !error && activeTab === 'cutting' && (
            <div>
              {calculationResult?.cuttingList && calculationResult.cuttingList.length > 0 ? (
                calculationResult.cuttingList
                  .filter((item) => cuttingFilter === 'all' || item.profile_name === cuttingFilter)
                  .map((cuttingItem, profileIndex) => {
                  const stockLengthMeters = cuttingItem.stock_length / 1000; // Convert mm to meters
                  
                  // Parse cutting plans
                  const layouts = cuttingItem.plan.map((planEntry, planIndex) => {
                    // Each plan entry is an object like { "cut_1200mm": ["cut_1200mm", "cut_1200mm", ...] }
                    const cutKeys = Object.keys(planEntry);
                    const individualCuts: Array<{ length: number; label: string }> = [];
                    let totalRepetition = 0;
                    
                    // Extract all individual cuts (one segment per cut)
                    cutKeys.forEach(cutKey => {
                      const cutArray = planEntry[cutKey];
                      // Extract length from key like "cut_1200mm" -> 1200
                      const lengthMatch = cutKey.match(/(\d+)mm/);
                      if (lengthMatch) {
                        const lengthMm = parseInt(lengthMatch[1]);
                        const lengthMeters = lengthMm / 1000;
                        const label = `${lengthMeters.toFixed(1)}m`;
                        
                        // Add one segment for each cut in the array
                        for (let i = 0; i < cutArray.length; i++) {
                          individualCuts.push({
                            length: lengthMeters,
                            label: label
                          });
                        }
                        
                        totalRepetition = Math.max(totalRepetition, cutArray.length);
                      }
                    });
                    
                    // Calculate total used length and offcut
                    const totalUsed = individualCuts.reduce((sum, cut) => sum + cut.length, 0);
                    const offcut = stockLengthMeters - totalUsed;
                    
                    return {
                      cuts: individualCuts,
                      offcut,
                      repetition: totalRepetition,
                      totalUsed,
                      stockLength: stockLengthMeters
                    };
                  });
                  
                  // Calculate total quantity needed
                  const totalQuantity = layouts.reduce((sum, layout) => sum + layout.repetition, 0);
                  
                  return (
                    <div key={profileIndex} className="mb-8">
                      {/* Profile Header */}
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">{cuttingItem.profile_name}</h3>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-500">Material Length: </span>
                              <span className="font-medium text-gray-900">{stockLengthMeters.toFixed(1)} meters</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Quantity: </span>
                              <span className="font-medium text-gray-900">{totalQuantity} length</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Layouts Grid - Always 2 columns per row (left-to-right flow) */}
                      <div className="grid grid-cols-2 gap-6">
                        {layouts.map((layout, layoutIndex) => {
                          const layoutLetter = String.fromCharCode(65 + layoutIndex); // A, B, C, etc.
                          const totalCutsWidth = layout.cuts.reduce((sum, cut) => sum + (cut.length / layout.stockLength * 100), 0);
                          
                          return (
                            <div key={layoutIndex} className="bg-white border border-gray-200 rounded-lg p-6">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <span className="text-xs text-gray-500 uppercase block mb-1">Layout</span>
                                  <span className="text-lg font-medium text-gray-900">{layoutLetter}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-gray-500 uppercase block mb-1">Repetition</span>
                                  <span className="text-lg font-medium text-gray-900">{layout.repetition}X</span>
                                </div>
                              </div>

                              {/* Visual Bar - Cuts fill left to right, offcut always on right */}
                              <div className="flex h-12 mb-2">
                                {/* All cuts displayed as individual segments from left */}
                                {layout.cuts.map((cut, cutIndex) => {
                                  const widthPercent = (cut.length / layout.stockLength) * 100;
                                  const isLastCut = cutIndex === layout.cuts.length - 1;
                                  
                                  return (
                                    <div 
                                      key={cutIndex}
                                      className="h-full bg-[#6B9EB6] flex items-center justify-center text-xs font-medium text-gray-900"
                                      style={{ 
                                        width: `${widthPercent}%`,
                                        borderRight: !isLastCut || layout.offcut > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                      }}
                                    >
                                      {cut.label}
                                    </div>
                                  );
                                })}
                                
                                {/* Offcut section - always on the right */}
                                {layout.offcut > 0 && (
                                  <div 
                                    className="h-full bg-gray-100 flex items-center justify-center relative" 
                                    style={{ 
                                      width: `${(layout.offcut / layout.stockLength) * 100}%`,
                                      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                                      backgroundSize: '4px 4px'
                                    }}
                                  >
                                    <div className="absolute inset-0 border-l border-gray-300"></div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <span className="text-xs text-gray-500">Off-cut: </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {layout.offcut > 0 ? `${layout.offcut.toFixed(2)}m` : '0m'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No cutting list data available</p>
                </div>
              )}
            </div>
          )}



          {/* Glass Cutting List Content */}
          {!isLoading && !error && activeTab === 'glass' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-6">Glass Cutting Layout</h3>

              {calculationResult?.glassList && calculationResult.glassList.total_sheets > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel - Grid Area */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 min-h-[500px] relative flex flex-col items-center justify-center">
                    {/* Grid Background */}
                    <div className="absolute inset-0 m-4 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#E2E8F0 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

                    {(() => {
                      const glassList = calculationResult.glassList;
                      const currentSheetIndex = selectedSheet ? parseInt(selectedSheet.replace('sheet', '')) - 1 : 0;
                      const currentSheet = currentSheetIndex + 1;
                      
                      // Parse sheet dimensions from sheet_type (e.g., "3310x2140mm")
                      const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
                      const sheetWidth = sheetTypeMatch ? parseInt(sheetTypeMatch[1]) : 0;
                      const sheetHeight = sheetTypeMatch ? parseInt(sheetTypeMatch[2]) : 0;
                      
                      // Calculate layout for cuts
                      const cuts = glassList.cuts || [];
                      const totalCuts = cuts.reduce((sum, cut) => sum + cut.qty, 0);
                      
                      // Use the first cut type for visualization (API provides cuts with same dimensions)
                      const primaryCut = cuts.length > 0 ? cuts[0] : null;
                      
                      if (!primaryCut) {
                        return (
                          <div className="relative z-10 text-center text-gray-500">
                            <p>No cuts data available</p>
                          </div>
                        );
                      }
                      
                      // Calculate how many cuts fit horizontally and vertically
                      const cutsPerRow = Math.floor(sheetWidth / primaryCut.w);
                      const cutsPerCol = Math.floor(sheetHeight / primaryCut.h);
                      const maxCutsPerSheet = cutsPerRow * cutsPerCol;
                      
                      // Calculate dimensions as percentages for visualization
                      const cutWidthPercent = (primaryCut.w / sheetWidth) * 100;
                      const cutHeightPercent = (primaryCut.h / sheetHeight) * 100;
                      
                      // Calculate waste/offcut areas
                      const usedWidth = cutsPerRow * primaryCut.w;
                      const usedHeight = cutsPerCol * primaryCut.h;
                      const wasteWidth = sheetWidth - usedWidth;
                      const wasteHeight = sheetHeight - usedHeight;
                      
                      if (!selectedSheet && glassList.total_sheets > 0) {
                        // Default state - show tooltip
                        return (
                          <div className="relative z-10 bg-[#4A8B9F] text-white px-4 py-3 rounded shadow-lg text-center">
                            <p className="text-xs font-medium">Select a sheet</p>
                            <p className="text-xs">to view layout</p>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#4A8B9F] rotate-45"></div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="relative z-10 w-full max-w-2xl">
                          {/* Sheet Badge */}
                          <div className="flex justify-center mb-4">
                            <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                              Sheet {currentSheet}
                            </span>
                          </div>

                          {/* Layout Diagram - Structured layout: cuts fill left, waste fills remaining space with 2px visual gaps */}
                          <div 
                            className="border-2 border-gray-400 bg-gray-200 p-0.5 flex"
                            style={{ 
                              aspectRatio: `${sheetWidth}/${sheetHeight}`,
                              maxWidth: '100%'
                            }}
                          >
                            {/* Left Section: Cuts + Bottom Waste */}
                            <div 
                              className="flex flex-col"
                              style={{ 
                                width: `${(usedWidth / sheetWidth) * 100}%`
                              }}
                            >
                              {/* Cuts Grid Area */}
                              <div 
                                className="flex flex-col"
                                style={{ 
                                  height: `${(usedHeight / sheetHeight) * 100}%`
                                }}
                              >
                                {/* Render cuts in rows with 2px visual gaps (using background to show gaps) */}
                                {Array.from({ length: Math.min(cutsPerCol, Math.ceil(totalCuts / cutsPerRow)) }).map((_, rowIndex) => (
                                  <div 
                                    key={rowIndex} 
                                    className="flex"
                                    style={{ 
                                      height: `${(primaryCut.h / sheetHeight) * 100}%`,
                                      marginBottom: rowIndex < Math.min(cutsPerCol, Math.ceil(totalCuts / cutsPerRow)) - 1 ? '2px' : '0'
                                    }}
                                  >
                                    {Array.from({ length: cutsPerRow }).map((_, colIndex) => {
                                      const cutIndex = rowIndex * cutsPerRow + colIndex;
                                      if (cutIndex >= Math.min(totalCuts, maxCutsPerSheet)) return null;
                                      
                                      return (
                                        <div
                                          key={colIndex}
                                          className="bg-[#C8DEE5] relative"
                                          style={{
                                            width: `${(primaryCut.w / usedWidth) * 100}%`,
                                            height: '100%',
                                            marginRight: colIndex < cutsPerRow - 1 ? '2px' : '0',
                                            border: '1px solid #4B5563' // Border for cut definition
                                          }}
                                        >
                                          <span className="absolute top-1 left-1 text-xs font-medium">{primaryCut.w}</span>
                                          <span className="absolute bottom-1 left-1 text-xs font-medium">{primaryCut.h}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Bottom Waste/Offcut - Takes remaining height after cuts (fills remaining vertical space) */}
                              {wasteHeight > 0 && (
                                <div 
                                  className="bg-gray-300 relative flex items-center justify-center"
                                  style={{ 
                                    width: '100%',
                                    height: `${(wasteHeight / sheetHeight) * 100}%`,
                                    marginTop: '2px', // 2px visual gap from cuts
                                    border: '1px solid #4B5563',
                                    borderTop: '2px solid #4B5563' // Thicker top border for visual separation
                                  }}
                                >
                                  <span className="absolute left-2 text-xs font-medium">{wasteHeight}</span>
                                  <span className="absolute bottom-1 text-xs font-medium">{usedWidth}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Right Waste/Offcut - Takes remaining width after cuts (fills remaining horizontal space), spans full height */}
                            {wasteWidth > 0 && (
                              <div 
                                className="bg-gray-300 relative flex flex-col items-center justify-center"
                                style={{ 
                                  width: `${(wasteWidth / sheetWidth) * 100}%`,
                                  height: '100%',
                                  marginLeft: '2px', // 2px visual gap from cuts area
                                  border: '1px solid #4B5563',
                                  borderLeft: '2px solid #4B5563' // Thicker left border for visual separation
                                }}
                              >
                                <span className="absolute top-2 text-xs font-medium">{wasteWidth}</span>
                                <span className="absolute -rotate-90 text-xs font-medium">{sheetHeight}</span>
                              </div>
                            )}
                          </div>

                          {/* Pagination */}
                          {glassList.total_sheets > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                              <button
                                onClick={() => {
                                  if (currentSheetIndex > 0) {
                                    setSelectedSheet(`sheet${currentSheetIndex}`);
                                  }
                                }}
                                disabled={currentSheetIndex === 0}
                                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <span className="text-sm font-medium text-gray-900">
                                {currentSheet}/{glassList.total_sheets}
                              </span>
                              <button
                                onClick={() => {
                                  if (currentSheetIndex < glassList.total_sheets - 1) {
                                    setSelectedSheet(`sheet${currentSheetIndex + 2}`);
                                  }
                                }}
                                disabled={currentSheetIndex >= glassList.total_sheets - 1}
                                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Panel - Sheet List */}
                  <div className="space-y-4">
                    {Array.from({ length: calculationResult.glassList.total_sheets }).map((_, index) => {
                      const sheetNumber = index + 1;
                      const sheetId = `sheet${sheetNumber}`;
                      const glassList = calculationResult.glassList;
                      
                      // Parse sheet dimensions
                      const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
                      const sheetWidth = sheetTypeMatch ? parseInt(sheetTypeMatch[1]) : 0;
                      const sheetHeight = sheetTypeMatch ? parseInt(sheetTypeMatch[2]) : 0;
                      
                      // Calculate total quantity of cuts for this sheet
                      const totalCuts = glassList.cuts?.reduce((sum, cut) => sum + cut.qty, 0) || 0;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSheet(sheetId)}
                          className={`w-full text-left border rounded-lg p-6 transition-colors ${selectedSheet === sheetId
                            ? 'bg-[#EBF5F8] border-[#EBF5F8] ring-1 ring-blue-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                        >
                          <h4 className="text-sm text-gray-500 mb-2">Sheet {sheetNumber}</h4>
                          <p className="text-lg font-medium text-gray-900 mb-4">
                            {sheetWidth} X {sheetHeight}
                          </p>
                          <div className={`border-t border-dashed pt-4 ${selectedSheet === sheetId ? 'border-blue-200' : 'border-gray-200'}`}>
                            <p className="text-xs text-gray-500 mb-1">Quantity</p>
                            <p className="text-base font-medium text-gray-900">{totalCuts} pcs</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No glass cutting data available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer with Grand Total - Show on all tabs */}
      {!isLoading && !error && calculationResult && (
        <div className="border-t border-gray-200 bg-white px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Grand Total</span>
              <span className="text-2xl font-bold text-gray-900">₦{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSolutionScreen;
