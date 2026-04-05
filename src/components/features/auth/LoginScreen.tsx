
import React, { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import Input from '@/components/common/Input';
import { EyeIcon, EyeOffIcon, GoogleIcon } from '@/assets/icons/IconComponents';
import { authService } from '@/services/api';
import { extractErrorMessage, extractFieldErrors, getValidationIssues } from '@/utils/errorHandler';
import { getFieldErrorsFromIssues, getValidationSummaryMessage, authPathToField } from '@/utils/validationErrors';
import ErrorMessage from '@/components/common/ErrorMessage';
import ValidationErrorAlert from '@/components/common/ValidationErrorAlert';
import { useAuthStore } from '@/stores';

interface LoginScreenProps {
  onLogin: () => void;
  onCreateAccount: () => void;
  onForgotPassword?: () => void;
  /** Called after Google OAuth succeeds; use for extra onboarding when `isNewUser` is true. */
  onOAuthComplete?: (info: { isNewUser: boolean }) => void;
}

const googleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onCreateAccount,
  onForgotPassword,
  onOAuthComplete,
}) => {
  const { login: loginStore } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [validationIssues, setValidationIssues] = useState<{ path: string; message: string }[]>([]);

  const applySession = (
    accessToken: string,
    refreshToken: string,
    userProfile: {
      id: number;
      name: string;
      email: string;
      companyName: string;
      subscriptionStatus: string;
      pointsBalance?: number;
    }
  ) => {
    loginStore(accessToken, refreshToken, {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      companyName: userProfile.companyName,
      subscriptionStatus: userProfile.subscriptionStatus as 'free' | 'pro' | 'starter' | 'enterprise',
      pointsBalance: userProfile.pointsBalance ?? 0,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

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
    setDetailedError(null);
    setFieldErrors({});
    setValidationIssues([]);

    try {
      const response = await authService.login({
        email,
        password,
      });

      if (response.response.accessToken && response.response) {
        const { accessToken, refreshToken, userProfile } = response.response;

        if (accessToken && refreshToken && userProfile) {
          applySession(accessToken, refreshToken, userProfile);
          onLogin();
          return;
        }
      }

      const errorMsg = response.message || 'Login failed. Please try again.';
      setError(errorMsg);
      const apiResponseData = (response as any)?.response || response;
      setDetailedError(apiResponseData?.message || apiResponseData?.error || null);
    } catch (err) {
      const issues = getValidationIssues(err);
      if (issues.length > 0) {
        setValidationIssues(issues);
        setFieldErrors(getFieldErrorsFromIssues(issues, { pathToField: authPathToField }));
        setError(getValidationSummaryMessage(issues));
        setDetailedError(undefined);
      } else {
        setValidationIssues([]);
        const errors = extractFieldErrors(err);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
        }
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage.message);
        setDetailedError(errorMessage.detailedMessage ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('Google did not return a credential. Please try again.');
      return;
    }

    setGoogleLoading(true);
    setError(null);
    setDetailedError(null);
    setValidationIssues([]);
    setFieldErrors({});

    try {
      const response = await authService.oauthWithGoogle(idToken);
      const payload = response.response;

      if (payload?.accessToken && payload?.refreshToken && payload?.userProfile) {
        applySession(payload.accessToken, payload.refreshToken, payload.userProfile);
        onOAuthComplete?.({ isNewUser: Boolean(payload.isNewUser) });
        onLogin();
        return;
      }

      setError(response.message || 'Google sign-in failed. Please try again.');
    } catch (err) {
      const issues = getValidationIssues(err);
      if (issues.length > 0) {
        setValidationIssues(issues);
        setFieldErrors(getFieldErrorsFromIssues(issues, { pathToField: authPathToField }));
        setError(getValidationSummaryMessage(issues));
        setDetailedError(undefined);
      } else {
        setValidationIssues([]);
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage.message);
        setDetailedError(errorMessage.detailedMessage ?? null);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-main z-40 font-exo overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto py-6 sm:py-8 lg:py-10">
        <div className="text-left mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary">Sign in</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2 font-exo">Welcome back — pick up where you left off.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5" noValidate>
          {validationIssues.length > 0 && (
            <ValidationErrorAlert
              issues={validationIssues}
              onDismiss={() => {
                setValidationIssues([]);
                setError(null);
                setFieldErrors({});
              }}
            />
          )}
          {error && validationIssues.length === 0 && (
            <ErrorMessage
              message={error}
              detailedMessage={detailedError && detailedError !== error ? detailedError : undefined}
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
                className="w-full py-3 sm:py-3.5 text-base font-semibold text-white bg-gray-900 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:enabled:bg-gray-800 font-exo flex items-center justify-center gap-2"
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

        {googleClientConfigured ? (
          <div
            className={`relative w-full min-h-[44px] ${googleLoading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <div className="flex w-full justify-center overflow-hidden rounded border border-border bg-white [&>div]:!w-full [&>div]:max-w-none">
              <GoogleLogin
                onSuccess={handleGoogleCredential}
                onError={() => {
                  setError('Google sign-in failed. Please try again or use email and password.');
                }}
                useOneTap={false}
                type="standard"
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width={400}
                containerProps={{ className: 'flex w-full justify-center' }}
              />
            </div>
            {googleLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-white/70">
                <svg className="h-8 w-8 animate-spin text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setError(
                'Add VITE_GOOGLE_CLIENT_ID to your environment to enable Google. You can still sign in with email or create an account below.'
              )
            }
            className="flex w-full items-center justify-center gap-3 rounded border border-border py-3 px-4 font-medium text-text-secondary transition-colors hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Continue with Google"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" aria-hidden />
            Continue with Google
          </button>
        )}

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
