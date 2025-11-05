
import React, { useState, useEffect, useCallback } from 'react';

// Import components
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import SetupWorkspaceScreen from './components/SetupWorkspaceScreen';
import HomeScreen from './components/HomeScreen';
import ProjectsScreen from './components/ProjectsScreen';
import Sidebar from './components/Sidebar';
import NewProjectScreen from './components/NewProjectScreen';
import QuotesScreen from './components/QuotesScreen';
import QuotePreviewScreen from './components/QuotePreviewScreen';
import QuoteDetailScreen from './components/QuoteDetailScreen';
import SettingsScreen from './components/SettingsScreen';
import ProfileScreen from './components/ProfileScreen';
import SubscriptionPlanScreen from './components/SubscriptionPlanScreen';
import HelpAndTipsScreen from './components/HelpAndTipsScreen';
import MaterialListScreen from './components/MaterialListScreen';
import MaterialListDetailScreen from './components/MaterialListDetailScreen';
import CreateMaterialListScreen from './components/CreateMaterialListScreen';
import MaterialListPreviewScreen from './components/MaterialListPreviewScreen';
import ProjectDescriptionScreen from './components/ProjectDescriptionScreen';
import SelectProjectScreen from './components/SelectProjectScreen';


// Import types and constants
import type { FloorPlan, Tool, EstimateCategory, QuotePreviewData, FullMaterialList } from './types';
import { sampleFloorPlan, initialEstimates, sampleFullQuotes, sampleFullMaterialLists } from './constants';

