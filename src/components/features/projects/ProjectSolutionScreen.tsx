import React, { useState, useEffect, useMemo, useRef } from 'react';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import type { ProjectDescriptionData, SelectProjectData, ProjectMeasurementData, DimensionItem } from '@/types';
import type { CalculationResult, MaterialListItem, CuttingListItem, RubberTotal, AccessoryTotal, GlazingElement, CuttingPlanPiece } from '@/types/calculations';
import GlassCuttingNest from '@/components/features/projects/GlassCuttingNest';
import {
  normalizeGlassListResult,
  hasUsableGlassLayouts,
  layoutIndexForPhysicalSheet,
  pieceCountOnLayout,
} from '@/utils/glassLayout';
import {
  exportMaterialListToPDF,
  exportCuttingListToPDF,
  exportMaterialListToExcel,
  exportCuttingListToExcel,
  exportGlassCuttingListToPDF,
  exportGlassCuttingListToExcel,
  exportGlassCuttingListToCSV,
  shareData
} from '@/services/export/exportService';
import { projectsService } from '@/services/api';
import { createProjectData } from '@/utils/dataTransformers';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData, getApiResponseMessage } from '@/utils/apiResponseHelper';

/** True if the plan key or cut label denotes offcut/waste (should use checker style, not colored). */
function isOffcutKey(cutKey: string): boolean {
  const k = cutKey.toLowerCase();
  return k.startsWith('offcut_') || k.startsWith('waste_');
}

/** Normalize cutting plan entry to a list of cuts (supports legacy string[] and new CuttingPlanPiece[] with elementId).
 * Backend may include offcut as a key (e.g. offcut_5492mm); we skip those so offcut is computed as
 * stockLength - sum(real cuts) to avoid mm rounding errors. */
function normalizePlanEntryToCuts(planEntry: { [key: string]: string[] | CuttingPlanPiece[] }): Array<{ length: number; label: string; elementId?: string; isOffcut?: boolean }> {
  const result: Array<{ length: number; label: string; elementId?: string; isOffcut?: boolean }> = [];
  Object.keys(planEntry).forEach((cutKey) => {
    if (isOffcutKey(cutKey)) return; // Exclude backend offcut; we compute offcut = stockLength - total cuts
    const raw = planEntry[cutKey];
    const lengthMatch = cutKey.match(/(\d+)mm/);
    const lengthMm = lengthMatch ? parseInt(lengthMatch[1], 10) : 0;
    const lengthMeters = lengthMm / 1000;
    const label = lengthMeters ? `${lengthMeters.toFixed(1)}m` : cutKey;
    if (!Array.isArray(raw) || raw.length === 0) return;
    const isNewFormat = typeof raw[0] === 'object' && raw[0] !== null && 'cut' in (raw[0] as object);
    if (isNewFormat) {
      (raw as CuttingPlanPiece[]).forEach((piece) => {
        result.push({ length: lengthMeters, label, elementId: piece.elementId, isOffcut: false });
      });
    } else {
      (raw as string[]).forEach(() => {
        result.push({ length: lengthMeters, label, isOffcut: false });
      });
    }
  });
  return result;
}

function getMaxRepetition(planEntry: { [key: string]: string[] | CuttingPlanPiece[] }): number {
  return Math.max(0, ...Object.values(planEntry).map((arr) => (Array.isArray(arr) ? arr.length : 0)));
}

