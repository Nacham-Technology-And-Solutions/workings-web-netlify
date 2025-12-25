
import React, { useState, useEffect, useCallback } from 'react';

// Import components
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import SplashScreen from '../components/features/auth/SplashScreen';
import OnboardingScreen from '../components/features/auth/OnboardingScreen';
import LoginScreen from '../components/features/auth/LoginScreen';
import RegistrationScreen from '../components/features/auth/RegistrationScreen';
import ForgotPasswordScreen from '../components/features/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../components/features/auth/ResetPasswordScreen';
import SetupWorkspaceScreen from '../components/features/auth/SetupWorkspaceScreen';
import HomeScreen from '../components/features/HomeScreen';
import ProjectsScreen from '../components/features/projects/ProjectsScreen';
import NewProjectScreen from '../components/features/projects/NewProjectScreen';
import ProjectDescriptionScreen from '../components/features/projects/ProjectDescriptionScreen';
import SelectProjectScreen from '../components/features/projects/SelectProjectScreen';
import ProjectMeasurementScreen from '../components/features/projects/ProjectMeasurementScreen';
import ProjectSolutionScreen from '../components/features/projects/ProjectSolutionScreen';
import ProjectDetailScreen from '../components/features/projects/ProjectDetailScreen';
import ProjectEditScreen from '../components/features/projects/ProjectEditScreen';
import QuotesScreen from '../components/features/quotes/QuotesScreen';
import QuotePreviewScreen from '../components/features/quotes/QuotePreviewScreen';
import QuoteDetailScreen from '../components/features/quotes/QuoteDetailScreen';
import QuoteConfigurationScreen from '../components/features/quotes/QuoteConfigurationScreen';
import QuoteOverviewScreen from '../components/features/quotes/QuoteOverviewScreen';
import QuoteItemListScreen from '../components/features/quotes/QuoteItemListScreen';
import QuoteExtrasNotesScreen from '../components/features/quotes/QuoteExtrasNotesScreen';
import QuoteFinalPreviewScreen from '../components/features/quotes/QuoteFinalPreviewScreen';
import SettingsScreen from '../components/features/SettingsScreen';
import ProfileScreen from '../components/features/ProfileScreen';
import SubscriptionPlanScreen from '../components/features/SubscriptionPlanScreen';
import CreditsHistoryScreen from '../components/features/CreditsHistoryScreen';
import HelpAndTipsScreen from '../components/features/HelpAndTipsScreen';
import MaterialListScreen from '../components/features/material-lists/MaterialListScreen';
import MaterialListDetailScreen from '../components/features/material-lists/MaterialListDetailScreen';
import CreateMaterialListScreen from '../components/features/material-lists/CreateMaterialListScreen';
import MaterialListPreviewScreen from '../components/features/material-lists/MaterialListPreviewScreen';
import EditMaterialListScreen from '../components/features/material-lists/EditMaterialListScreen';
import LogViewer from '../components/common/LogViewer';

// Import stores
import {
  useAuthStore,
  useUIStore,
  useProjectStore,
  useQuoteStore,
  useMaterialListStore,
  useSyncStore,
} from '../stores';

// Import services
import { projectsService, quotesService, materialListsService } from '../services/api';

// Import utilities
import { getApiResponseData, normalizeApiResponse, isApiResponseSuccess } from '../utils/apiResponseHelper';
import { transformQuoteDataToBackend, transformBackendQuoteToPreview, transformStandaloneQuoteToBackend } from '../utils/dataTransformers';

// Import types and constants
import type { FloorPlan, Tool, EstimateCategory, ProjectMeasurementData } from '../types';
import { sampleFloorPlan, initialEstimates, sampleFullQuotes, sampleFullMaterialLists } from '../constants';

const PIXELS_PER_FOOT = 10; // 10 pixels = 1 foot
const WALL_HEIGHT_FEET = 8;

