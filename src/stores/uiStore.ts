import { create } from 'zustand';

interface UIState {
  // Navigation
  currentView: string;
  previousView: string;
  
  // Sidebar
  isSidebarOpen: boolean;
  
  // Actions
  setCurrentView: (view: string) => void;
  setPreviousView: (view: string) => void;
  navigate: (view: string) => void;
  goBack: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  currentView: 'home',
  previousView: 'home',
  isSidebarOpen: false,
  
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
}));

