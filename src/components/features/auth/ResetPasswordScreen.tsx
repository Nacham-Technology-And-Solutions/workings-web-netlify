import React, { useState, useMemo } from 'react';
import Input from '@/components/common/Input';
import { EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';
import { authService } from '@/services/api';
import { extractErrorMessage, extractFieldErrors } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseMessage } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  token?: string;
  email?: string;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onBack,
  onSuccess,
  token: initialToken,
  email: initialEmail,
}) => {
  const [formData, setFormData] = useState({
    token: initialToken || '',
    email: initialEmail || '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    token: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error on change
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const validateField = (id: string, value: string): boolean => {
    let error = '';
    switch (id) {
      case 'token':
        if (!value.trim()) error = 'Reset token is required.';
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Please enter a valid email address.';
        }
        break;
      case 'newPassword':
        if (!value) {
          error = 'Password is required.';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters.';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Password must contain at least one uppercase letter.';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
          error = 'Password must contain at least one special character.';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password.';
        } else if (value !== formData.newPassword) {
          error = 'Passwords do not match.';
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [id]: error }));
    return !error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    validateField(id, value);
  };

  const isFormValid = useMemo(() => {
    const hasUppercase = /[A-Z]/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword);
    return (
      formData.token.trim() !== '' &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.newPassword.length >= 8 &&
      hasUppercase &&
      hasSpecialChar &&
      formData.newPassword === formData.confirmPassword
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isTokenValid = validateField('token', formData.token);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('newPassword', formData.newPassword);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (!isTokenValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);
    setGeneralError(null);
    setErrors({
      token: '',
      email: '',
      newPassword: '',
      confirmPassword: '',
    });

    try {
      const response = await authService.resetPassword({
        token: formData.token,
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      const normalizedResponse = normalizeApiResponse(response);
      
      if (isApiResponseSuccess(response)) {
        setIsSuccess(true);
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        const errorMsg = getApiResponseMessage(response) || 'Failed to reset password. Please try again.';
        setGeneralError(errorMsg);
        const apiResponseData = (response as any)?.response || response;
        setDetailedError(apiResponseData?.message || apiResponseData?.error || null);
      }
    } catch (err) {
      // Extract field-specific errors
      const fieldErrors = extractFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...fieldErrors,
        }));
      } else {
        const errorMessage = extractErrorMessage(err);
        setGeneralError(errorMessage.message);
        setDetailedError(errorMessage.detailedMessage || null);
      }
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
                  Password Reset Successful
                </h1>
                <p className="text-gray-600 mb-4">
                  Your password has been reset successfully.
                </p>
                <p className="text-sm text-gray-500">
                  You can now sign in with your new password.
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
              Reset Password
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-exo">
              Enter your reset token and new password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            {/* General Error Message */}
            {generalError && (
              <div className="mb-5">
                <ErrorMessage 
                  message={generalError} 
                  detailedMessage={detailedError || undefined}
                  onDismiss={() => {
                    setGeneralError(null);
                    setDetailedError(null);
                  }} 
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                id="token"
                label="Reset Token"
                placeholder="Enter the token from your email"
                value={formData.token}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.token}
                required
                aria-label="Reset token"
                autoFocus={!initialToken}
              />

              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                required
                aria-label="Email address"
                disabled={!!initialEmail}
              />

              <Input
                id="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a new password"
                value={formData.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.newPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
                required
                aria-label="New password"
              />

              <Input
                id="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.confirmPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
                required
                aria-label="Confirm new password"
              />

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
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
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    'Reset Password'
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

export default ResetPasswordScreen;

