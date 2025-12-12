import { create } from 'zustand';

interface SyncState {
  // Online/Offline status
  isOnline: boolean;
  
  // Pending sync operations
  pendingSyncs: Array<{
    id: string;
    type: 'project' | 'quote' | 'material-list';
    data: unknown;
    timestamp: number;
  }>;
  
  // Actions
  setIsOnline: (online: boolean) => void;
  addPendingSync: (sync: SyncState['pendingSyncs'][0]) => void;
  removePendingSync: (id: string) => void;
  clearPendingSyncs: () => void;
  initializeOnlineStatus: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncs: [],
  
  // Actions
  setIsOnline: (online) => set({ isOnline: online }),
  
  addPendingSync: (sync) => set((state) => ({
    pendingSyncs: [...state.pendingSyncs, sync],
  })),
  
  removePendingSync: (id) => set((state) => ({
    pendingSyncs: state.pendingSyncs.filter((sync) => sync.id !== id),
  })),
  
  clearPendingSyncs: () => set({ pendingSyncs: [] }),
  
  initializeOnlineStatus: () => {
    if (typeof navigator === 'undefined') return;
    
    const updateOnlineStatus = () => {
      set({ isOnline: navigator.onLine });
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    set({ isOnline: navigator.onLine });
  },
}));