const App: React.FC = () => {
  // Zustand stores
  const {
    isLoading,
    showOnboarding,
    isAuthenticated,
    isSettingUp,
    authScreen,
    resetPasswordToken,
    resetPasswordEmail,
    setLoading,
    setShowOnboarding,
    setAuthenticated,
    setSettingUp,
    setAuthScreen,
    setResetPasswordData,
    initializeAuth,
  } = useAuthStore();

  const {
    currentView,
    previousView,
    isSidebarOpen,
    navigate,
    goBack,
    setSidebarOpen,
  } = useUIStore();

  const {
    projectDescriptionData,
    selectProjectData,
    projectMeasurementData,
    floorPlan,
    activeTool,
    materialCostFromStep4,
    setProjectDescriptionData,
    setSelectProjectData,
    setProjectMeasurementData,
    setFloorPlan,
    setActiveTool,
    setMaterialCostFromStep4,
    getCombinedProjectData,
    clearProjectFlow,
  } = useProjectStore();

  const {
    generatedQuote,
    selectedQuoteId,
    standaloneQuoteData,
    editingQuoteId,
    setGeneratedQuote,
    setSelectedQuoteId,
    setStandaloneQuoteData,
    updateStandaloneQuoteOverview,
    updateStandaloneQuoteItemList,
    updateStandaloneQuoteExtrasNotes,
    clearStandaloneQuoteData,
    setEditingQuoteId,
  } = useQuoteStore();

  const {
    selectedMaterialListId,
    materialListPreviewData,
    editingMaterialList,
    setSelectedMaterialListId,
    setMaterialListPreviewData,
    setEditingMaterialList,
  } = useMaterialListStore();

  const { initializeOnlineStatus } = useSyncStore();

  // Local state for estimates (legacy floor plan feature - can be moved to store later)
  const [estimates, setEstimates] = useState<EstimateCategory[]>(initialEstimates);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [refreshProjects, setRefreshProjects] = useState(0);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState<number | null>(null);
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Initialize stores on mount
  useEffect(() => {
    initializeAuth();
    initializeOnlineStatus();
    
    // Ensure logger is enabled and log app initialization
    import('@/utils/logger').then(({ default: logger }) => {
      if (!logger.isLoggingEnabled()) {
        logger.setEnabled(true);
      }
      logger.info('APP', 'Application initialized', {
        timestamp: new Date().toISOString(),
      });
    });
  }, [initializeAuth, initializeOnlineStatus]);

  // Keyboard shortcut to open log viewer (Ctrl+Shift+L or Cmd+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setShowLogViewer(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Splash screen, onboarding, and auth flow
  const handleSplashComplete = () => {
    setLoading(false);
    const onboardingShown = localStorage.getItem('onboardingShown');
    const userAuthenticated = localStorage.getItem('isAuthenticated');

    if (userAuthenticated === 'true') {
      setAuthenticated(true);
    } else if (!onboardingShown) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingShown', 'true');
    setShowOnboarding(false);
    setAuthScreen('register'); // For new users, go to registration after onboarding.
  };

  const handleRegistrationComplete = () => {
    // RegistrationScreen already handles API call and token storage
    // Just show setup screen briefly, then authenticate
    setSettingUp(true);
    setTimeout(() => {
      // Check if user is authenticated (tokens stored by RegistrationScreen)
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (isAuth) {
        setAuthenticated(true);
      }
      setSettingUp(false);
    }, 1500); // Show setup screen for 1.5s
  };

  const handleLogin = () => {
    // LoginScreen already handles API call and token storage
    // Just check if authenticated
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuth) {
      setAuthenticated(true);
    }
  };

  const handleForgotPassword = () => {
    setAuthScreen('forgot-password');
  };

  const handleForgotPasswordSuccess = () => {
    // After successful forgot password, go back to login
    setAuthScreen('login');
  };

  const handleResetPassword = (token?: string, email?: string) => {
    setResetPasswordData(token || null, email || null);
    setAuthScreen('reset-password');
  };

  const handleResetPasswordSuccess = () => {
    // After successful reset, go to login
    setResetPasswordData(null, null);
    setAuthScreen('login');
  };

  const handleNavigate = (view: string) => {
    navigate(view);
  };

  const handleNewProject = () => {
    // Clear all project data when starting a new project
    clearProjectFlow();
    setDraftProjectId(null);
    navigate('projectDescription');
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    navigate('projectDetail');
  };

  const handleProjectDeleted = () => {
    setSelectedProjectId(null);
    setRefreshProjects(prev => prev + 1);
    navigate('projects');
  };

  const handleEditCalculationSettings = async (projectId: string) => {
    try {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        console.error('Invalid project ID for editing calculation settings:', projectId);
        return;
      }

      const response = await projectsService.getById(projectIdNum);
      const normalizedResponse = normalizeApiResponse(response);

      if (normalizedResponse.success && normalizedResponse.response) {
        const projectData = normalizedResponse.response as any;
        
        // Load project data into flow state
        setProjectDescriptionData({
          projectName: projectData.projectName,
          customerName: projectData.customer?.name || '',
          siteAddress: projectData.siteAddress,
          description: projectData.description,
        });

        // Reconstruct selectProjectData from glazingDimensions
        const newSelectProjectData: SelectProjectData = {
          windows: [],
          doors: [],
          skylights: [],
          glassPanels: [],
        };

        projectData.glazingDimensions.forEach((dim: GlazingDimension) => {
          if (dim.glazingCategory === 'Window' && !newSelectProjectData.windows.includes(dim.glazingType)) {
            newSelectProjectData.windows.push(dim.glazingType);
          } else if (dim.glazingCategory === 'Door' && !newSelectProjectData.doors.includes(dim.glazingType)) {
            newSelectProjectData.doors.push(dim.glazingType);
          } else if (dim.glazingCategory === 'Net' && !newSelectProjectData.skylights.includes(dim.glazingType)) {
            newSelectProjectData.skylights.push(dim.glazingType);
          } else if (dim.glazingCategory === 'Curtain Wall' && !newSelectProjectData.glassPanels.includes(dim.glazingType)) {
            newSelectProjectData.glassPanels.push(dim.glazingType);
          }
        });
        setSelectProjectData(newSelectProjectData);

        // Reconstruct projectMeasurementData
        const newMeasurementData: ProjectMeasurementData = {
          dimensions: projectData.glazingDimensions.map((dim: GlazingDimension, index: number) => ({
            id: `dim-${index}`,
            type: dim.glazingType,
            width: dim.parameters.W?.toString() || '',
            height: dim.parameters.H?.toString() || '',
            quantity: dim.parameters.qty?.toString() || '',
            panel: dim.parameters.N?.toString() || dim.parameters.O?.toString() || '1',
          })),
          unit: 'mm',
        };
        setProjectMeasurementData(newMeasurementData);

        // Store calculation settings for editing (they can be modified in the flow)
        // The calculation settings will be used when recalculating
        
        // Set draftProjectId
        setDraftProjectId(projectIdNum);

        // Show warning and navigate to project solution where they can edit settings
        const confirmed = window.confirm(
          'You are about to edit calculation settings and recalculate the project. ' +
          'This will update the project with new calculation results. Continue?'
        );
        
        if (confirmed) {
          // Navigate to project solution - they can modify settings there before recalculating
          navigate('projectSolution');
        }
      } else {
        console.error('Failed to load project for editing calculation settings:', normalizedResponse.message);
      }
    } catch (error) {
      console.error('Error loading project for editing calculation settings:', error);
    }
  };

  const handleProjectCalculate = async (projectId: string) => {
    try {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        console.error('Invalid project ID:', projectId);
        return;
      }

      // Load project data from API
      const response = await projectsService.getById(projectIdNum);
      const normalizedResponse = normalizeApiResponse(response);
      
      if (!normalizedResponse.success || !normalizedResponse.response) {
        console.error('Failed to load project:', normalizedResponse.message);
        return;
      }

      // Extract project data from response
      const responseData = normalizedResponse.response as any;
      const apiProject = responseData.project || responseData;

      // Transform API project data back to frontend format
      // 1. ProjectDescriptionData
      const projectDescription: any = {
        projectName: apiProject.projectName || '',
        customerName: apiProject.customer?.name || '',
        siteAddress: apiProject.siteAddress || '',
        description: apiProject.description || '',
      };
      setProjectDescriptionData(projectDescription);

      // 2. Reconstruct SelectProjectData from glazingDimensions
      const selectProject: any = {
        windows: [],
        doors: [],
        skylights: [],
        glassPanels: [],
      };

      // 3. Convert GlazingDimension[] back to DimensionItem[]
      const dimensions: any[] = [];
      
      if (apiProject.glazingDimensions && Array.isArray(apiProject.glazingDimensions)) {
        apiProject.glazingDimensions.forEach((glazingDim: any, index: number) => {
          // Determine category and add to selectProject
          const category = glazingDim.glazingCategory;
          if (category === 'Window') {
            // Try to infer the type from glazingType or moduleId
            const typeValue = glazingDim.glazingType || '';
            if (!selectProject.windows.includes(typeValue)) {
              // Map common types - this is a best-effort reconstruction
              if (typeValue.toLowerCase().includes('casement')) {
                selectProject.windows.push('single-pane'); // Default mapping
              } else if (typeValue.toLowerCase().includes('sliding')) {
                selectProject.windows.push('double-pane'); // Default mapping
              } else {
                selectProject.windows.push('single-pane'); // Fallback
              }
            }
          } else if (category === 'Door') {
            selectProject.doors.push('sliding-door'); // Default
          } else if (category === 'Net') {
            selectProject.skylights.push('fixed-skylight'); // Default
          } else if (category === 'Curtain Wall') {
            selectProject.glassPanels.push('structural-glass'); // Default
          }

          // Convert GlazingDimension to DimensionItem
          const dimensionItem: any = {
            id: `dim-${Date.now()}-${index}`,
            type: glazingDim.glazingType || glazingDim.moduleId || '',
            width: String(glazingDim.parameters?.W || glazingDim.parameters?.in_to_in_width || ''),
            height: String(glazingDim.parameters?.H || glazingDim.parameters?.in_to_in_height || ''),
            quantity: String(glazingDim.parameters?.qty || 1),
            panel: String(glazingDim.parameters?.N || glazingDim.parameters?.O || 1),
          };
          dimensions.push(dimensionItem);
        });
      }

      const projectMeasurement: any = {
        dimensions,
        unit: 'mm', // Default unit
      };

      setSelectProjectData(selectProject);
      setProjectMeasurementData(projectMeasurement);

      // Store draft project ID if available
      if (apiProject.id) {
        setDraftProjectId(apiProject.id);
      }

      // Navigate to solution screen
      navigate('projectSolution');
    } catch (error) {
      console.error('Error loading project for calculation:', error);
    }
  };


  const handleDeleteProject = (projectId: string) => {
    // This will be handled by ProjectsScreen's delete handler
    // Refresh projects list after deletion
    setRefreshProjects(prev => prev + 1);
  };

  const handleProjectEdit = (projectId: string) => {
    setSelectedProjectId(projectId);
    navigate('projectEdit');
  };

  const handleProjectEditSave = () => {
    // Keep the project ID and navigate back to detail view
    // The detail screen will refresh automatically via useEffect when projectId changes
    // Force a refresh by updating the key or triggering a re-fetch
    setRefreshProjects(prev => prev + 1);
    // Navigate back to detail - the useEffect will trigger a refresh
    navigate('projectDetail');
  };

  const handleNewQuote = () => {
    // Navigate to standalone quote flow
    clearStandaloneQuoteData();
    setEditingQuoteId(null);
    navigate('quoteOverview');
  };

  const handleProjectDescriptionNext = async (data: any) => {
    setProjectDescriptionData(data);
    
    // Save project as draft when user completes project description
    try {
      const projectData: any = {
        projectName: data.projectName.trim(),
        customer: {
          name: data.customerName.trim(),
        },
        siteAddress: data.siteAddress.trim(),
        glazingDimensions: [], // Empty array for draft
      };

      // Only include description if it exists and is not empty
      if (data.description && data.description.trim()) {
        projectData.description = data.description.trim();
      }

      // Include calculation settings with defaults
      projectData.calculationSettings = {
        stockLength: 6,
        bladeKerf: 5,
        wasteThreshold: 200,
      };

      const response = await projectsService.create(projectData);
      
      // Store the draft project ID so we can update it later instead of creating a duplicate
      // Use helper function to extract data, handling both response.response.project.id and response.response.id
      const responseData = getApiResponseData(response) as any;
      const projectId = responseData?.project?.id || responseData?.id;
      
      if (projectId) {
        setDraftProjectId(projectId);
        console.log('[App] Draft project created with ID:', projectId);
      } else {
        console.warn('[App] Could not extract project ID from response:', responseData);
      }
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Failed to save project as draft:', error);
      
      // Log detailed error information if available
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.error('API Error Response:', {
          status: error.response.status,
          message: errorData.message,
          error: errorData.error,
          responseMessage: errorData.responseMessage,
          errors: errorData.errors,
        });
      }
      
      // Silently fail - draft save is not critical, user can continue
      // The project will be saved later when they complete the full flow
    }
    
    navigate('selectProject');
  };

  const handleSelectProjectNext = (data: any) => {
    setSelectProjectData(data);
    navigate('projectMeasurement');
  };

  const handleProjectMeasurementNext = (data: any) => {
    setProjectMeasurementData(data);
    navigate('projectSolution');
  };

  const handleProjectSolutionGenerate = (materialCost: number) => {
    // Use unified quote flow - same as handleCreateQuoteFromSolution
    handleCreateQuoteFromSolution(materialCost);
  };

  const handleCreateQuoteFromSolution = (
    materialCost?: number,
    calculationResult?: any,
    projectMeasurement?: ProjectMeasurementData
  ) => {
    // Store material cost for quote configuration
    if (materialCost !== undefined) {
      setMaterialCostFromStep4(materialCost);
    }
    
    // Initialize standalone quote data with project data for unified flow
    const projectOverviewData = {
      customerName: projectDescriptionData?.customerName || '',
      projectName: projectDescriptionData?.projectName || '',
      siteAddress: projectDescriptionData?.siteAddress || '',
      quoteId: '#000045', // Default quote ID, will be generated by backend
      issueDate: '',
      paymentTerms: '',
    };
    
    // Initialize the standalone quote data structure with project overview and project data
    setStandaloneQuoteData({
      overview: projectOverviewData,
      itemList: undefined,
      extrasNotes: undefined,
      // Store project data for quote item list population
      projectData: {
        calculationResult,
        projectMeasurement,
      },
    });
    
    // Navigate to unified quote overview screen (same as standalone flow)
    navigate('quoteOverview');
  };

  const handleQuoteConfigurationComplete = async (quoteData: any) => {
    try {
      // Transform frontend quote data to backend format
      const backendQuoteData = transformQuoteDataToBackend(quoteData, draftProjectId || undefined);
      
      console.log('[App] Creating quote with data:', backendQuoteData);
      
      // Create quote via API
      const response = await quotesService.create(backendQuoteData);
      
      // Normalize and check response
      const normalizedResponse = normalizeApiResponse(response);
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const quote = responseData?.quote || responseData;
        
        console.log('[App] Quote created successfully:', quote);
        
        // Transform backend quote response to preview format
        if (quote) {
          const previewData = transformBackendQuoteToPreview(quote, quoteData);
          setGeneratedQuote(previewData);
          console.log('[App] Quote transformed for preview:', previewData);
        }
        
        // Clear draftProjectId after successful quote creation
        if (draftProjectId) {
          setDraftProjectId(null);
          console.log('[App] Draft project ID cleared after successful quote creation');
        }
        
        // Navigate to quote preview or home
        // Note: QuotesScreen will refresh automatically when navigated to
        navigate('quotePreview');
      } else {
        console.error('[App] Quote creation failed:', normalizedResponse.message);
        // TODO: Show error message to user
        navigate('home');
      }
    } catch (error: any) {
      console.error('[App] Error creating quote:', error);
      // TODO: Show error message to user
      // For now, navigate back to home
      navigate('home');
    }
  };

  const handleGenerateQuote = (quoteData: any) => {
    setGeneratedQuote(quoteData);
    navigate('quotePreview');
  };

  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    navigate('quoteDetail');
  };

  const handleEditQuote = async (quoteId: string) => {
    try {
      // Fetch quote data
      const response = await quotesService.getById(parseInt(quoteId));
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const backendQuote = responseData?.quote || responseData;
        
        // Transform to standalone quote data format
        const overviewData = {
          customerName: backendQuote.customerName,
          projectName: backendQuote.project?.projectName || 'Standalone Quote',
          siteAddress: backendQuote.customerAddress || '',
          quoteId: backendQuote.quoteNumber || `Q-${backendQuote.id}`,
          issueDate: new Date(backendQuote.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          paymentTerms: 'due-on-receipt', // Default, can be enhanced later
        };

        const itemListData = {
          listType: 'material' as const,
          items: backendQuote.items.map((item: any, index: number) => ({
            id: String(index + 1),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.totalPrice,
          })),
          subtotal: backendQuote.subtotal,
        };

        const extrasNotesData = {
          extraCharges: '',
          amount: backendQuote.tax || 0,
          additionalNotes: '',
          accountName: 'Olumide Adewale', // Default, should come from settings
          accountNumber: '10-4030-011094',
          bankName: 'Zenith Bank',
          total: backendQuote.total,
        };

        // Set editing quote ID and populate standalone quote data
        setEditingQuoteId(quoteId);
        setStandaloneQuoteData({
          overview: overviewData,
          itemList: itemListData,
          extrasNotes: extrasNotesData,
        });

        // Navigate to edit flow
        navigate('quoteOverview');
      }
    } catch (error: any) {
      console.error('[App] Error loading quote for edit:', error);
    }
  };

  // Standalone quote flow handlers
  const handleQuoteOverviewNext = (data: any) => {
    updateStandaloneQuoteOverview(data);
    navigate('quoteItemList');
  };

  const handleQuoteItemListNext = (data: any) => {
    updateStandaloneQuoteItemList(data);
    navigate('quoteExtrasNotes');
  };

  const handleQuoteExtrasNotesSaveDraft = async (data: any) => {
    updateStandaloneQuoteExtrasNotes(data);
    
    try {
      const overviewData = standaloneQuoteData?.overview;
      const itemListData = standaloneQuoteData?.itemList;
      
      if (!overviewData || !itemListData) {
        console.error('[App] Missing quote data for draft save');
        return;
      }

      const backendQuoteData = transformStandaloneQuoteToBackend(
        overviewData,
        itemListData,
        data,
        draftProjectId || undefined
      );

      console.log('[App] Saving quote as draft:', backendQuoteData);
      
      let response;
      if (editingQuoteId) {
        // Update existing quote
        response = await quotesService.update(parseInt(editingQuoteId), backendQuoteData);
      } else {
        // Create new quote
        response = await quotesService.create(backendQuoteData);
      }
      
      if (isApiResponseSuccess(response)) {
        console.log('[App] Quote saved as draft successfully');
        clearStandaloneQuoteData();
        setEditingQuoteId(null);
        navigate('quotes');
      } else {
        console.error('[App] Failed to save quote as draft');
      }
    } catch (error: any) {
      console.error('[App] Error saving quote as draft:', error);
    }
  };

  const handleQuoteExtrasNotesPreview = async (data: any) => {
    updateStandaloneQuoteExtrasNotes(data);
    setIsSavingQuote(true);
    
    try {
      const overviewData = standaloneQuoteData?.overview;
      const itemListData = standaloneQuoteData?.itemList;
      
      if (!overviewData || !itemListData) {
        console.error('[App] Missing quote data for preview');
        setIsSavingQuote(false);
        return;
      }

      const backendQuoteData = transformStandaloneQuoteToBackend(
        overviewData,
        itemListData,
        data,
        draftProjectId || undefined
      );

      // Set status to 'sent' for final quote
      backendQuoteData.status = 'sent';

      console.log('[App] Creating/updating quote:', backendQuoteData);
      
      let response;
      if (editingQuoteId) {
        // Update existing quote
        response = await quotesService.update(parseInt(editingQuoteId), backendQuoteData);
      } else {
        // Create new quote
        response = await quotesService.create(backendQuoteData);
      }
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const quote = responseData?.quote || responseData;
        
        console.log('[App] Quote saved successfully:', quote);
        
        // Transform backend quote response to preview format
        if (quote) {
          const previewData = transformBackendQuoteToPreview(quote, {
            quoteName: overviewData.projectName,
            siteAddress: overviewData.siteAddress,
            customerContact: '',
          });
          setGeneratedQuote(previewData);
        }
        
        // Clear draftProjectId after successful quote creation (if it was a project quote)
        if (draftProjectId) {
          setDraftProjectId(null);
          console.log('[App] Draft project ID cleared after successful quote creation');
        }
        
        clearStandaloneQuoteData();
        setEditingQuoteId(null);
        setIsSavingQuote(false);
        // Don't clear generatedQuote - preserve it for navigation
        navigate('quoteFinalPreview');
      } else {
        console.error('[App] Quote save failed');
        setIsSavingQuote(false);
      }
    } catch (error: any) {
      console.error('[App] Error saving quote:', error);
      setIsSavingQuote(false);
    }
  };

  const handleViewMaterialList = (listId: string) => {
    setSelectedMaterialListId(listId);
    navigate('materialListDetail');
  };

  const handleCreateNewMaterialList = () => {
    navigate('createMaterialList');
  };

  const handleSaveMaterialListDraft = async (listData: any) => {
    try {
      // Transform FullMaterialList to API format
      const requestData = {
        projectName: listData.projectName,
        items: listData.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total || (item.quantity * item.unitPrice),
        })),
        total: listData.total,
        preparedBy: listData.preparedBy,
        date: listData.date,
      };

      // Call API to save material list
      const response = await materialListsService.create(requestData);
      
      // Check if save was successful
      const normalizedResponse = normalizeApiResponse(response);
      if (isApiResponseSuccess(normalizedResponse)) {
        console.log('[App] Material list saved successfully');
        // Navigate back to material list screen on success
        navigate('material-list');
      } else {
        console.error('[App] Failed to save material list:', normalizedResponse.message);
        // Still navigate but log the error
        navigate('material-list');
      }
    } catch (error) {
      console.error('[App] Error saving material list:', error);
      // Navigate back even on error (user can try again)
      navigate('material-list');
    }
  };

  const handlePreviewMaterialList = (listData: any) => {
    setMaterialListPreviewData(listData);
    navigate('materialListPreview');
  };

  // Recalculate estimates when floorPlan changes
  const calculateEstimates = useCallback(() => {
    // Wall calculations
    const totalWallLengthPixels = floorPlan.walls.reduce((sum, wall) => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);
    const totalWallLengthFeet = totalWallLengthPixels / PIXELS_PER_FOOT;

    // Studs (approx 1 per foot)
    const studCount = Math.ceil(totalWallLengthFeet);
    // Drywall (both sides of the wall)
    const drywallSqft = totalWallLengthFeet * WALL_HEIGHT_FEET * 2;

    // Openings
    const doorCount = floorPlan.doors.length;
    const windowCount = floorPlan.windows.length;

    setEstimates(prevEstimates => {
      return prevEstimates.map(category => {
        const newItems = category.items.map(item => {
          let newQuantity = item.quantity;
          switch (item.id) {
            case 'studs':
              newQuantity = studCount;
              break;
            case 'drywall':
              newQuantity = drywallSqft;
              break;
            case 'doors':
              newQuantity = doorCount;
              break;
            case 'windows':
              newQuantity = windowCount;
              break;
            default:
              return item; // Keep items like labor unchanged
          }
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unitCost,
          };
        });
        return { ...category, items: newItems };
      });
    });
  }, [floorPlan.walls, floorPlan.doors, floorPlan.windows]);

  useEffect(() => {
    calculateEstimates();
  }, [floorPlan, calculateEstimates]);

  if (isLoading) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (!isAuthenticated) {
    if (isSettingUp) {
      return <SetupWorkspaceScreen />;
    }
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onCreateAccount={() => setAuthScreen('register')}
          onForgotPassword={handleForgotPassword}
        />
      );
    }
    if (authScreen === 'register') {
      return (
        <RegistrationScreen
          onRegister={handleRegistrationComplete}
          onSwitchToLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'forgot-password') {
      return (
        <ForgotPasswordScreen
          onBack={() => setAuthScreen('login')}
          onSuccess={handleForgotPasswordSuccess}
        />
      );
    }
    if (authScreen === 'reset-password') {
      return (
        <ResetPasswordScreen
          onBack={() => setAuthScreen('login')}
          onSuccess={handleResetPasswordSuccess}
          token={resetPasswordToken || undefined}
          email={resetPasswordEmail || undefined}
        />
      );
    }
  }

  if (currentView === 'newProject') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <NewProjectScreen onBack={goBack} onGenerateQuote={handleGenerateQuote} />
        </div>
      </div>
    );
  }

  if (currentView === 'quotes') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuotesScreen onNewQuote={handleNewQuote} onViewQuote={handleViewQuote} onBack={() => navigate('home')} />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'quotePreview' && generatedQuote) {
    return <QuotePreviewScreen quote={generatedQuote} onBack={() => navigate('quotes')} onEdit={() => {
      // Use unified quote flow for editing
      // If we're already editing a quote, navigate back to quote overview
      if (editingQuoteId) {
        navigate('quoteOverview');
      } else {
        // Start new quote in unified flow (since we don't have backend ID in preview)
        handleNewQuote();
      }
    }} />;
  }

  if (currentView === 'quoteDetail' && selectedQuoteId) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteDetailScreen
              quoteId={selectedQuoteId}
              onBack={() => navigate('quotes')}
              onEdit={() => handleEditQuote(selectedQuoteId)}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'settings') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <SettingsScreen onNavigate={handleNavigate} />
          </div>
        </div>
      </>
    );
  }

  // Credits History Screen
  if (currentView === 'creditsHistory') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="settings"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <CreditsHistoryScreen onBack={() => navigate('profile')} />
          </div>
        </div>
      </>
    );
  }

  // Profile and Subscription Plans are now handled within SettingsScreen
  // Redirect to settings if someone tries to navigate directly to these views
  if (currentView === 'profile' || currentView === 'subscriptionPlans') {
    const targetSection = currentView === 'subscriptionPlans' ? 'subscriptionPlans' : 'profile';
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="settings"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <SettingsScreen 
              onNavigate={handleNavigate}
              initialSection={targetSection}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'help') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <HelpAndTipsScreen onBack={goBack} />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'material-list') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <MaterialListScreen onBack={() => navigate('home')} onViewList={handleViewMaterialList} onCreateNewList={handleCreateNewMaterialList} />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'materialListDetail' && selectedMaterialListId) {
    const listData = sampleFullMaterialLists.find(l => l.id === selectedMaterialListId);
    // Find a fallback or default if listData is not found
    const displayData = listData || sampleFullMaterialLists[0];
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <MaterialListDetailScreen
              list={displayData}
              onBack={() => navigate('material-list')}
              onEdit={() => {
                setEditingMaterialList(displayData);
                navigate('editMaterialList');
              }}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'editMaterialList' && editingMaterialList) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <EditMaterialListScreen
              list={editingMaterialList}
              onBack={() => {
                navigate('materialListDetail');
                setEditingMaterialList(null);
              }}
              onNext={() => {
                // Handle next - could navigate to Item List tab or save
                navigate('materialListDetail');
                setEditingMaterialList(null);
              }}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'materialListPreview' && materialListPreviewData) {
    return <MaterialListPreviewScreen list={materialListPreviewData} onBack={() => navigate('createMaterialList')} />;
  }

  if (currentView === 'createMaterialList') {
    return <CreateMaterialListScreen onBack={() => navigate('material-list')} onPreview={handlePreviewMaterialList} onSaveDraft={handleSaveMaterialListDraft} />;
  }

  if (currentView === 'projects') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectsScreen 
              key={refreshProjects}
              onNewProject={handleNewProject} 
              onBack={() => navigate('home')}
              onViewProject={handleViewProject}
              onEditProject={handleProjectEdit}
              onDeleteProject={handleDeleteProject}
              onCalculateProject={handleProjectCalculate}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'projectDetail' && selectedProjectId) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="projects"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectDetailScreen
              projectId={selectedProjectId}
              onBack={() => {
                setSelectedProjectId(null);
                navigate('projects');
              }}
              onEdit={handleProjectEdit}
              onDelete={handleProjectDeleted}
              onCalculate={handleProjectCalculate}
              onEditCalculationSettings={handleEditCalculationSettings}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'projectEdit' && selectedProjectId) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="projects"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectEditScreen
              projectId={selectedProjectId}
              onBack={() => {
                // Keep projectId to navigate back to detail view
                navigate('projectDetail');
              }}
              onSave={handleProjectEditSave}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'projectDescription') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectDescriptionScreen onBack={goBack} onNext={handleProjectDescriptionNext} />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'selectProject') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <SelectProjectScreen 
              onBack={() => navigate('projectDescription')} 
              onNext={handleSelectProjectNext} 
              previousData={selectProjectData}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'projectMeasurement') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectMeasurementScreen 
              onBack={() => navigate('selectProject')}
              onNext={(data) => {
                // Merge new dimensions with existing ones to preserve all dimensions
                const existingData = projectMeasurementData;
                if (existingData && existingData.dimensions) {
                  // Combine dimensions, avoiding duplicates by ID
                  const existingIds = new Set(existingData.dimensions.map(d => d.id));
                  const newDimensions = data.dimensions.filter(d => !existingIds.has(d.id));
                  const mergedDimensions = [...existingData.dimensions, ...newDimensions];
                  handleProjectMeasurementNext({
                    ...data,
                    dimensions: mergedDimensions,
                  });
                } else {
                  handleProjectMeasurementNext(data);
                }
              }}
              previousData={selectProjectData}
              onNavigateToStep={(step) => navigate(step as any)}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'projectSolution') {
    const combinedData = getCombinedProjectData();
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectSolutionScreen
              onBack={() => navigate('projectMeasurement')}
              onGenerate={handleProjectSolutionGenerate}
              onCreateQuote={handleCreateQuoteFromSolution}
              previousData={combinedData || undefined}
              draftProjectId={draftProjectId}
              onProjectSaved={() => {
                // Don't clear draftProjectId here - we need it for quote creation
                // It will be cleared after quote is successfully created
                console.log('[App] Project saved successfully, keeping draftProjectId for quote creation');
              }}
            />
          </div>
        </div>
      </>
    );
  }

  // QuoteConfiguration screen removed - now using unified 3-screen quote flow (quoteOverview -> quoteItemList -> quoteExtrasNotes)
  // Both standalone and project quotes now use the same flow
  // if (currentView === 'quoteConfiguration') {
  //   return (
  //     <QuoteConfigurationScreen
  //       onBack={() => navigate('projectSolution')}
  //       onGenerateQuote={handleQuoteConfigurationComplete}
  //       materialCost={materialCostFromStep4}
  //       projectData={{
  //         projectName: projectDescriptionData?.projectName,
  //         customerName: projectDescriptionData?.customerName,
  //         siteAddress: projectDescriptionData?.siteAddress
  //       }}
  //     />
  //   );
  // }

  // Standalone quote flow screens
  if (currentView === 'quoteOverview') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteOverviewScreen
              onBack={() => navigate(draftProjectId ? 'projectSolution' : 'quotes')}
              onNext={handleQuoteOverviewNext}
              previousData={standaloneQuoteData}
              editingQuoteId={editingQuoteId}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'quoteItemList') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteItemListScreen
              onBack={() => navigate('quoteOverview')}
              onNext={handleQuoteItemListNext}
              previousData={standaloneQuoteData}
              quoteType={draftProjectId ? 'from_project' : 'standalone'}
              materialCost={draftProjectId ? materialCostFromStep4 : undefined}
            />
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'quoteExtrasNotes') {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteExtrasNotesScreen
              onBack={() => navigate('quoteItemList')}
              onPreview={handleQuoteExtrasNotesPreview}
              onSaveDraft={handleQuoteExtrasNotesSaveDraft}
              previousData={standaloneQuoteData}
            />
          </div>
        </div>
      </>
    );
  }

  // Loading state for saving quote
  if (isSavingQuote) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600 text-lg">Saving changes</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'quoteFinalPreview' && generatedQuote) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteFinalPreviewScreen
              onBack={() => navigate('quotes')}
              onEdit={() => {
                // Navigate back to edit flow
                if (selectedQuoteId) {
                  handleEditQuote(selectedQuoteId);
                } else {
                  navigate('quotes');
                }
              }}
              onDownloadPDF={() => {
                if (generatedQuote) {
                  import('@/services/export/exportService').then(({ exportQuoteToPDF }) => {
                    exportQuoteToPDF(generatedQuote);
                  });
                }
              }}
              previousData={generatedQuote}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header - Full width, aligned with sidebar */}
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex h-screen bg-[#FAFAFA]">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* Main Content Area - Starts below header, accounts for sidebar */}
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-[360px]">
          <div className="flex-1 overflow-y-auto">
            {currentView === 'home' && <HomeScreen onNewProject={handleNewProject} />}
          </div>
        </div>
      </div>

      {/* Log Viewer - Accessible via Ctrl+Shift+L / Cmd+Shift+L */}
      {import.meta.env.DEV && (
        <LogViewer isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />
      )}
    </>
  );
};

export default App;