interface ProjectSolutionScreenProps {
  onBack: () => void;
  onGenerate: (materialCost: number) => void;
  onNavigateToStep?: (step: string) => void;
  previousData?: {
    projectDescription?: ProjectDescriptionData;
    selectProject?: SelectProjectData;
    projectMeasurement?: ProjectMeasurementData;
  };
  initialTab?: 'material' | 'cutting' | 'glass';
  initialCalculationResult?: CalculationResult | null;
  draftProjectId?: number | null;
  onCreateQuote?: (materialCost?: number, calculationResult?: CalculationResult, projectMeasurement?: ProjectMeasurementData) => void;
  onProjectSaved?: () => void;
  /** Called when calculation completes so parent can cache the result for "Return to Calculation Results" */
  onCalculationComplete?: (result: CalculationResult) => void;
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const ProjectSolutionScreen: React.FC<ProjectSolutionScreenProps> = ({ onBack, onGenerate, onNavigateToStep, previousData, initialTab = 'material', initialCalculationResult, draftProjectId, onCreateQuote, onProjectSaved, onCalculationComplete }) => {
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
  const [cuttingElementFilter, setCuttingElementFilter] = useState<string>('all');
  const [glassFilter, setGlassFilter] = useState<string>('all');
  const [glassElementFilter, setGlassElementFilter] = useState<string>('all');
  
  // Export dropdown states
  const [showExportDropdown, setShowExportDropdown] = useState<'cutting' | 'glass' | null>(null);
  /** Mobile: filters panel open (All Profiles / All elements behind a button) */
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  /** Cutting list: full-screen expanded card { profileIndex (in filtered list), layoutIndex } */
  const [expandedCuttingCard, setExpandedCuttingCard] = useState<{ profileIndex: number; layoutIndex: number } | null>(null);
  
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

  // Auto-dismiss calculation success (points/balance) notification after 5 seconds
  const showCalculationNotification = pointsDeducted !== null || balanceAfter !== null || responseMessage;
  useEffect(() => {
    if (!showCalculationNotification) return;
    const t = window.setTimeout(() => {
      setPointsDeducted(null);
      setBalanceAfter(null);
      setResponseMessage(null);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [showCalculationNotification, pointsDeducted, balanceAfter, responseMessage]);

  // Auto-dismiss "Project saved successfully!" notification after 5 seconds
  useEffect(() => {
    if (!projectSaved) return;
    const t = window.setTimeout(() => setProjectSaved(false), 5000);
    return () => window.clearTimeout(t);
  }, [projectSaved]);

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

  const elementsMap = useMemo(() => {
    const map: Record<string, GlazingElement> = {};
    (calculationResult?.elements || []).forEach((el) => { map[el.id] = el; });
    return map;
  }, [calculationResult?.elements]);

  const glassListNorm = useMemo(
    () => (calculationResult ? normalizeGlassListResult(calculationResult.glassList) : null),
    [calculationResult]
  );

  /** True if this cutting item has at least one piece with the given elementId. */
  const cuttingItemHasElement = useMemo(() => {
    return (cuttingItem: CuttingListItem, elementId: string): boolean => {
      for (const planEntry of cuttingItem.plan) {
        for (const raw of Object.values(planEntry)) {
          if (!Array.isArray(raw) || raw.length === 0) continue;
          const isNewFormat = typeof raw[0] === 'object' && raw[0] !== null && 'cut' in (raw[0] as object);
          if (isNewFormat) {
            if ((raw as CuttingPlanPiece[]).some((p) => p.elementId === elementId)) return true;
          }
        }
      }
      return false;
    };
  }, []);

  const filteredCuttingList = useMemo(() => {
    if (!calculationResult?.cuttingList) return [];
    return calculationResult.cuttingList
      .filter((item) => cuttingFilter === 'all' || item.profile_name === cuttingFilter)
      .filter((item) => cuttingElementFilter === 'all' || cuttingItemHasElement(item, cuttingElementFilter));
  }, [calculationResult?.cuttingList, cuttingFilter, cuttingElementFilter, cuttingItemHasElement]);

  // Load calculation on mount: use initial result (View results) or run calculate
  useEffect(() => {
    if (initialCalculationResult && Array.isArray(initialCalculationResult.materialList)) {
      setCalculationResult({
        ...initialCalculationResult,
        glassList: normalizeGlassListResult(initialCalculationResult.glassList),
      });
      hasCalculatedRef.current = true;
      const gl = normalizeGlassListResult(initialCalculationResult.glassList);
      if (gl.total_sheets > 0) {
        setSelectedSheet('sheet1');
        setGlassFilter('sheet1');
      }
      return;
    }
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

      // Step 1: Create or update project with glazingDimensions so the backend has them stored
      let projectId: number;
      if (draftProjectId) {
        await projectsService.update(draftProjectId, {
          glazingDimensions: projectData.glazingDimensions,
          calculationSettings: projectData.calculationSettings,
          status: 'calculated',
        });
        projectId = draftProjectId; // Use the ID we already have
      } else {
        const createResponse = await projectsService.create({
          projectName: projectData.projectName,
          customer: projectData.customer,
          siteAddress: projectData.siteAddress,
          description: projectData.description,
          glazingDimensions: projectData.glazingDimensions,
          calculationSettings: projectData.calculationSettings,
        });
        const responseData = getApiResponseData(createResponse) as { project?: { id: number }; id?: number };
        projectId = responseData?.project?.id ?? responseData?.id ?? 0;
        if (!projectId) {
          setError('Could not get project ID from create response');
          return;
        }
      }

      // Step 2: Call project calculate (uses stored glazingDimensions; results are saved on the project)
      const calcResponse = await projectsService.calculate(projectId);
      const calcData = getApiResponseData(calcResponse) as {
        calculationResult: { result: Record<string, unknown> };
        pointsDeducted?: number;
        balanceAfter?: number;
      };

      const calculationData = calcData?.calculationResult?.result;
      const points = calcData?.pointsDeducted ?? null;
      const balance = calcData?.balanceAfter ?? null;
      const message = getApiResponseMessage(calcResponse) || null;

      setPointsDeducted(points);
      setBalanceAfter(balance);
      setResponseMessage(message);

      if (!calculationData || typeof calculationData !== 'object') {
        setError('Invalid calculation response: No result data received');
        console.error('Missing result in response:', calcData);
        return;
      }

      // Extract calculation result fields (API uses camelCase)
      const materialListData = (calculationData as any).materialList || [];
      const cuttingListData = (calculationData as any).cuttingList || [];
      const glassListData = (calculationData as any).glassList || { sheet_type: '', total_sheets: 0, cuts: [] };
      const rubberTotalsData = (calculationData as any).rubberTotals || [];
      const accessoryTotalsData = (calculationData as any).accessoryTotals || [];
      const elementsData = (calculationData as any).elements || [];

      const validatedData: CalculationResult = {
        materialList: Array.isArray(materialListData) ? materialListData : [],
        cuttingList: Array.isArray(cuttingListData) ? cuttingListData : [],
        glassList: normalizeGlassListResult(
          glassListData && typeof glassListData === 'object' ? glassListData : { sheet_type: '', total_sheets: 0, cuts: [] }
        ),
        rubberTotals: Array.isArray(rubberTotalsData) ? rubberTotalsData : [],
        accessoryTotals: Array.isArray(accessoryTotalsData) ? accessoryTotalsData : [],
        elements: Array.isArray(elementsData) ? elementsData : [],
      };

      setCalculationResult(validatedData);
      if (validatedData.glassList.total_sheets > 0) {
        setSelectedSheet('sheet1');
        setGlassFilter('sheet1');
      }
      hasCalculatedRef.current = true;
      setProjectSaved(true);
      hasSavedRef.current = true;

      onCalculationComplete?.(validatedData);
      if (onProjectSaved) {
        onProjectSaved();
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

  // Export handlers — one PDF/Excel with all profiles (Cutting List) or all layouts (Glass List)
  const handleExportCuttingList = (format: 'pdf' | 'excel') => {
    if (!calculationResult?.cuttingList || !previousData?.projectDescription) return;
    
    const projectName = previousData.projectDescription.projectName || 'Project';
    const elMap: Record<string, GlazingElement> = {};
    (calculationResult.elements || []).forEach((el) => { elMap[el.id] = el; });
    
    const sections = calculationResult.cuttingList.map((cuttingItem) => {
      const stockLengthMeters = cuttingItem.stock_length / 1000;
      const layouts = cuttingItem.plan.map((planEntry, planIndex) => {
        const individualCuts = normalizePlanEntryToCuts(planEntry);
        const totalRepetition = getMaxRepetition(planEntry);
        const totalUsed = individualCuts.reduce((sum, cut) => sum + cut.length, 0);
        const offcut = stockLengthMeters - totalUsed;
        return {
          layout: String.fromCharCode(65 + planIndex),
          cuts: individualCuts.map((c) => ({
            length: c.length,
            unit: c.label,
            elementTitle: c.elementId ? elMap[c.elementId]?.title : undefined,
            elementColor: c.elementId ? elMap[c.elementId]?.color : undefined,
          })),
          offCut: offcut,
          repetition: totalRepetition,
          stockLength: stockLengthMeters,
        };
      });
      
      const totalQuantity = layouts.reduce((sum, layout) => sum + layout.repetition, 0);
      
      return {
        profileName: cuttingItem.profile_name,
        materialLength: stockLengthMeters,
        totalQuantity,
        layouts,
      };
    });
    
    if (format === 'pdf') {
      exportCuttingListToPDF(sections, projectName);
    } else {
      exportCuttingListToExcel(sections, projectName);
    }
    
    setShowExportDropdown(null);
  };

  const handleExportGlassCuttingList = (format: 'pdf' | 'excel' | 'csv') => {
    if (!glassListNorm || !previousData?.projectDescription) return;

    const projectName = previousData.projectDescription.projectName || 'Project';
    const glassList = glassListNorm;
    const elMap: Record<string, GlazingElement> = {};
    (calculationResult?.elements || []).forEach((el) => { elMap[el.id] = el; });

    const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
    const fallbackW = sheetTypeMatch ? parseInt(sheetTypeMatch[1], 10) : 0;
    const fallbackH = sheetTypeMatch ? parseInt(sheetTypeMatch[2], 10) : 0;

    const cutsWithTitle = (glassList.cuts || []).map((c) => ({
      w: c.w,
      h: c.h,
      qty: c.qty,
      elementId: c.elementId,
      elementTitle: c.elementId ? elMap[c.elementId]?.title : undefined,
    }));

    const totalPhysical = Math.max(0, glassList.total_sheets);
    const layouts = Array.from({ length: totalPhysical }, (_, index) => {
      const useNest = hasUsableGlassLayouts(glassList) && glassList.layouts;
      if (useNest && glassList.layouts) {
        const li = layoutIndexForPhysicalSheet(glassList.layouts, index);
        const pattern = glassList.layouts[li];
        const piecesOnSheet = pieceCountOnLayout(pattern);
        return {
          sheetNumber: index + 1,
          sheetType: glassList.sheet_type,
          sheetWidth: pattern.stock.widthMm || fallbackW,
          sheetHeight: pattern.stock.heightMm || fallbackH,
          cuts: cutsWithTitle,
          totalCuts: piecesOnSheet,
          layoutId: pattern.layoutId,
          placements: pattern.placements.map((p) => ({
            ...p,
            fillHex:
              p.kind === 'waste'
                ? '#D1D5DB'
                : (p.elementId && elMap[p.elementId]?.color) ?? '#C8DEE5',
            elementTitle: p.elementId ? elMap[p.elementId]?.title : undefined,
          })),
        };
      }
      return {
        sheetNumber: index + 1,
        sheetType: glassList.sheet_type,
        sheetWidth: fallbackW,
        sheetHeight: fallbackH,
        cuts: cutsWithTitle,
        totalCuts: glassList.cuts?.reduce((sum, cut) => sum + cut.qty, 0) || 0,
      };
    });

    if (format === 'pdf') {
      exportGlassCuttingListToPDF(layouts, projectName);
    } else if (format === 'csv') {
      exportGlassCuttingListToCSV(layouts, projectName);
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
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Mobile only: headline row = Back + "Projects" */}
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
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => { if (onNavigateToStep) onNavigateToStep('projectDescription'); else onBack(); }}>Project Description</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => { if (onNavigateToStep) onNavigateToStep('selectProject'); else onBack(); }}>Glazing Category</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => { if (onNavigateToStep) onNavigateToStep('projectMeasurement'); else onBack(); }}>Glazing Type</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Calculation Results</span>
          </div>
          </div>

          {/* Project info bar: back + progress (4 of 4) + title + subtitle (back hidden on mobile) */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <button onClick={onBack} className="hidden md:block text-gray-600 hover:text-gray-900 mt-1 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Progress Circle - 4 of 4 */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="22" stroke="#E5E7EB" strokeWidth="2" fill="none" />
                  <circle cx="24" cy="24" r="22" stroke="#1F2937" strokeWidth="2" fill="none" strokeDasharray="138" strokeDashoffset="0" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600">4 of 4</div>
              </div>

              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">Project Calculation Results</h1>
                <p className="text-sm text-gray-500">{previousData?.projectDescription?.projectName || 'Project'}</p>
              </div>
            </div>

            {/* Action Buttons (desktop only) - Show after calculation; one button per active tab */}
            {!isLoading && !error && calculationResult && (
              <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                {activeTab === 'material' && (
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
                  className="px-6 py-3 font-semibold rounded transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Quote
                </button>
                )}
                {activeTab === 'cutting' && (
                <div className="relative export-dropdown-container">
                  <button
                    onClick={() => setShowExportDropdown(showExportDropdown === 'cutting' ? null : 'cutting')}
                    className="flex items-center gap-2 px-6 py-3 font-semibold rounded transition-colors bg-gray-900 text-white hover:bg-gray-800"
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
                )}
                {activeTab === 'glass' && (
                <div className="relative export-dropdown-container">
                  <button
                    onClick={() => setShowExportDropdown(showExportDropdown === 'glass' ? null : 'glass')}
                    className="flex items-center gap-2 px-6 py-3 font-semibold rounded transition-colors bg-gray-900 text-white hover:bg-gray-800"
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
                        onClick={() => handleExportGlassCuttingList('csv')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExportGlassCuttingList('excel')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
                      >
                        Export as Excel
                      </button>
                    </div>
                  )}
                </div>
                )}
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

      {/* Main Content - pb for mobile fixed action bar */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 pb-24 md:pb-8">
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

              {/* Filter Dropdowns - desktop: inline; mobile: behind Filters button */}
              <div className="ml-auto pb-4 hidden md:flex items-center gap-4">
                {activeTab === 'material' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter(e.target.value as 'all' | 'Profile' | 'Accessory_Pair')}
                      className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                      className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 w-48"
                    />
                  </div>
                )}
                {activeTab === 'cutting' && calculationResult?.cuttingList && (
                  <>
                    <select
                      value={cuttingFilter}
                      onChange={(e) => setCuttingFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="all">All Profiles</option>
                      {calculationResult.cuttingList.map((item, index) => (
                        <option key={index} value={item.profile_name}>{item.profile_name}</option>
                      ))}
                    </select>
                    {calculationResult.elements && calculationResult.elements.length > 0 && (
                      <select
                        value={cuttingElementFilter}
                        onChange={(e) => setCuttingElementFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="all">All elements</option>
                        {calculationResult.elements.map((el) => (
                          <option key={el.id} value={el.id}>{el.title}</option>
                        ))}
                      </select>
                    )}
                  </>
                )}
                {activeTab === 'glass' && (
                  <>
                    <select
                      value={glassFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGlassFilter(v);
                        if (v === 'all') setSelectedSheet(null);
                        else setSelectedSheet(v);
                      }}
                      className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="all">All Sheets</option>
                      {glassListNorm && Array.from({ length: glassListNorm.total_sheets }).map((_, index) => (
                        <option key={index} value={`sheet${index + 1}`}>Sheet {index + 1}</option>
                      ))}
                    </select>
                    {calculationResult?.elements && calculationResult.elements.length > 0 && (
                      <select
                        value={glassElementFilter}
                        onChange={(e) => setGlassElementFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="all">All elements</option>
                        {calculationResult.elements.map((el) => (
                          <option key={el.id} value={el.id}>{el.title}</option>
                        ))}
                      </select>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Mobile: Filters button - below nav tabs */}
            <div className="md:hidden pt-3 pb-2">
              <button
                type="button"
                onClick={() => setShowMobileFilters((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                aria-expanded={showMobileFilters}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>
            {/* Mobile: collapsible filter panel */}
            {showMobileFilters && (
              <div className="md:hidden py-4 px-2 space-y-4 border-b border-gray-100">
                {activeTab === 'material' && (
                  <div className="flex flex-col gap-2">
                    <select
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter(e.target.value as 'all' | 'Profile' | 'Accessory_Pair')}
                      className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
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
                      className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
                    />
                  </div>
                )}
                {activeTab === 'cutting' && calculationResult?.cuttingList && (
                  <div className="flex flex-col gap-2">
                    <select
                      value={cuttingFilter}
                      onChange={(e) => setCuttingFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
                    >
                      <option value="all">All Profiles</option>
                      {calculationResult.cuttingList.map((item, index) => (
                        <option key={index} value={item.profile_name}>{item.profile_name}</option>
                      ))}
                    </select>
                    {calculationResult.elements && calculationResult.elements.length > 0 && (
                      <select
                        value={cuttingElementFilter}
                        onChange={(e) => setCuttingElementFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
                      >
                        <option value="all">All elements</option>
                        {calculationResult.elements.map((el) => (
                          <option key={el.id} value={el.id}>{el.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {activeTab === 'glass' && (
                  <div className="flex flex-col gap-2">
                    <select
                      value={glassFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGlassFilter(v);
                        if (v === 'all') setSelectedSheet(null);
                        else setSelectedSheet(v);
                      }}
                      className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
                    >
                      <option value="all">All Sheets</option>
                      {glassListNorm && Array.from({ length: glassListNorm.total_sheets }).map((_, index) => (
                        <option key={index} value={`sheet${index + 1}`}>Sheet {index + 1}</option>
                      ))}
                    </select>
                    {calculationResult?.elements && calculationResult.elements.length > 0 && (
                      <select
                        value={glassElementFilter}
                        onChange={(e) => setGlassElementFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white w-full"
                      >
                        <option value="all">All elements</option>
                        {calculationResult.elements.map((el) => (
                          <option key={el.id} value={el.id}>{el.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
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
              {filteredCuttingList.length > 0 ? (
                filteredCuttingList.map((cuttingItem, profileIndex) => {
                  const stockLengthMeters = cuttingItem.stock_length / 1000; // Convert mm to meters
                  
                  // Parse cutting plans (supports legacy string[] and new CuttingPlanPiece[] with elementId)
                  const layouts = cuttingItem.plan.map((planEntry) => {
                    const individualCuts = normalizePlanEntryToCuts(planEntry);
                    const totalRepetition = getMaxRepetition(planEntry);
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

                      {/* Layouts Grid - one per row on mobile, 2 columns on desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {layouts.map((layout, layoutIndex) => {
                          const layoutLetter = String.fromCharCode(65 + layoutIndex); // A, B, C, etc.
                          const totalCutsWidth = layout.cuts.reduce((sum, cut) => sum + (cut.length / layout.stockLength * 100), 0);
                          
                          return (
                            <button
                              key={layoutIndex}
                              type="button"
                              onClick={() => setExpandedCuttingCard({ profileIndex, layoutIndex })}
                              className="w-full text-left bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 cursor-pointer"
                            >
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

                              {/* Visual Bar - Cuts fill left to right, offcut always on right; visible dividing lines */}
                              <div className="flex h-12 mb-2">
                                {/* All cuts displayed as individual segments from left */}
                                {layout.cuts.map((cut, cutIndex) => {
                                  const widthPercent = (cut.length / layout.stockLength) * 100;
                                  const showRightBorder = cutIndex < layout.cuts.length - 1 || layout.offcut > 0;
                                  const isOffcut = cut.isOffcut === true;
                                  const element = cut.elementId ? elementsMap[cut.elementId] : undefined;
                                  const titleAttr = element ? `${cut.label} — ${element.title}` : cut.label;
                                  return (
                                    <div
                                      key={cutIndex}
                                      className={`h-full flex items-center justify-center text-xs font-medium ${isOffcut ? 'text-gray-600' : 'text-gray-900'}`}
                                      style={{
                                        width: `${widthPercent}%`,
                                        borderRight: showRightBorder ? '2px solid rgba(0,0,0,0.2)' : undefined,
                                        ...(isOffcut
                                          ? {
                                              backgroundColor: 'transparent',
                                              backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                                              backgroundSize: '4px 4px',
                                            }
                                          : {
                                              backgroundColor: element?.color ?? '#6B9EB6',
                                            }),
                                      }}
                                      title={isOffcut ? `Off-cut: ${cut.label}` : titleAttr}
                                    >
                                      {cut.label}
                                    </div>
                                  );
                                })}
                                
                                {/* Offcut section - always on the right */}
                                {layout.offcut > 0 && (
                                  <div 
                                    className="h-full bg-gray-100 flex items-center justify-center relative border-l-2 border-gray-300" 
                                    style={{ 
                                      width: `${(layout.offcut / layout.stockLength) * 100}%`,
                                      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                                      backgroundSize: '4px 4px'
                                    }}
                                  />
                                )}
                              </div>
                              
                              <div className="text-right">
                                <span className="text-xs text-gray-500">Off-cut: </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {layout.offcut > 0 ? `${layout.offcut.toFixed(2)}m` : '0m'}
                                </span>
                              </div>
                            </button>
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

          {/* Cutting List - Full-screen card overlay */}
          {activeTab === 'cutting' && expandedCuttingCard !== null && filteredCuttingList[expandedCuttingCard.profileIndex] && (() => {
            const cuttingItem = filteredCuttingList[expandedCuttingCard.profileIndex];
            const stockLengthMeters = cuttingItem.stock_length / 1000;
            const layouts = cuttingItem.plan.map((planEntry: Record<string, string[] | CuttingPlanPiece[]>) => {
              const individualCuts = normalizePlanEntryToCuts(planEntry);
              const totalRepetition = getMaxRepetition(planEntry);
              const totalUsed = individualCuts.reduce((sum, cut) => sum + cut.length, 0);
              const offcut = stockLengthMeters - totalUsed;
              return { cuts: individualCuts, offcut, repetition: totalRepetition, totalUsed, stockLength: stockLengthMeters };
            });
            const layout = layouts[expandedCuttingCard.layoutIndex];
            if (!layout) return null;
            const layoutLetter = String.fromCharCode(65 + expandedCuttingCard.layoutIndex);
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                onClick={() => setExpandedCuttingCard(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Cutting list card full screen"
              >
<div
                  className="bg-white rounded-xl shadow-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-4xl max-h-[90vh] overflow-auto flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Mobile: hint to rotate to landscape for a longer stock bar view */}
                  <div className="md:hidden px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-amber-800 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 8h2a2 2 0 002-2v-2" />
                    </svg>
                    <span>Rotate to landscape for a longer view of the stock bar.</span>
                  </div>
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{cuttingItem.profile_name}</h3>
                    <button
                      type="button"
                      onClick={() => setExpandedCuttingCard(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-sm text-gray-500 uppercase block mb-1">Layout</span>
                        <span className="text-2xl font-semibold text-gray-900">{layoutLetter}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 uppercase block mb-1">Repetition</span>
                        <span className="text-2xl font-semibold text-gray-900">{layout.repetition}X</span>
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Material length: {layout.stockLength.toFixed(1)}m
                    </div>
                    {/* Visual Bar - larger on desktop, with dividing lines between cuts */}
                    <div className="flex h-20 md:h-28 mb-4 rounded overflow-hidden border border-gray-200">
                      {layout.cuts.map((cut, cutIndex) => {
                        const widthPercent = (cut.length / layout.stockLength) * 100;
                        const isOffcut = cut.isOffcut === true;
                        const element = cut.elementId ? elementsMap[cut.elementId] : undefined;
                        const showRightBorder = cutIndex < layout.cuts.length - 1 || layout.offcut > 0;
                        return (
                          <div
                            key={cutIndex}
                            className={`h-full flex items-center justify-center text-sm font-medium ${isOffcut ? 'text-gray-600' : 'text-white'}`}
                            style={{
                              width: `${widthPercent}%`,
                              borderRight: showRightBorder ? '2px solid rgba(0,0,0,0.2)' : undefined,
                              ...(isOffcut
                                ? {
                                    backgroundImage: 'radial-gradient(#94A3B8 1.5px, transparent 1.5px)',
                                    backgroundSize: '6px 6px',
                                    backgroundColor: '#f1f5f9',
                                  }
                                : { backgroundColor: element?.color ?? '#6B9EB6' }),
                            }}
                            title={element ? `${cut.label} — ${element.title}` : cut.label}
                          >
                            {cut.label}
                          </div>
                        );
                      })}
                      {layout.offcut > 0 && (
                        <div
                          className="h-full flex items-center justify-center text-sm font-medium text-gray-600 border-l-2 border-gray-300"
                          style={{
                            width: `${(layout.offcut / layout.stockLength) * 100}%`,
                            backgroundImage: 'radial-gradient(#94A3B8 1.5px, transparent 1.5px)',
                            backgroundSize: '6px 6px',
                            backgroundColor: '#f1f5f9',
                          }}
                        >
                          Off-cut
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Off-cut: </span>
                      <span className="text-base font-semibold text-gray-900">
                        {layout.offcut > 0 ? `${layout.offcut.toFixed(2)}m` : '0m'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Glass Cutting List Content */}
          {!isLoading && !error && activeTab === 'glass' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-6">Glass Cutting Layout</h3>

              {glassListNorm && glassListNorm.total_sheets > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel - Nest or legacy grid */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 min-h-[500px] relative flex min-w-0 flex-col items-stretch justify-center">
                    <div className="absolute inset-0 m-4 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#E2E8F0 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

                    {(() => {
                      const glassList = glassListNorm;
                      const currentSheetIndex = selectedSheet ? parseInt(selectedSheet.replace('sheet', ''), 10) - 1 : 0;
                      const currentSheet = currentSheetIndex + 1;
                      const useNest = hasUsableGlassLayouts(glassList);
                      const layoutsArr = glassList.layouts;

                      if (!selectedSheet && glassList.total_sheets > 0) {
                        return (
                          <div className="relative z-10 self-center bg-[#4A8B9F] text-white px-4 py-3 rounded shadow-lg text-center">
                            <p className="text-xs font-medium">Select a sheet</p>
                            <p className="text-xs">to view layout</p>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#4A8B9F] rotate-45" />
                          </div>
                        );
                      }

                      if (useNest && layoutsArr && selectedSheet) {
                        const li = layoutIndexForPhysicalSheet(layoutsArr, currentSheetIndex);
                        const pattern = layoutsArr[li];
                        return (
                          <div className="relative z-10 flex w-full min-w-0 flex-col items-stretch">
                            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                              <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                                Sheet {currentSheet}
                              </span>
                              {pattern.layoutId ? (
                                <span className="text-xs text-gray-500">Pattern {pattern.layoutId}</span>
                              ) : null}
                            </div>
                            <GlassCuttingNest
                              className="w-full min-w-0"
                              layout={pattern}
                              elementsMap={elementsMap}
                              elementFilter={glassElementFilter}
                            />
                            {glassList.total_sheets > 1 && (
                              <div className="flex justify-center items-center gap-4 mt-6">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentSheetIndex > 0) {
                                      const n = currentSheetIndex;
                                      setSelectedSheet(`sheet${n}`);
                                      setGlassFilter(`sheet${n}`);
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
                                  type="button"
                                  onClick={() => {
                                    if (currentSheetIndex < glassList.total_sheets - 1) {
                                      const n = currentSheetIndex + 2;
                                      setSelectedSheet(`sheet${n}`);
                                      setGlassFilter(`sheet${n}`);
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
                      }

                      /* Legacy: no layouts — approximate grid from cuts BOM; element filter = highlight only */
                      const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
                      const sheetWidth = sheetTypeMatch ? parseInt(sheetTypeMatch[1], 10) : 0;
                      const sheetHeight = sheetTypeMatch ? parseInt(sheetTypeMatch[2], 10) : 0;
                      const rawCuts = glassList.cuts || [];
                      const flatCutInstances = rawCuts.flatMap((c) =>
                        Array.from({ length: c.qty }, () => ({ w: c.w, h: c.h, elementId: c.elementId }))
                      );
                      const totalCuts = flatCutInstances.length;
                      const primaryCut = rawCuts.length > 0 ? rawCuts[0] : null;

                      if (!primaryCut) {
                        return (
                          <div className="relative z-10 text-center text-gray-500">
                            <p>No cuts data available</p>
                          </div>
                        );
                      }

                      const cutsPerRow = Math.floor(sheetWidth / primaryCut.w);
                      const cutsPerCol = Math.floor(sheetHeight / primaryCut.h);
                      const maxCutsPerSheet = cutsPerRow * cutsPerCol;
                      const usedWidth = cutsPerRow * primaryCut.w;
                      const usedHeight = cutsPerCol * primaryCut.h;
                      const wasteWidth = sheetWidth - usedWidth;
                      const wasteHeight = sheetHeight - usedHeight;

                      return (
                        <div className="relative z-10 w-full min-w-0 max-w-full">
                          <div className="mb-4 flex justify-center">
                            <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                              Sheet {currentSheet}
                            </span>
                          </div>
                          <div
                            className="border-2 border-gray-400 bg-gray-200 p-0.5 flex"
                            style={{
                              aspectRatio: `${sheetWidth}/${sheetHeight}`,
                              maxWidth: '100%',
                            }}
                          >
                            <div
                              className="flex flex-col"
                              style={{ width: `${(usedWidth / sheetWidth) * 100}%` }}
                            >
                              <div className="flex flex-col" style={{ height: `${(usedHeight / sheetHeight) * 100}%` }}>
                                {Array.from({ length: Math.min(cutsPerCol, Math.ceil(totalCuts / cutsPerRow)) }).map((_, rowIndex) => (
                                  <div
                                    key={rowIndex}
                                    className="flex"
                                    style={{
                                      height: `${(primaryCut.h / sheetHeight) * 100}%`,
                                      marginBottom: rowIndex < Math.min(cutsPerCol, Math.ceil(totalCuts / cutsPerRow)) - 1 ? '2px' : '0',
                                    }}
                                  >
                                    {Array.from({ length: cutsPerRow }).map((_, colIndex) => {
                                      const cutIndex = rowIndex * cutsPerRow + colIndex;
                                      if (cutIndex >= Math.min(totalCuts, maxCutsPerSheet)) return null;
                                      const instance = flatCutInstances[cutIndex];
                                      const element = instance?.elementId ? elementsMap[instance.elementId!] : undefined;
                                      const bgColor = element?.color ?? '#C8DEE5';
                                      const match =
                                        glassElementFilter === 'all' ||
                                        !instance?.elementId ||
                                        instance.elementId === glassElementFilter;
                                      const titleAttr = element ? `${primaryCut.w}×${primaryCut.h} — ${element.title}` : `${primaryCut.w}×${primaryCut.h}`;
                                      return (
                                        <div
                                          key={colIndex}
                                          className="relative"
                                          style={{
                                            width: `${(primaryCut.w / usedWidth) * 100}%`,
                                            height: '100%',
                                            marginRight: colIndex < cutsPerRow - 1 ? '2px' : '0',
                                            border: '1px solid #4B5563',
                                            backgroundColor: bgColor,
                                            opacity: match ? 1 : 0.28,
                                          }}
                                          title={titleAttr}
                                        >
                                          <span className="absolute top-1 left-1 text-xs font-medium">{primaryCut.w}</span>
                                          <span className="absolute bottom-1 left-1 text-xs font-medium">{primaryCut.h}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                              {wasteHeight > 0 && (
                                <div
                                  className="bg-gray-300 relative flex items-center justify-center"
                                  style={{
                                    width: '100%',
                                    height: `${(wasteHeight / sheetHeight) * 100}%`,
                                    marginTop: '2px',
                                    border: '1px solid #4B5563',
                                    borderTop: '2px solid #4B5563',
                                  }}
                                >
                                  <span className="absolute left-2 text-xs font-medium">{wasteHeight}</span>
                                  <span className="absolute bottom-1 text-xs font-medium">{usedWidth}</span>
                                </div>
                              )}
                            </div>
                            {wasteWidth > 0 && (
                              <div
                                className="bg-gray-300 relative flex flex-col items-center justify-center"
                                style={{
                                  width: `${(wasteWidth / sheetWidth) * 100}%`,
                                  height: '100%',
                                  marginLeft: '2px',
                                  border: '1px solid #4B5563',
                                  borderLeft: '2px solid #4B5563',
                                }}
                              >
                                <span className="absolute top-2 text-xs font-medium">{wasteWidth}</span>
                                <span className="absolute -rotate-90 text-xs font-medium">{sheetHeight}</span>
                              </div>
                            )}
                          </div>
                          {glassList.total_sheets > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentSheetIndex > 0) {
                                    const n = currentSheetIndex;
                                    setSelectedSheet(`sheet${n}`);
                                    setGlassFilter(`sheet${n}`);
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
                                type="button"
                                onClick={() => {
                                  if (currentSheetIndex < glassList.total_sheets - 1) {
                                    const n = currentSheetIndex + 2;
                                    setSelectedSheet(`sheet${n}`);
                                    setGlassFilter(`sheet${n}`);
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
                    {Array.from({ length: glassListNorm.total_sheets }).map((_, index) => {
                      const sheetNumber = index + 1;
                      const sheetId = `sheet${sheetNumber}`;
                      const glassList = glassListNorm;
                      const sheetTypeMatch = glassList.sheet_type.match(/(\d+)x(\d+)mm/);
                      const fallbackW = sheetTypeMatch ? parseInt(sheetTypeMatch[1], 10) : 0;
                      const fallbackH = sheetTypeMatch ? parseInt(sheetTypeMatch[2], 10) : 0;
                      let sheetWidth = fallbackW;
                      let sheetHeight = fallbackH;
                      let pcsOnSheet = glassList.cuts?.reduce((sum, cut) => sum + cut.qty, 0) || 0;
                      if (hasUsableGlassLayouts(glassList) && glassList.layouts) {
                        const li = layoutIndexForPhysicalSheet(glassList.layouts, index);
                        const pattern = glassList.layouts[li];
                        sheetWidth = pattern.stock.widthMm || fallbackW;
                        sheetHeight = pattern.stock.heightMm || fallbackH;
                        pcsOnSheet = pieceCountOnLayout(pattern);
                      }
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSelectedSheet(sheetId);
                            setGlassFilter(sheetId);
                          }}
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
                            <p className="text-xs text-gray-500 mb-1">Pieces on sheet</p>
                            <p className="text-base font-medium text-gray-900">{pcsOnSheet} pcs</p>
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

      {/* Mobile: fixed bottom bar - single action per tab */}
      {!isLoading && !error && calculationResult && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb">
          {activeTab === 'material' && (
            <button
              onClick={() => {
                if (onCreateQuote) {
                  onCreateQuote(grandTotal, calculationResult || undefined, previousData?.projectMeasurement);
                } else {
                  onGenerate(grandTotal);
                }
              }}
              disabled={isSaving}
              className="w-full py-3 font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Quote
            </button>
          )}
          {activeTab === 'cutting' && (
            <div className="relative export-dropdown-container">
              <button
                onClick={() => setShowExportDropdown(showExportDropdown === 'cutting' ? null : 'cutting')}
                className="w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                <span>Export Cutting List</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              {showExportDropdown === 'cutting' && (
                <div className="absolute left-0 right-0 bottom-full mb-2 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button onClick={() => handleExportCuttingList('pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg">Export as PDF</button>
                  <button onClick={() => handleExportCuttingList('excel')} className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg">Export as Excel</button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'glass' && (
            <div className="relative export-dropdown-container">
              <button
                onClick={() => setShowExportDropdown(showExportDropdown === 'glass' ? null : 'glass')}
                className="w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                <span>Export Glass List</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              {showExportDropdown === 'glass' && (
                <div className="absolute left-0 right-0 bottom-full mb-2 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button onClick={() => handleExportGlassCuttingList('pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg">Export as PDF</button>
                  <button onClick={() => handleExportGlassCuttingList('csv')} className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-100">Export as CSV</button>
                  <button onClick={() => handleExportGlassCuttingList('excel')} className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg border-t border-gray-100">Export as Excel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer with Grand Total - Material List tab only; extra bottom padding on mobile for fixed bar */}
      {!isLoading && !error && calculationResult && activeTab === 'material' && (
        <div className="border-t border-gray-200 bg-white px-4 md:px-8 py-6 pb-20 md:pb-6">
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
