import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '@/utils/logger';

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  companyName?: string;
  subscriptionStatus?: 'free' | 'pro' | 'starter' | 'enterprise';
  pointsBalance?: number;
}

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  showOnboarding: boolean;
  isSettingUp: boolean;
  
  // User data
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Auth screen state
  authScreen: 'login' | 'register' | 'forgot-password' | 'reset-password';
  resetPasswordToken: string | null;
  resetPasswordEmail: string | null;
  
  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  setSettingUp: (settingUp: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuthScreen: (screen: 'login' | 'register' | 'forgot-password' | 'reset-password') => void;
  setResetPasswordData: (token: string | null, email: string | null) => void;
  login: (accessToken: string, refreshToken: string, userProfile: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true,
      showOnboarding: false,
      isSettingUp: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      authScreen: 'login',
      resetPasswordToken: null,
      resetPasswordEmail: null,
      
      // Actions
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),
      setShowOnboarding: (show) => set({ showOnboarding: show }),
      setSettingUp: (settingUp) => set({ isSettingUp: settingUp }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Also update localStorage for API client
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      },
      setAuthScreen: (screen) => set({ authScreen: screen }),
      setResetPasswordData: (token, email) => 
        set({ resetPasswordToken: token, resetPasswordEmail: email }),
      
      login: (accessToken, refreshToken, userProfile) => {
        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          user: userProfile,
        });
        // Update localStorage for API client
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userProfile.id.toString());
        localStorage.setItem('userEmail', userProfile.email);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Log successful login
        logger.logAuthEvent('User logged in successfully', {
          userId: userProfile.id,
          email: userProfile.email,
          subscriptionStatus: userProfile.subscriptionStatus,
        });
      },
      
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      
      logout: () => {
        const userId = get().user?.id;
        const userEmail = get().user?.email;
        
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          authScreen: 'login',
        });
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAuthenticated');
        
        // Log logout
        logger.logAuthEvent('User logged out', {
          userId,
          email: userEmail,
        });
      },
      
      initializeAuth: () => {
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        
        if (isAuth && accessToken && refreshToken && userId && userEmail) {
          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: {
              id: parseInt(userId),
              email: userEmail,
            },
          });
        }
        
        const onboardingShown = localStorage.getItem('onboardingShown');
        if (!onboardingShown) {
          set({ showOnboarding: true });
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

