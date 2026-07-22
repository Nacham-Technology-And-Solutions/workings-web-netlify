import { create } from 'zustand';
import { isSettingsSectionView, setStoredSettingsSection } from '@/utils/settingsNavigation';

interface UIState {
  // Navigation
  currentView: string;
  previousView: string;
  
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Actions
  setCurrentView: (view: string) => void;
  setPreviousView: (view: string) => void;
  navigate: (view: string, options?: { replace?: boolean; skipHistory?: boolean }) => void;
  navigateFromHistory: (view: string) => void;
  goBack: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  currentView: 'home',
  previousView: 'home',
  isSidebarOpen: false,
  isSidebarCollapsed: (() => {
    // Check localStorage for saved collapse state, default to expanded (false = not collapsed)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  })(),
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setPreviousView: (view) => set({ previousView: view }),
  
  navigate: (view, options) => {
    const current = get().currentView;
    const nextView = isSettingsSectionView(view) ? 'settings' : view;

    if (isSettingsSectionView(view)) {
      setStoredSettingsSection(view);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('settingsDirectSection', view);
      }
    } else if (view === 'settings') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('settingsDirectSection');
      }
    }

    if (!options?.skipHistory && typeof window !== 'undefined' && window.history) {
      const stateObj = { view: nextView };
      const hash = `#${nextView}`;
      if (options?.replace) {
        window.history.replaceState(stateObj, '', hash);
      } else if (current !== nextView) {
        window.history.pushState(stateObj, '', hash);
      }
    }

    set({
      previousView: current,
      currentView: nextView,
      isSidebarOpen: false,
    });
  },

  navigateFromHistory: (view) => {
    const current = get().currentView;
    const nextView = isSettingsSectionView(view) ? 'settings' : view;

    if (isSettingsSectionView(view)) {
      setStoredSettingsSection(view);
    }

    set({
      previousView: current,
      currentView: nextView,
      isSidebarOpen: false,
    });
  },
  
  goBack: () => {
    if (typeof window !== 'undefined' && window.history && window.history.state?.view) {
      window.history.back();
      return;
    }

    const previous = get().previousView;
    set({
      currentView: previous,
      previousView: 'home',
    });
  },
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarCollapsed: (collapsed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    }
    set({ isSidebarCollapsed: collapsed });
  },
}));

