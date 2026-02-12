import { create } from 'zustand';

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
  navigate: (view: string) => void;
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
  
  navigate: (view) => {
    const current = get().currentView;
    set({
      previousView: current,
      currentView: view,
      isSidebarOpen: false,
    });
  },
  
  goBack: () => {
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

