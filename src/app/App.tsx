
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
import { projectsService } from '../services/api';

// Import types and constants
import type { FloorPlan, Tool, EstimateCategory } from '../types';
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
  } = useProjectStore();

  const {
    generatedQuote,
    selectedQuoteId,
    setGeneratedQuote,
    setSelectedQuoteId,
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

  const handleProjectCalculate = (projectId: string) => {
    // Navigate to project solution with project data
    // For now, just show a message - can be enhanced later
    console.log('Calculate project:', projectId);
    // TODO: Load project data and navigate to solution screen
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
    navigate('newProject');
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

      await projectsService.create(projectData);
      // Note: We don't show error to user here as this is a background save
      // The project will be saved again later with full data
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
    // Create quote from project solution with material cost
    handleCreateQuoteFromSolution(materialCost);
  };

  const handleCreateQuoteFromSolution = (materialCost?: number) => {
    // Store material cost for quote configuration
    if (materialCost !== undefined) {
      setMaterialCostFromStep4(materialCost);
    }
    // Navigate to quote configuration screen
    navigate('quoteConfiguration');
  };

  const handleQuoteConfigurationComplete = (quoteData: any) => {
    // Handle final quote generation (could save to database, generate PDF, etc.)
    console.log('Quote generated:', quoteData);
    // For now, navigate back to home
    navigate('home');
  };

  const handleGenerateQuote = (quoteData: any) => {
    setGeneratedQuote(quoteData);
    navigate('quotePreview');
  };

  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    navigate('quoteDetail');
  };

  const handleViewMaterialList = (listId: string) => {
    setSelectedMaterialListId(listId);
    navigate('materialListDetail');
  };

  const handleCreateNewMaterialList = () => {
    navigate('createMaterialList');
  };

  const handleSaveMaterialListDraft = (listData: any) => {
    // In a real app, you would save this to a backend or local storage
    // For now, we'll just navigate back to the material list screen
    navigate('material-list');
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
    return <NewProjectScreen onBack={goBack} onGenerateQuote={handleGenerateQuote} />;
  }

  if (currentView === 'quotes') {
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
          <QuotesScreen onNewQuote={handleNewQuote} onViewQuote={handleViewQuote} onBack={() => navigate('home')} />
        </div>
      </div>
    );
  }

  if (currentView === 'quotePreview' && generatedQuote) {
    return <QuotePreviewScreen quote={generatedQuote} onBack={() => navigate('quotes')} onEdit={() => navigate('newProject')} />;
  }

  if (currentView === 'quoteDetail' && selectedQuoteId) {
    const quoteData = sampleFullQuotes.find(q => q.id === selectedQuoteId);
    if (quoteData) {
      return <QuoteDetailScreen quote={quoteData} onBack={() => navigate('quotes')} />;
    }
    // Fallback if quote not found
    navigate('quotes');
    return null;
  }

  if (currentView === 'settings') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <SettingsScreen onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} />
        </div>
      </div>
    );
  }

  // Credits History Screen
  if (currentView === 'creditsHistory') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView="settings"
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <CreditsHistoryScreen onBack={() => navigate('profile')} />
        </div>
      </div>
    );
  }

  // Profile and Subscription Plans are now handled within SettingsScreen
  // Redirect to settings if someone tries to navigate directly to these views
  if (currentView === 'profile' || currentView === 'subscriptionPlans') {
    const targetSection = currentView === 'subscriptionPlans' ? 'subscriptionPlans' : 'profile';
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView="settings"
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <SettingsScreen 
            onMenuClick={() => setSidebarOpen(true)} 
            onNavigate={handleNavigate}
            initialSection={targetSection}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'help') {
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
          <HelpAndTipsScreen onBack={goBack} />
        </div>
      </div>
    );
  }

  if (currentView === 'material-list') {
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
          <MaterialListScreen onBack={() => navigate('home')} onViewList={handleViewMaterialList} onCreateNewList={handleCreateNewMaterialList} />
        </div>
      </div>
    );
  }

  if (currentView === 'materialListDetail' && selectedMaterialListId) {
    const listData = sampleFullMaterialLists.find(l => l.id === selectedMaterialListId);
    // Find a fallback or default if listData is not found
    const displayData = listData || sampleFullMaterialLists[0];
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
    );
  }

  if (currentView === 'editMaterialList' && editingMaterialList) {
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
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
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
    );
  }

  if (currentView === 'projectDetail' && selectedProjectId) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView="projects"
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <ProjectDetailScreen
            projectId={selectedProjectId}
            onBack={() => {
              setSelectedProjectId(null);
              navigate('projects');
            }}
            onEdit={handleProjectEdit}
            onDelete={handleProjectDeleted}
            onCalculate={handleProjectCalculate}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'projectEdit' && selectedProjectId) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView="projects"
          onNavigate={handleNavigate}
        />
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
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
    );
  }

  if (currentView === 'projectDescription') {
    return <ProjectDescriptionScreen onBack={goBack} onNext={handleProjectDescriptionNext} />;
  }

  if (currentView === 'selectProject') {
    return <SelectProjectScreen onBack={() => navigate('projectDescription')} onNext={handleSelectProjectNext} previousData={projectDescriptionData} />;
  }

  if (currentView === 'projectMeasurement') {
    return <ProjectMeasurementScreen onBack={() => navigate('selectProject')} onNext={handleProjectMeasurementNext} previousData={selectProjectData} />;
  }

  if (currentView === 'projectSolution') {
    const combinedData = getCombinedProjectData();
    return (
      <ProjectSolutionScreen
        onBack={() => navigate('projectMeasurement')}
        onGenerate={handleProjectSolutionGenerate}
        onCreateQuote={handleCreateQuoteFromSolution}
        previousData={combinedData || undefined}
      />
    );
  }

  if (currentView === 'quoteConfiguration') {
    return (
      <QuoteConfigurationScreen
        onBack={() => navigate('projectSolution')}
        onGenerateQuote={handleQuoteConfigurationComplete}
        materialCost={materialCostFromStep4}
        projectData={{
          projectName: projectDescriptionData?.projectName,
          customerName: projectDescriptionData?.customerName,
          siteAddress: projectDescriptionData?.siteAddress
        }}
      />
    );
  }

  return (
    <>
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* Main Content Area - Gap between sidebar and header */}
        <div className="flex flex-col flex-1 h-screen transition-all duration-300 min-w-0 lg:ml-20">
          <Header onMenuClick={() => setSidebarOpen(true)} />
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
