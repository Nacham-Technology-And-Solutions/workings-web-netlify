import React, { useState } from 'react';
import Input from '@/components/common/Input';
import { authService } from '@/services/api';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseMessage } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiResponse = await authService.forgotPassword({ email });
      const normalizedResponse = normalizeApiResponse(apiResponse);

      if (isApiResponseSuccess(apiResponse)) {
        setIsSuccess(true);
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        const errorMsg = getApiResponseMessage(apiResponse) || 'Failed to send reset email. Please try again.';
        setError(errorMsg);
        const apiResponseData = (apiResponse as any)?.response || apiResponse;
        setDetailedError(apiResponseData?.message || apiResponseData?.error || null);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage.message);
      setDetailedError(errorMessage.detailedMessage || null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white z-40 font-exo overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-md mx-auto py-8">
            {/* Success Message */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 font-audiowide">
                  Check Your Email
                </h1>
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Redirecting to login in a few seconds...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white z-40 font-exo overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md mx-auto py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-audiowide">
              Forgot Password?
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-exo">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-5">
                <ErrorMessage 
                  message={error} 
                  detailedMessage={detailedError || undefined}
                  onDismiss={() => {
                    setError(null);
                    setDetailedError(null);
                  }} 
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
                aria-label="Email address"
                autoFocus
              />

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full py-4 text-lg font-semibold text-white bg-gray-900 rounded-xl transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed hover:enabled:bg-gray-800 hover:enabled:shadow-lg hover:enabled:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-900/20 font-exo flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              onClick={onBack}
              className="text-gray-600 text-sm sm:text-base font-exo hover:text-gray-900 underline underline-offset-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 rounded-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;

