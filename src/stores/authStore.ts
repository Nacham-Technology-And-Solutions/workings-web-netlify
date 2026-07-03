import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '@/utils/logger';
import { userService } from '@/services/api/user.service';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  companyName?: string;
  companyAddress?: string | null;
  companyLogoUrl?: string | null;
  profilePhotoUrl?: string | null;
  subscriptionStatus?: 'free' | 'pro' | 'starter' | 'enterprise';
  pointsBalance?: number;
  hasPassword?: boolean;
  pendingEmail?: string | null;
  emailVerified?: boolean;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  } | null;
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
  hydrateUserProfile: () => Promise<void>;
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
        const existingUser = get().user;

        if (isAuth && accessToken && refreshToken && userId && userEmail) {
          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: {
              ...existingUser,
              id: parseInt(userId, 10),
              email: userEmail,
            },
          });
        }

        const onboardingShown = localStorage.getItem('onboardingShown');
        if (!onboardingShown) {
          set({ showOnboarding: true });
        }

        // Only hide loading immediately for returning users; new users see splash first (splash sets loading false after 2.5s)
        if (isAuth || onboardingShown) {
          set({ isLoading: false });
        }
      },

      hydrateUserProfile: async () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user?.id) return;

        try {
          const response = await userService.getProfile(user.id);
          const normalized = normalizeApiResponse(response);

          if (normalized.success && normalized.response) {
            const responseData = normalized.response as {
              userProfile?: Record<string, unknown>;
              user?: Record<string, unknown>;
            };
            const profile = (responseData.userProfile || responseData.user || normalized.response) as {
              name?: string;
              email?: string;
              companyName?: string;
              companyAddress?: string | null;
              companyLogoUrl?: string | null;
              profilePhotoUrl?: string | null;
              subscriptionStatus?: string;
              pointsBalance?: number;
              hasPassword?: boolean;
              pendingEmail?: string | null;
              emailVerified?: boolean;
              bankDetails?: UserProfile['bankDetails'];
            };

            get().updateUser({
              name: profile.name,
              email: profile.email,
              companyName: profile.companyName,
              companyAddress: profile.companyAddress,
              companyLogoUrl: profile.companyLogoUrl,
              profilePhotoUrl: profile.profilePhotoUrl,
              subscriptionStatus: profile.subscriptionStatus as UserProfile['subscriptionStatus'],
              pointsBalance: profile.pointsBalance,
              hasPassword: profile.hasPassword,
              pendingEmail: profile.pendingEmail,
              emailVerified: profile.emailVerified,
              bankDetails: profile.bankDetails,
            });
          }
        } catch (error) {
          console.error('[AuthStore] Failed to hydrate user profile:', error);
        }
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

