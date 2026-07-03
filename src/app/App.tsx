
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
import ProjectEstimationPricingScreen from '../components/features/projects/ProjectEstimationPricingScreen';
import ProjectDetailScreen from '../components/features/projects/ProjectDetailScreen';
import ProjectEditScreen from '../components/features/projects/ProjectEditScreen';
import QuotesScreen from '../components/features/quotes/QuotesScreen';
import QuotePreviewScreen from '../components/features/quotes/QuotePreviewScreen';
import QuoteDetailScreen from '../components/features/quotes/QuoteDetailScreen';
import QuoteOverviewScreen from '../components/features/quotes/QuoteOverviewScreen';
import QuoteItemListScreen from '../components/features/quotes/QuoteItemListScreen';
import QuoteExtrasNotesScreen from '../components/features/quotes/QuoteExtrasNotesScreen';
import QuoteFinalPreviewScreen from '../components/features/quotes/QuoteFinalPreviewScreen';
import SettingsScreen from '../components/features/SettingsScreen';
import ProfileScreen from '../components/features/ProfileScreen';
import CreditsHistoryScreen from '../components/features/CreditsHistoryScreen';
import HelpAndTipsScreen from '../components/features/HelpAndTipsScreen';
import FeedbackContactScreen from '../components/features/FeedbackContactScreen';
import MaterialListScreen from '../components/features/material-lists/MaterialListScreen';
import MaterialListDetailScreen from '../components/features/material-lists/MaterialListDetailScreen';
import CreateMaterialListScreen from '../components/features/material-lists/CreateMaterialListScreen';
import MaterialListPreviewScreen from '../components/features/material-lists/MaterialListPreviewScreen';
import EditMaterialListScreen from '../components/features/material-lists/EditMaterialListScreen';
import TemplatesScreen from '../components/features/TemplatesScreen';
import PaymentCallbackScreen from '../components/features/PaymentCallbackScreen';
import SessionExpiredModal from '../components/common/SessionExpiredModal';
import LogViewer from '../components/common/LogViewer';

// Import stores
import {
  useAuthStore,
  useUIStore,
  useProjectStore,
  useQuoteStore,
  useMaterialListStore,
  useSyncStore,
  useEstimationStore,
} from '../stores';

// Import services
import { projectsService, quotesService, materialListsService } from '../services/api';

// Import utilities
import { getApiResponseData, normalizeApiResponse, isApiResponseSuccess } from '../utils/apiResponseHelper';
import {
  transformQuoteDataToBackend,
  transformBackendQuoteToPreview,
  transformStandaloneQuoteToBackend,
} from '../utils/dataTransformers';
import {
  hydrateProjectFlowFromApiProject,
  getCachedProjectFlow,
  setCachedProjectFlow,
  invalidateProjectFlowCache,
  type HydratedProjectFlow,
} from '../utils/projectFlowHydration';
import { invalidateMaterialListsCache } from '../utils/materialListFetch';
import type { Project as ApiProject } from '../services/api/projects.service';
import { onSessionExpired, clearAuthData } from '../utils/sessionManager';
import {
  clearPaymentCallback,
  hasActivePaymentCallback,
  hasPaymentCallbackUrlParams,
} from '../utils/paymentCallbackStorage';

// Import types and constants
import type { FloorPlan, Tool, EstimateCategory, ProjectMeasurementData } from '../types';
import type { EstimationSavedQuote } from '../types/estimation';
import type { EstimationPreviewAcceptedPayload } from '../components/features/estimation/EstimationQuotePreviewModal';
import { applyMarginToItems, quoteItemsSubtotal } from '../utils/estimationQuoteMappers';
import type { SelectProjectData } from '../types/project';
import type { FullMaterialList } from '../types/material';
import { initialEstimates } from '../constants';
import {
  splitQuoteBackendItems,
  extraChargeItemsToAddedCharges,
  isQuoteDiscountDescription,
  parseDiscountPercentFromDescription,
} from '../utils/quoteChargeHelpers';

const PIXELS_PER_FOOT = 10; // 10 pixels = 1 foot
const WALL_HEIGHT_FEET = 8;