const PIXELS_PER_FOOT = 10; // 10 pixels = 1 foot
const WALL_HEIGHT_FEET = 8;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [previousView, setPreviousView] = useState('home');
  const [generatedQuote, setGeneratedQuote] = useState<QuotePreviewData | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedMaterialListId, setSelectedMaterialListId] = useState<string | null>(null);
  const [materialListPreviewData, setMaterialListPreviewData] = useState<FullMaterialList | null>(null);


  const [floorPlan, setFloorPlan] = useState<FloorPlan>({ walls: [], doors: [], windows: [] });
  const [activeTool, setActiveTool] = useState<Tool>('SELECT');
  const [estimates, setEstimates] = useState<EstimateCategory[]>(initialEstimates);
  const [projectDescriptionData, setProjectDescriptionData] = useState<any>(null);
  const [selectProjectData, setSelectProjectData] = useState<any>(null);

  // Splash screen, onboarding, and auth flow
  const handleSplashComplete = () => {
    setIsLoading(false);
    const onboardingShown = localStorage.getItem('onboardingShown');
    const userAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (userAuthenticated === 'true') {
      setIsAuthenticated(true);
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
    setIsSettingUp(true);
    // Simulate API call and workspace setup
    setTimeout(() => {
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        setIsSettingUp(false);
    }, 2500); // Show setup screen for 2.5s
  };

  const handleLogin = () => {
    // Simulate a successful login
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  }

  const handleNavigate = (view: string) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleNewProject = () => {
    setPreviousView(currentView);
    setCurrentView('projectDescription');
  };

  const handleProjectDescriptionNext = (data: any) => {
    setProjectDescriptionData(data);
    setCurrentView('selectProject');
  };

  const handleSelectProjectNext = (data: any) => {
    setSelectProjectData(data);
    // For now, navigate to the existing newProject flow
    // In the future, this would go to step 3, 4 of the project creation flow
    setCurrentView('newProject');
  };
  
  const handleGenerateQuote = (quoteData: QuotePreviewData) => {
    setGeneratedQuote(quoteData);
    setPreviousView(currentView); // Save the current view (likely 'newProject')
    setCurrentView('quotePreview');
  };

  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setPreviousView(currentView);
    setCurrentView('quoteDetail');
  };
  
  const handleViewMaterialList = (listId: string) => {
    setSelectedMaterialListId(listId);
    setPreviousView(currentView);
    setCurrentView('materialListDetail');
  };

  const handleCreateNewMaterialList = () => {
    setPreviousView(currentView);
    setCurrentView('createMaterialList');
  };

  const handleSaveMaterialListDraft = (listData: FullMaterialList) => {
    // In a real app, you would save this to a backend or local storage
    // For now, we'll just navigate back to the material list screen
    // The draft would be stored in the MaterialListScreen's state or a global store
    setCurrentView('material-list');
  };

  const handlePreviewMaterialList = (listData: FullMaterialList) => {
    setMaterialListPreviewData(listData);
    setPreviousView(currentView);
    setCurrentView('materialListPreview');
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
      return <LoginScreen onLogin={handleLogin} onCreateAccount={() => setAuthScreen('register')} />;
    }
    return <RegistrationScreen onRegister={handleRegistrationComplete} onSwitchToLogin={() => setAuthScreen('login')} />;
  }
  
  if (currentView === 'newProject') {
    return <NewProjectScreen onBack={() => setCurrentView(previousView)} onGenerateQuote={handleGenerateQuote} />;
  }
  
  if (currentView === 'quotePreview' && generatedQuote) {
    return <QuotePreviewScreen quote={generatedQuote} onBack={() => setCurrentView('quotes')} onEdit={() => setCurrentView('newProject')} />;
  }
  
  if (currentView === 'quoteDetail' && selectedQuoteId) {
    const quoteData = sampleFullQuotes.find(q => q.id === selectedQuoteId);
    if (quoteData) {
      return <QuoteDetailScreen quote={quoteData} onBack={() => setCurrentView('quotes')} />;
    }
    // Fallback if quote not found
    setCurrentView('quotes');
    return null;
  }
  
  if (currentView === 'settings') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        <SettingsScreen onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentView === 'profile') {
    return <ProfileScreen onBack={() => setCurrentView(previousView)} />;
  }

  if (currentView === 'subscriptionPlans') {
    return <SubscriptionPlanScreen onBack={() => setCurrentView(previousView)} />;
  }
  
  if (currentView === 'help') {
    return <HelpAndTipsScreen onBack={() => setCurrentView(previousView)} />;
  }
  
  if (currentView === 'material-list') {
    return <MaterialListScreen onBack={() => setCurrentView('home')} onViewList={handleViewMaterialList} onCreateNewList={handleCreateNewMaterialList} />;
  }
  
  if (currentView === 'materialListDetail' && selectedMaterialListId) {
    const listData = sampleFullMaterialLists.find(l => l.id === selectedMaterialListId);
    // Find a fallback or default if listData is not found
    const displayData = listData || sampleFullMaterialLists[0];
    return <MaterialListDetailScreen list={displayData} onBack={() => setCurrentView('material-list')} />;
  }

  if (currentView === 'materialListPreview' && materialListPreviewData) {
    return <MaterialListPreviewScreen list={materialListPreviewData} onBack={() => setCurrentView('createMaterialList')} />;
  }

  if (currentView === 'createMaterialList') {
    return <CreateMaterialListScreen onBack={() => setCurrentView('material-list')} onPreview={handlePreviewMaterialList} onSaveDraft={handleSaveMaterialListDraft} />;
  }

  if (currentView === 'projectDescription') {
    return <ProjectDescriptionScreen onBack={() => setCurrentView(previousView)} onNext={handleProjectDescriptionNext} />;
  }

  if (currentView === 'selectProject') {
    return <SelectProjectScreen onBack={() => setCurrentView('projectDescription')} onNext={handleSelectProjectNext} previousData={projectDescriptionData} />;
  }

  return (
    <div className="flex flex-col h-screen bg-main text-text-primary font-exo">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        onNavigate={handleNavigate}
      />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex-1 overflow-y-auto">
        {currentView === 'home' && <HomeScreen onNewProject={handleNewProject} />}
        {currentView === 'projects' && <ProjectsScreen />}
        {currentView === 'quotes' && <QuotesScreen onNewQuote={handleNewProject} onViewQuote={handleViewQuote} />}
      </div>
    </div>
  );
};

export default App;
