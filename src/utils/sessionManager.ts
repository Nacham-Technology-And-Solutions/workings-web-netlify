/**
 * Session Management Utilities
 * Handles session expiration events and notifications
 */

export interface SessionExpirationEvent {
  type: 'SESSION_EXPIRED' | 'SESSION_REFRESH_FAILED';
  message: string;
  timestamp: number;
}

type SessionExpirationListener = (event: SessionExpirationEvent) => void;

const listeners: Set<SessionExpirationListener> = new Set();

/**
 * Subscribe to session expiration events
 */
export function onSessionExpired(callback: SessionExpirationListener): () => void {
  listeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify all listeners about session expiration
 */
export function notifySessionExpired(
  type: SessionExpirationEvent['type'],
  message: string = 'Your session has expired. Please sign in again to continue.'
): void {
  const event: SessionExpirationEvent = {
    type,
    message,
    timestamp: Date.now(),
  };

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('[SessionManager] Error in session expiration listener:', error);
    }
  });
}

/**
 * Clear authentication data
 */
export function clearAuthData(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');
  
  // Clear auth store if available
  import('@/stores')
    .then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    })
    .catch(() => {
      // Store might not be available, continue anyway
    });
}
