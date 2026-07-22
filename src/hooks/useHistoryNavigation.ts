import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/**
 * Hook to synchronize browser history (HTML5 History API) with Zustand UI store.
 * Handles mobile physical/gesture back button presses without losing in-memory application state.
 */
export function useHistoryNavigation(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { currentView, navigateFromHistory, setSidebarOpen } = useUIStore.getState();

    // Determine initial view from history state or URL hash
    let initialView = currentView;
    if (window.history.state?.view) {
      initialView = window.history.state.view;
    } else if (window.location.hash) {
      const hashView = window.location.hash.slice(1);
      if (hashView) {
        initialView = hashView;
      }
    }

    // Set initial history state cleanly
    window.history.replaceState({ view: initialView }, '', `#${initialView}`);
    if (initialView !== currentView) {
      navigateFromHistory(initialView);
    }

    // Handle mobile back gesture / browser back & forward buttons
    const handlePopState = (event: PopStateEvent) => {
      const { isSidebarOpen, setSidebarOpen, navigateFromHistory, currentView } = useUIStore.getState();

      // If sidebar is open on mobile, close drawer first before navigating back
      if (isSidebarOpen) {
        setSidebarOpen(false);
        window.history.pushState({ view: currentView }, '', `#${currentView}`);
        return;
      }

      const targetView = event.state?.view || (window.location.hash ? window.location.hash.slice(1) : 'home');
      if (targetView) {
        navigateFromHistory(targetView);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
