
import React, { useState } from 'react';
import Input from '@/components/common/Input';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon, AppleIcon } from '@/assets/icons/IconComponents';
import { authService } from '@/services/api';
import { extractErrorMessage, extractFieldErrors } from '@/utils/errorHandler';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useAuthStore } from '@/stores';

interface LoginScreenProps {
  onLogin: () => void;
  onCreateAccount: () => void;
  onForgotPassword?: () => void;
}

const SocialButton: React.FC<{
  provider: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ provider, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-lg text-text-secondary font-medium hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    aria-label={`Sign up with ${provider}`}
  >
    {icon}
    Sign up with {provider}
  </button>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCreateAccount, onForgotPassword }) => {
  const { login: loginStore } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await authService.login({
        email,
        password,
      });

      // Check if response is successful and has the expected structure
      if (response.response.accessToken && response.response) {
        const { accessToken, refreshToken, userProfile } = response.response;
        
        // Verify all required data is present
        if (accessToken && refreshToken && userProfile) {
          // Update auth store
          loginStore(accessToken, refreshToken, {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            companyName: userProfile.companyName,
            subscriptionStatus: userProfile.subscriptionStatus as 'free' | 'pro' | 'starter' | 'enterprise',
            pointsBalance: userProfile.pointsBalance,
          });

          // Call the onLogin callback to proceed with the flow
          onLogin();
          return;
        }
      }
      
      // If we reach here, login was not successful
      const errorMsg = response.message || 'Login failed. Please try again.';
      setError(errorMsg);
      // Try to get detailed message from API response
      const apiResponseData = (response as any)?.response || response;
      setDetailedError(apiResponseData?.message || apiResponseData?.error || null);
    } catch (err) {
      // Extract field-specific errors
      const errors = extractFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        // Extract general error message
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage.message);
        setDetailedError(errorMessage.detailedMessage || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-main z-40 font-exo overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto py-6 sm:py-8 lg:py-10">
        <div className="text-left mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary font-audiowide">Sign in</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2 font-exo">Welcome back — pick up where you left off.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5" noValidate>
          {/* Error Message */}
          {error && (
            <ErrorMessage
              message={error}
              detailedMessage={detailedError || undefined}
              onDismiss={() => {
                setError(null);
                setDetailedError(null);
              }}
            />
          )}

          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="Eg- youremail@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
              if (error) setError(null);
            }}
            error={fieldErrors.email}
            required
            aria-label="Email address"
          />
          <div>
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                if (error) setError(null);
              }}
              error={fieldErrors.password}
              rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-tertiary hover:text-text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
              }
              required
              aria-label="Password"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">*Must be at least 8 characters.*</p>
            {onForgotPassword && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-sm font-exo"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold text-text-inverse bg-primary rounded-lg transition-all duration-200 disabled:bg-text-tertiary disabled:cursor-not-allowed hover:enabled:bg-primary/90 transform hover:enabled:scale-105 font-exo flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
          </div>
        </form>

        <div className="flex items-center my-6 sm:my-8">
          <hr className="flex-grow border-t border-border" />
          <span className="px-4 text-xs sm:text-sm text-text-secondary">Or</span>
          <hr className="flex-grow border-t border-border" />
        </div>

        <div className="space-y-3">
            <SocialButton provider="Google" icon={<GoogleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Google clicked')} />
            <SocialButton provider="Facebook" icon={<FacebookIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Facebook clicked')} />
            <SocialButton provider="Apple" icon={<AppleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Apple clicked')} />
        </div>

          <div className="text-center mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-text-secondary font-exo">
                  New here?{' '}
                  <button onClick={onCreateAccount} className="font-bold text-text-primary underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-sm font-exo">
                      CREATE AN ACCOUNT
                  </button>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