async function fetchAndHydrateProjectFlow(projectId: string): Promise<HydratedProjectFlow | null> {
  const projectIdNum = parseInt(projectId, 10);
  if (isNaN(projectIdNum)) return null;

  const cached = getCachedProjectFlow(projectIdNum);
  if (cached) return cached;

  const response = await projectsService.getById(projectIdNum);
  const normalizedResponse = normalizeApiResponse(response);
  if (!normalizedResponse.success || !normalizedResponse.response) {
    return null;
  }

  const responseData = normalizedResponse.response as { project?: ApiProject } | ApiProject;
  const apiProject = ('project' in responseData && responseData.project
    ? responseData.project
    : responseData) as ApiProject;
  const flow = hydrateProjectFlowFromApiProject(apiProject);
  setCachedProjectFlow(flow);
  return flow;
}

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
    hydrateUserProfile,
    user,
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
    clearEstimationDraft,
    setEditingQuoteId,
    setEstimationDraft,
    ensureQuoteClientReference,
  } = useQuoteStore();

  const {
    selectedMaterialListId,
    materialListPreviewData,
    editingMaterialList,
    duplicateMaterialListData,
    setSelectedMaterialListId,
    setMaterialListPreviewData,
    setEditingMaterialList,
    setDuplicateMaterialListData,
  } = useMaterialListStore();

  const { initializeOnlineStatus } = useSyncStore();

  // Local state for estimates (legacy floor plan feature - can be moved to store later)
  const [estimates, setEstimates] = useState<EstimateCategory[]>(initialEstimates);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [refreshProjects, setRefreshProjects] = useState(0);
  const [refreshQuotes, setRefreshQuotes] = useState(0);
  const [refreshMaterialLists, setRefreshMaterialLists] = useState(0);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState<number | null>(null);
  const [initialCalculationResult, setInitialCalculationResult] = useState<import('@/types/calculations').CalculationResult | null>(null);
  const [projectWasCalculated, setProjectWasCalculated] = useState(false);
  /** When true, user entered project flow from project detail (View results / Recalculate); back should go to projectDetail. */
  const [projectFlowFromDetail, setProjectFlowFromDetail] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isEditQuoteLoading, setIsEditQuoteLoading] = useState(false);
  const [materialListDetailData, setMaterialListDetailData] = useState<FullMaterialList | null>(null);
  const [materialListDetailLoading, setMaterialListDetailLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string>('Your session has expired. Please sign in again to continue.');

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

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void hydrateUserProfile();
    }
  }, [isAuthenticated, user?.id, hydrateUserProfile]);

  useEffect(() => {
    if (!selectedMaterialListId) {
      setMaterialListDetailData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setMaterialListDetailLoading(true);
      try {
        const listId = parseInt(selectedMaterialListId, 10);
        if (isNaN(listId)) {
          setMaterialListDetailData(null);
          return;
        }
        const response = await materialListsService.getById(listId);
        if (!isApiResponseSuccess(response)) {
          setMaterialListDetailData(null);
          return;
        }
        const responseData = getApiResponseData(response) as { materialList?: Record<string, unknown> };
        const ml = (responseData?.materialList ?? responseData) as {
          id: number;
          items?: Array<{ description: string; quantity: number; unitPrice: number; totalPrice?: number }>;
          total?: number;
          createdAt?: string;
          preparedBy?: string;
          project?: { projectName?: string };
        };
        const full: FullMaterialList = {
          id: String(ml.id),
          projectName: ml.project?.projectName || 'Material List',
          date: ml.createdAt || new Date().toISOString(),
          preparedBy: ml.preparedBy || '',
          status: 'Completed',
          items: (ml.items || []).map((item, i) => ({
            id: `item-${i}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.totalPrice ?? item.quantity * item.unitPrice,
          })),
          total: ml.total ?? 0,
        };
        if (!cancelled) setMaterialListDetailData(full);
      } catch (error) {
        console.error('[App] Error loading material list detail:', error);
        if (!cancelled) setMaterialListDetailData(null);
      } finally {
        if (!cancelled) setMaterialListDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMaterialListId]);

  // Deep link from password-reset email: /reset-password?token=...&email=...
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const isResetPath = path === '/reset-password' || path.endsWith('/reset-password');
    if (!isResetPath) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token')?.trim();
    const email = params.get('email')?.trim() ?? null;

    if (!token) return;

    const { logout, setResetPasswordData, setAuthScreen } = useAuthStore.getState();
    logout();
    setResetPasswordData(token, email);
    setAuthScreen('reset-password');

    const base = import.meta.env.BASE_URL || '/';
    window.history.replaceState(null, '', base);
  }, []);

  // Listen for session expiration events
  useEffect(() => {
    const unsubscribe = onSessionExpired((event) => {
      console.log('[App] Session expired event received:', event);
      setSessionExpiredMessage(event.message);
      setSessionExpired(true);
      // Clear authentication state
      setAuthenticated(false);
      setAuthScreen('login');
    });

    return () => {
      unsubscribe();
    };
  }, [setAuthenticated, setAuthScreen]);

  // Handle session expired modal confirmation
  const handleSessionExpiredConfirm = () => {
    clearAuthData();
    setSessionExpired(false);
    setSessionExpiredMessage('Your session has expired. Please sign in again to continue.');
    setAuthenticated(false);
    setAuthScreen('login');
    navigate('home');
  };

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
    const { authScreen } = useAuthStore.getState();

    if (userAuthenticated === 'true') {
      setAuthenticated(true);
    } else if (!onboardingShown && authScreen !== 'reset-password') {
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
    setProjectWasCalculated(false);
    setProjectFlowFromDetail(false);
    setInitialCalculationResult(null);
    navigate('projectDescription');
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    navigate('projectDetail');
  };

  const handleProjectDeleted = () => {
    setSelectedProjectId(null);
    invalidateProjectFlowCache();
    setRefreshProjects(prev => prev + 1);
    navigate('projects');
  };

  const handleProjectCalculate = async (projectId: string) => {
    try {
      setProjectWasCalculated(false);
      const flow = await fetchAndHydrateProjectFlow(projectId);
      if (!flow) {
        console.error('Failed to load project:', projectId);
        return;
      }
      setProjectDescriptionData(flow.projectDescription);
      setSelectProjectData(flow.selectProject);
      setProjectMeasurementData(flow.projectMeasurement);
      setDraftProjectId(flow.projectId);
      navigate('projectSolution');
    } catch (error) {
      console.error('Error loading project for calculation:', error);
    }
  };

  const handleViewResults = async (projectId: string, lastCalculationResult: import('@/types/calculations').CalculationResult) => {
    try {
      const flow = await fetchAndHydrateProjectFlow(projectId);
      if (!flow) return;
      setProjectDescriptionData(flow.projectDescription);
      setSelectProjectData(flow.selectProject);
      setProjectMeasurementData(flow.projectMeasurement);
      setDraftProjectId(flow.projectId);
      setInitialCalculationResult(lastCalculationResult);
      setProjectFlowFromDetail(true);
      navigate('projectSolution');
    } catch (error) {
      console.error('Error loading project for view results:', error);
    }
  };

  const handleModifyDimensionsRecalculate = async (projectId: string) => {
    try {
      const flow = await fetchAndHydrateProjectFlow(projectId);
      if (!flow) return;
      setProjectDescriptionData(flow.projectDescription);
      setSelectProjectData(flow.selectProject);
      setProjectMeasurementData(flow.projectMeasurement);
      setDraftProjectId(flow.projectId);
      setProjectWasCalculated(true);
      setProjectFlowFromDetail(true);
      navigate('projectMeasurement');
    } catch (error) {
      console.error('Error loading project for modify dimensions:', error);
    }
  };

  /** Navigate to project measurement (dimensions) screen to add dimensions. Used when project has no dimensions yet. */
  const handleAddDimensions = async (projectId: string) => {
    try {
      const flow = await fetchAndHydrateProjectFlow(projectId);
      if (!flow) return;
      setProjectDescriptionData(flow.projectDescription);
      setSelectProjectData(flow.selectProject);
      setProjectMeasurementData(flow.projectMeasurement);
      setDraftProjectId(flow.projectId);
      navigate('selectProject');
    } catch (error) {
      console.error('Error loading project for add dimensions:', error);
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
    clearStandaloneQuoteData();
    setEditingQuoteId(null);
    ensureQuoteClientReference();
    navigate('quoteOverview');
  };

  const handleProjectDescriptionNext = async (data: any) => {
    setProjectDescriptionData(data);

    const descriptionPayload = {
      projectName: data.projectName.trim(),
      customer: { name: data.customerName.trim() },
      siteAddress: data.siteAddress.trim(),
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
    };

    try {
      if (draftProjectId) {
        // Returning to Project Description (back or breadcrumb): update existing draft, do not create a new one
        await projectsService.update(draftProjectId, descriptionPayload);
        console.log('[App] Draft project updated with ID:', draftProjectId);
      } else {
        // First time through: create new draft
        const projectData: any = {
          ...descriptionPayload,
          glazingDimensions: [],
          calculationSettings: {
            stockLength: 6,
            bladeKerf: 5,
            wasteThreshold: 200,
          },
        };

        const response = await projectsService.create(projectData);
        const responseData = getApiResponseData(response) as any;
        const projectId = responseData?.project?.id || responseData?.id;

        if (projectId) {
          setDraftProjectId(projectId);
          console.log('[App] Draft project created with ID:', projectId);
        } else {
          console.warn('[App] Could not extract project ID from response:', responseData);
        }
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

  const handleEstimationPreviewAccepted = (payload: EstimationPreviewAcceptedPayload) => {
    const projectId = draftProjectId;
    if (!projectId) {
      console.error('[App] No project ID for estimation preview accept');
      return;
    }

    setEditingQuoteId(null);
    const defaultMargin = 0;
    const adjustedItems = applyMarginToItems(payload.baseItems, defaultMargin);
    const listType = payload.quoteSource === 'project_cart' ? 'dimension' : 'material';
    const subtotal = quoteItemsSubtotal(adjustedItems);

    const { quoteSettings } = useEstimationStore.getState();

    setEstimationDraft({
      projectId,
      quoteSource: payload.quoteSource,
      baseItems: payload.baseItems,
      pricingInputs: payload.pricingInputs,
      itemOverrides: payload.itemOverrides,
      marginPercent: defaultMargin,
      offcutMarkup: quoteSettings.offcutMarkup,
    });

    setStandaloneQuoteData({
      overview: {
        customerName: projectDescriptionData?.customerName || '',
        projectName: projectDescriptionData?.projectName || '',
        siteAddress: projectDescriptionData?.siteAddress || '',
        quoteId: '#000045',
        issueDate: '',
        paymentTerms: '',
      },
      itemList: {
        listType,
        items: adjustedItems,
        subtotal,
      },
      extrasNotes: {
        extraCharges: '',
        amount: 0,
        additionalNotes: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        total: subtotal,
        marginPercent: defaultMargin,
        discountPercent: 0,
        tax: 0,
        taxType: 'fixed',
        taxValue: 0,
      },
      projectData: {
        calculationResult: initialCalculationResult ?? undefined,
        projectMeasurement: projectMeasurementData ?? undefined,
      },
    });

    navigate('quoteOverview');
  };

  const handleCreateQuoteFromSolution = (
    materialCost?: number,
    calculationResult?: any,
    projectMeasurement?: ProjectMeasurementData
  ) => {
    // Ensure we're in "Create New Quote" mode, not "Edit Quote" (e.g. user came from project Generate Quote)
    setEditingQuoteId(null);

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[App] handleCreateQuoteFromSolution called with:', {
        materialCost,
        hasCalculationResult: !!calculationResult,
        hasProjectMeasurement: !!projectMeasurement,
        calculationResultKeys: calculationResult ? Object.keys(calculationResult) : [],
        projectMeasurementKeys: projectMeasurement ? Object.keys(projectMeasurement) : [],
        dimensionsCount: projectMeasurement?.dimensions?.length || 0
      });
    }

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
    const quoteData = {
      overview: projectOverviewData,
      itemList: undefined,
      extrasNotes: undefined,
      // Store project data for quote item list population
      projectData: {
        calculationResult,
        projectMeasurement,
      },
    };

    if (import.meta.env.DEV) {
      console.log('[App] Setting standaloneQuoteData:', {
        hasOverview: !!quoteData.overview,
        hasProjectData: !!quoteData.projectData,
        hasCalculationResult: !!quoteData.projectData.calculationResult,
        hasProjectMeasurement: !!quoteData.projectData.projectMeasurement,
        calculationResultType: typeof quoteData.projectData.calculationResult,
        projectMeasurementType: typeof quoteData.projectData.projectMeasurement,
        calculationResultKeys: quoteData.projectData.calculationResult ? Object.keys(quoteData.projectData.calculationResult) : [],
        projectMeasurementKeys: quoteData.projectData.projectMeasurement ? Object.keys(quoteData.projectData.projectMeasurement) : [],
        quoteData
      });
    }
    
    setStandaloneQuoteData(quoteData);
    
    // Verify data was set correctly by reading it back immediately
    if (import.meta.env.DEV) {
      // Use setTimeout to allow Zustand to process the update
      setTimeout(() => {
        const stored = useQuoteStore.getState().standaloneQuoteData;
        console.log('[App] Verifying stored data after setStandaloneQuoteData:', {
          hasStoredData: !!stored,
          hasProjectData: !!stored?.projectData,
          hasCalculationResult: !!stored?.projectData?.calculationResult,
          hasProjectMeasurement: !!stored?.projectData?.projectMeasurement,
          calculationResultType: typeof stored?.projectData?.calculationResult,
          projectMeasurementType: typeof stored?.projectData?.projectMeasurement,
          storedProjectData: stored?.projectData
        });
      }, 100);
    }
    
    // Navigate to unified quote overview screen (same as standalone flow)
    navigate('quoteOverview');
  };

  const handleEstimationQuoteSaved = (quote: EstimationSavedQuote) => {
    setEditingQuoteId(null);
    const previewData = transformBackendQuoteToPreview(
      {
        ...quote,
        items: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          ...('width' in item && item.width != null
            ? { width: item.width, height: item.height }
            : {}),
        })),
        estimationSnapshot: quote.estimationSnapshot,
        project: {
          projectName: projectDescriptionData?.projectName,
          siteAddress: projectDescriptionData?.siteAddress,
        },
      },
      {
        quoteName: projectDescriptionData?.projectName,
        siteAddress: projectDescriptionData?.siteAddress,
      }
    );
    setGeneratedQuote(previewData);
    if (draftProjectId) {
      setDraftProjectId(null);
    }
    setRefreshQuotes((prev) => prev + 1);
    navigate('quotePreview');
  };

  const handleQuoteConfigurationComplete = async (quoteData: any) => {
    try {
      // Transform frontend quote data to backend format
      const backendQuoteData = transformQuoteDataToBackend(quoteData, draftProjectId || undefined);
      
      console.log('[App] Creating quote with data:', backendQuoteData);
      
      // Create quote via API
      const response = await quotesService.create({
        ...backendQuoteData,
        clientReference: ensureQuoteClientReference(),
      });
      
      // Normalize and check response
      const normalizedResponse = normalizeApiResponse(response);
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const quote = responseData?.quote || responseData;
        
        console.log('[App] Quote created successfully:', quote);
        
        // Transform backend quote response to preview format
        if (quote) {
          const previewData = transformBackendQuoteToPreview(quote, quoteData, undefined);
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
    setIsEditQuoteLoading(true);
    try {
      clearEstimationDraft();
      setSelectedQuoteId(quoteId);

      // Fetch quote data
      const response = await quotesService.getById(parseInt(quoteId));
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const backendQuote = responseData?.quote || responseData;

        const { productItems, extraChargeItems } = splitQuoteBackendItems(backendQuote.items || []);
        const addedCharges = extraChargeItemsToAddedCharges(extraChargeItems);
        const discountItem = extraChargeItems.find((item) =>
          isQuoteDiscountDescription(item.description)
        );
        const discountPercent =
          parseDiscountPercentFromDescription(discountItem?.description ?? '') ?? 0;
        const productSubtotal = productItems.reduce(
          (sum: number, item: { totalPrice: number }) => sum + item.totalPrice,
          0
        );
        
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
          paymentTerms: backendQuote.paymentTerms || 'due-on-receipt',
          customPaymentTerms: backendQuote.customPaymentTerms || '',
        };

        const itemListData = {
          listType: 'material' as const,
          items: productItems.map((item: { description: string; quantity: number; unitPrice: number; totalPrice: number }, index: number) => ({
            id: String(index + 1),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.totalPrice,
          })),
          subtotal: productSubtotal,
        };

        const extrasNotesData = {
          extraCharges: addedCharges.map((c) => c.description).join(', '),
          amount: addedCharges.reduce((s, c) => s + c.amount, 0),
          additionalNotes: backendQuote.notes || '',
          accountName: backendQuote.paymentInfo?.accountName || '',
          accountNumber: backendQuote.paymentInfo?.accountNumber || '',
          bankName: backendQuote.paymentInfo?.bankName || '',
          total: backendQuote.total,
          taxType: 'fixed' as const,
          taxValue: backendQuote.tax || 0,
          tax: backendQuote.tax || 0,
          addedCharges,
          discountPercent,
          marginPercent: 0,
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
    } finally {
      setIsEditQuoteLoading(false);
    }
  };

  const handleDeleteQuote = () => {
    setSelectedQuoteId(null);
    setRefreshQuotes(prev => prev + 1);
    navigate('quotes');
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
    setIsSavingDraft(true);
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
        try {
          // Try to update existing quote
          response = await quotesService.update(parseInt(editingQuoteId), backendQuoteData);
          
          // Check if update was successful
          if (!isApiResponseSuccess(response)) {
            // If update failed, check if it's a 404 (quote doesn't exist)
            const error = response as any;
            if (error?.response?.status === 404 || error?.status === 404) {
              console.warn('[App] Quote not found (404), creating new quote instead');
              // Clear editingQuoteId and create new quote
              setEditingQuoteId(null);
              response = await quotesService.create({
                ...backendQuoteData,
                clientReference: ensureQuoteClientReference(),
              });
            } else {
              throw new Error('Failed to update quote');
            }
          }
        } catch (updateError: any) {
          // If update fails with 404 or other error, fallback to create
          if (updateError?.response?.status === 404 || updateError?.status === 404) {
            console.warn('[App] Quote not found (404), creating new quote instead');
            setEditingQuoteId(null);
            response = await quotesService.create({
              ...backendQuoteData,
              clientReference: ensureQuoteClientReference(),
            });
          } else {
            // Re-throw other errors
            throw updateError;
          }
        }
      } else {
        // Create new quote
        response = await quotesService.create({
          ...backendQuoteData,
          clientReference: ensureQuoteClientReference(),
        });
      }
      
      if (isApiResponseSuccess(response)) {
        console.log('[App] Quote saved as draft successfully');
        clearStandaloneQuoteData();
        setEditingQuoteId(null);
        navigate('quotes');
      } else {
        const errorMessage = (response as any)?.message || 'Failed to save quote as draft';
        console.error('[App] Failed to save quote as draft:', errorMessage);
        alert(`Failed to save quote as draft: ${errorMessage}. Please try again.`);
      }
    } catch (error: any) {
      console.error('[App] Error saving quote as draft:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
      alert(`Error saving quote as draft: ${errorMessage}. Please try again.`);
    } finally {
      setIsSavingDraft(false);
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
        try {
          // Try to update existing quote
          response = await quotesService.update(parseInt(editingQuoteId), backendQuoteData);
          
          // Check if update was successful
          if (!isApiResponseSuccess(response)) {
            // If update failed, check if it's a 404 (quote doesn't exist)
            const error = response as any;
            if (error?.response?.status === 404 || error?.status === 404) {
              console.warn('[App] Quote not found (404), creating new quote instead');
              // Clear editingQuoteId and create new quote
              setEditingQuoteId(null);
              response = await quotesService.create({
                ...backendQuoteData,
                clientReference: ensureQuoteClientReference(),
              });
            } else {
              throw new Error('Failed to update quote');
            }
          }
        } catch (updateError: any) {
          // If update fails with 404 or other error, fallback to create
          if (updateError?.response?.status === 404 || updateError?.status === 404) {
            console.warn('[App] Quote not found (404), creating new quote instead');
            setEditingQuoteId(null);
            response = await quotesService.create({
              ...backendQuoteData,
              clientReference: ensureQuoteClientReference(),
            });
          } else {
            // Re-throw other errors
            throw updateError;
          }
        }
      } else {
        // Create new quote
        response = await quotesService.create({
          ...backendQuoteData,
          clientReference: ensureQuoteClientReference(),
        });
      }
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        const quote = responseData?.quote || responseData;
        
        console.log('[App] Quote saved successfully:', quote);

        if (quote?.id != null) {
          const savedQuoteId = String(quote.id);
          setEditingQuoteId(savedQuoteId);
          setSelectedQuoteId(savedQuoteId);
        }
        
        // Transform backend quote response to preview format
        // Pass extrasNotesData to include account details and extra charges
        if (quote) {
          const previewData = transformBackendQuoteToPreview(
            quote,
            {
              quoteName: overviewData.projectName,
              siteAddress: overviewData.siteAddress,
              customerContact: '',
              paymentTerms: overviewData.paymentTerms,
              customPaymentTerms: overviewData.customPaymentTerms,
              additionalNotes: data.additionalNotes,
            },
            data // Pass extrasNotesData to include account details and charges
          );
          setGeneratedQuote(previewData);
        }
        
        // Clear draftProjectId after successful quote creation (if it was a project quote)
        if (draftProjectId) {
          setDraftProjectId(null);
          console.log('[App] Draft project ID cleared after successful quote creation');
          // Refresh projects list to update status after quote creation
          setRefreshProjects(prev => prev + 1);
        }
        
        clearStandaloneQuoteData();
        setIsSavingQuote(false);
        // Don't clear editingQuoteId yet - keep it so preview shows correct breadcrumb; clear when leaving preview
        // Don't clear generatedQuote - preserve it for navigation
        navigate('quoteFinalPreview');
      } else {
        const errorMessage = (response as any)?.message || 'Failed to save quote';
        console.error('[App] Quote save failed:', errorMessage);
        alert(`Failed to save quote: ${errorMessage}. Please try again.`);
        setIsSavingQuote(false);
      }
    } catch (error: any) {
      console.error('[App] Error saving quote:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
      alert(`Error saving quote: ${errorMessage}. Please try again.`);
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
        items: listData.items.map((item: any) => {
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0;
          const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0;
          const totalPrice = item.total ?? (quantity * unitPrice);
          return {
            description: item.description || '',
            quantity,
            unitPrice,
            totalPrice: typeof totalPrice === 'number' ? totalPrice : quantity * unitPrice,
          };
        }),
        total: typeof listData.total === 'number' ? listData.total : parseFloat(String(listData.total)) || 0,
        preparedBy: listData.preparedBy || '',
        date: listData.date || new Date().toISOString(),
      };

      // Call API to save material list
      const response = await materialListsService.create(requestData);
      
      const normalizedResponse = normalizeApiResponse(response);
      if (isApiResponseSuccess(normalizedResponse)) {
        invalidateMaterialListsCache();
        setRefreshMaterialLists(prev => prev + 1);
        navigate('material-list');
      } else {
        const msg = (normalizedResponse as any)?.message || 'Failed to save material list';
        alert(`Save failed: ${msg}. Please try again.`);
      }
    } catch (error: any) {
      console.error('[App] Error saving material list:', error);
      const msg = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
      alert(`Error saving draft: ${msg}. Please try again.`);
    }
  };

  const handlePreviewMaterialList = (listData: any) => {
    setMaterialListPreviewData(listData);
    navigate('materialListPreview');
  };

  const handleDeleteMaterialList = async (list: { id: string }) => {
    const numId = parseInt(list.id, 10);
    if (!isNaN(numId)) {
      try {
        await materialListsService.delete(numId);
        setSelectedMaterialListId(null);
        invalidateMaterialListsCache();
        setRefreshMaterialLists(prev => prev + 1);
        navigate('material-list');
      } catch (error: any) {
        console.error('[App] Error deleting material list:', error);
        alert(`Failed to delete: ${error?.response?.data?.message || error?.message}. Please try again.`);
      }
    } else {
      // Sample/demo data - just navigate back
      setSelectedMaterialListId(null);
      navigate('material-list');
    }
  };

  const handleDuplicateMaterialList = (list: import('@/types').FullMaterialList) => {
    setDuplicateMaterialListData({ ...list, id: `dup-${Date.now()}` });
    setSelectedMaterialListId(null);
    navigate('createMaterialList');
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
      <div className="flex h-full min-h-0 overflow-hidden bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-20">
          <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
          <NewProjectScreen onBack={goBack} onGenerateQuote={handleGenerateQuote} />
        </div>
      </div>
    );
  }

  if (currentView === 'quotes') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuotesScreen 
              onNewQuote={handleNewQuote} 
              onViewQuote={handleViewQuote} 
              onEditQuote={handleEditQuote}
              onDeleteQuote={handleDeleteQuote}
              onBack={() => navigate('home')} 
              refreshTrigger={refreshQuotes} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quotePreview' && generatedQuote) {
    return <QuotePreviewScreen quote={generatedQuote} onBack={() => navigate('quotes')} onEdit={() => {
      if (editingQuoteId) {
        handleEditQuote(editingQuoteId);
      } else {
        handleNewQuote();
      }
    }} />;
  }

  if (currentView === 'quoteDetail' && selectedQuoteId) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteDetailScreen
              quoteId={selectedQuoteId}
              onBack={() => navigate('quotes')}
              onEdit={() => handleEditQuote(selectedQuoteId)}
              onDelete={handleDeleteQuote}
              isEditLoading={isEditQuoteLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <SettingsScreen onNavigate={handleNavigate} />
          </div>
        </div>
      </div>
    );
  }

  // Credits History Screen
  if (currentView === 'creditsHistory') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <CreditsHistoryScreen onBack={() => navigate('billings')} />
          </div>
        </div>
      </div>
    );
  }

  // Payment callback handler - check URL params or non-expired callback storage
  const hasPaymentCallback =
    hasPaymentCallbackUrlParams() || hasActivePaymentCallback();

  if (hasPaymentCallback && (currentView === 'home' || !currentView)) {
    return (
      <PaymentCallbackScreen
        onSuccess={() => {
          clearPaymentCallback();
          navigate('billings');
        }}
        onFailure={(error) => {
          console.error('Payment callback error:', error);
          clearPaymentCallback();
          navigate('subscriptionPlans');
        }}
        onDismiss={() => {
          clearPaymentCallback();
          navigate('billings');
        }}
      />
    );
  }

  if (currentView === 'templates') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <TemplatesScreen
              onBack={() => navigate('home')}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'help') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <HelpAndTipsScreen onBack={goBack} />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'feedback') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <FeedbackContactScreen onBack={goBack} onNavigate={handleNavigate} />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'material-list') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <MaterialListScreen onBack={() => navigate('home')} onViewList={handleViewMaterialList} onCreateNewList={handleCreateNewMaterialList} refreshTrigger={refreshMaterialLists} />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'materialListDetail' && selectedMaterialListId) {
    if (materialListDetailLoading) {
      return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA] items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
          <p className="text-gray-600">Loading material list...</p>
        </div>
      );
    }
    if (!materialListDetailData) {
      return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA] items-center justify-center px-6 text-center">
          <p className="text-gray-700 font-medium mb-4">Could not load this material list.</p>
          <button
            type="button"
            onClick={() => navigate('material-list')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Back to Material Lists
          </button>
        </div>
      );
    }
    const displayData = materialListDetailData;
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <MaterialListDetailScreen
              list={displayData}
              onBack={() => navigate('material-list')}
              onEdit={() => {
                setEditingMaterialList(displayData);
                navigate('editMaterialList');
              }}
              onDelete={() => handleDeleteMaterialList(displayData)}
              onDuplicate={() => handleDuplicateMaterialList(displayData)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'editMaterialList' && editingMaterialList) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
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
      </div>
    );
  }

  if (currentView === 'materialListPreview' && materialListPreviewData) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="material-list"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <MaterialListPreviewScreen
              list={materialListPreviewData}
              onBack={() => navigate('createMaterialList')}
              onDuplicate={() => {
                setDuplicateMaterialListData({ ...materialListPreviewData!, id: `dup-${Date.now()}` });
                navigate('createMaterialList');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'createMaterialList') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="material-list"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <CreateMaterialListScreen
              onBack={() => navigate('material-list')}
              onPreview={handlePreviewMaterialList}
              onSaveDraft={handleSaveMaterialListDraft}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projects') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectsScreen 
              refreshTrigger={refreshProjects}
              onNewProject={handleNewProject} 
              onBack={() => navigate('home')}
              onViewProject={handleViewProject}
              onEditProject={handleProjectEdit}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projectDetail' && selectedProjectId) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="projects"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectDetailScreen
              projectId={selectedProjectId}
              onBack={() => {
                setSelectedProjectId(null);
                navigate('projects');
              }}
              onEdit={handleProjectEdit}
              onAddDimensions={handleAddDimensions}
              onDelete={handleProjectDeleted}
              onCalculate={handleProjectCalculate}
              onViewResults={handleViewResults}
              onModifyDimensionsRecalculate={handleModifyDimensionsRecalculate}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projectEdit' && selectedProjectId) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="projects"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
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
      </div>
    );
  }

  if (currentView === 'projectDescription') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectDescriptionScreen
              onBack={() => {
                if (projectFlowFromDetail && selectedProjectId) {
                  navigate('projectDetail');
                } else {
                  goBack();
                }
              }}
              onNext={handleProjectDescriptionNext}
              previousData={projectDescriptionData ?? undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'selectProject') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <SelectProjectScreen
              onBack={() => {
                if (projectFlowFromDetail && selectedProjectId) {
                  navigate('projectDetail');
                } else {
                  navigate('projectDescription');
                }
              }}
              onNext={handleSelectProjectNext}
              previousData={selectProjectData}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projectMeasurement') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectMeasurementScreen
              isRecalculate={projectWasCalculated}
              initialMeasurementData={projectMeasurementData}
              onBack={() => {
                if (projectFlowFromDetail && selectedProjectId) {
                  navigate('projectDetail');
                } else {
                  navigate('selectProject');
                }
              }}
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
              onRecalculate={(data) => {
                setInitialCalculationResult(null);
                setProjectMeasurementData(data);
                navigate('projectSolution');
              }}
              previousData={selectProjectData}
              onNavigateToStep={(step) => navigate(step as any)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projectSolution') {
    const combinedData = getCombinedProjectData();
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectSolutionScreen
              onBack={() => {
                if (projectFlowFromDetail && selectedProjectId) {
                  navigate('projectDetail');
                } else {
                  setProjectWasCalculated(true);
                  navigate('projectMeasurement');
                }
              }}
              onNavigateToStep={(step) => navigate(step as any)}
              onGenerate={handleProjectSolutionGenerate}
              onNavigateToEstimationPricing={() => {
                if (!draftProjectId) {
                  console.warn('[App] Generate quote requires a calculated project');
                  return;
                }
                navigate('projectEstimationPricing');
              }}
              previousData={combinedData || undefined}
              initialCalculationResult={initialCalculationResult}
              draftProjectId={draftProjectId}
              onProjectSaved={() => {
                console.log('[App] Project saved successfully, keeping draftProjectId for quote creation');
                setRefreshProjects(prev => prev + 1);
              }}
              onCalculationComplete={(result) => setInitialCalculationResult(result)}
              onCalculatedProjectId={(id) => setDraftProjectId(id)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projectEstimationPricing') {
    const combinedData = getCombinedProjectData();
    if (!draftProjectId || !combinedData) {
      navigate('projectSolution');
      return null;
    }
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <ProjectEstimationPricingScreen
              onBack={() => navigate('projectSolution')}
              projectId={draftProjectId}
              previousData={combinedData}
              calculationResult={initialCalculationResult}
              onPreviewAccepted={handleEstimationPreviewAccepted}
            />
          </div>
        </div>
      </div>
    );
  }

  // QuoteConfiguration screen removed
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
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteOverviewScreen
              onBack={() => {
                if (editingQuoteId) {
                  navigate(selectedQuoteId ? 'quoteDetail' : 'quotes');
                } else if (draftProjectId) {
                  navigate('projectEstimationPricing');
                } else {
                  navigate('quotes');
                }
              }}
              onNext={handleQuoteOverviewNext}
              previousData={standaloneQuoteData}
              editingQuoteId={editingQuoteId}
              onNavigateToExtras={(data?) => {
                if (data) updateStandaloneQuoteOverview(data);
                navigate('quoteExtrasNotes');
              }}
              onNavigateToItemList={editingQuoteId ? undefined : (data) => {
                updateStandaloneQuoteOverview(data);
                navigate('quoteItemList');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quoteItemList') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteItemListScreen
              onBack={() => navigate('quoteOverview')}
              onNext={handleQuoteItemListNext}
              previousData={standaloneQuoteData}
              quoteType={draftProjectId ? 'from_project' : 'standalone'}
              materialCost={draftProjectId ? materialCostFromStep4 : undefined}
              editingQuoteId={editingQuoteId}
              onNavigateToOverview={(data) => {
                updateStandaloneQuoteItemList(data);
                navigate('quoteOverview');
              }}
              onNavigateToExtras={(data) => {
                updateStandaloneQuoteItemList(data);
                navigate('quoteExtrasNotes');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quoteExtrasNotes') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteExtrasNotesScreen
              onBack={() => navigate('quoteItemList')}
              onPreview={handleQuoteExtrasNotesPreview}
              onSaveDraft={handleQuoteExtrasNotesSaveDraft}
              previousData={standaloneQuoteData}
              onNavigate={handleNavigate}
              editingQuoteId={editingQuoteId}
              isPreviewLoading={isSavingQuote}
              isSaveDraftLoading={isSavingDraft}
              onNavigateToOverview={(data) => {
                updateStandaloneQuoteExtrasNotes(data);
                navigate('quoteOverview');
              }}
              onNavigateToItemList={(data) => {
                updateStandaloneQuoteExtrasNotes(data);
                navigate('quoteItemList');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state for saving quote
  if (isSavingQuote) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600 text-lg">Saving changes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'quoteFinalPreview' && generatedQuote) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
        <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentView="quotes"
            onNavigate={handleNavigate}
          />
          <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[336px]">
            <QuoteFinalPreviewScreen
              onBack={() => {
                setEditingQuoteId(null);
                navigate('quotes');
              }}
              onEdit={() => {
                const quoteId = editingQuoteId || selectedQuoteId;
                if (quoteId) {
                  handleEditQuote(quoteId);
                } else {
                  navigate('quotes');
                }
              }}
              isEditLoading={isEditQuoteLoading}
              onDownloadPDF={() => {
                if (generatedQuote) {
                  import('@/services/export/exportService').then(({ exportQuoteToPDF }) => {
                    exportQuoteToPDF(generatedQuote);
                  });
                }
              }}
              previousData={generatedQuote}
              editingQuoteId={editingQuoteId}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FAFAFA]">
      {/* Header - Full width, aligned with sidebar */}
      <div className={!['home', 'projects', 'quotes', 'material-list'].includes(currentView) ? 'hidden md:block' : ''}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* Main Content Area - Starts below header, accounts for sidebar */}
        <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 min-w-0 lg:ml-[360px]">
          <div className="flex-1 overflow-y-auto min-h-0">
            {currentView === 'home' && <HomeScreen onNewProject={handleNewProject} onNavigate={handleNavigate} />}
          </div>
        </div>
      </div>

      {/* Log Viewer - Accessible via Ctrl+Shift+L / Cmd+Shift+L */}
      {import.meta.env.DEV && (
        <LogViewer isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />
      )}

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onConfirm={handleSessionExpiredConfirm}
        message={sessionExpiredMessage}
      />
    </div>
  );
};

export default App;
