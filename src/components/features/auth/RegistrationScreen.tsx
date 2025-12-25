import React, { useState, useMemo } from 'react';
import Input from '@/components/common/Input';
import { EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';
import { authService } from '@/services/api';
import { extractErrorMessage, extractFieldErrors } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useAuthStore } from '@/stores';

interface RegistrationScreenProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, onSwitchToLogin }) => {
  const { login: loginStore } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear error on change after a failed submission attempt
    if(errors[id as keyof typeof errors]) {
        setErrors(prev => ({...prev, [id]: ''}));
    }
    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError(null);
    }
  };
  
  const validateField = (id: string, value: string): boolean => {
    let error = '';
    switch (id) {
        case 'name':
        case 'company':
            if (!value.trim()) error = 'This field is required.';
            break;
        case 'email':
            if (!value.trim()) {
                error = 'This field is required.';
            } else if (!/\S+@\S+\.\S+/.test(value)) {
                error = 'Please enter a valid email address.';
            }
            break;
        case 'password':
            if (!value) {
                error = 'This field is required.';
            } else if (value.length < 8) {
                error = 'Must be at least 8 characters.';
            } else if (!/[A-Z]/.test(value)) {
                error = 'Must contain at least one uppercase letter.';
            } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                error = 'Must contain at least one special character.';
            }
            break;
        case 'confirmPassword':
            if (!value) {
                error = 'This field is required.';
            } else if (value !== formData.password) {
                error = 'Passwords do not match.';
            }
            break;
        default:
            break;
    }
    setErrors(prev => ({...prev, [id]: error}));
    return !error;
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    validateField(id, value);
  };
  
  const isFormValid = useMemo(() => {
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    return (
      formData.name.trim() !== '' &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.company.trim() !== '' &&
      formData.password.length >= 8 &&
      hasUppercase &&
      hasSpecialChar &&
      formData.password === formData.confirmPassword
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isCompanyValid = validateField('company', formData.company);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (!isNameValid || !isEmailValid || !isCompanyValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);
    setGeneralError(null);
    // Clear all field errors
    setErrors({
      name: '',
      email: '',
      company: '',
      password: '',
      confirmPassword: '',
    });

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        companyName: formData.company,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      const normalizedResponse = normalizeApiResponse<{
        accessToken: string;
        refreshToken: string;
        userProfile: {
          id: number;
          name: string;
          email: string;
          companyName: string;
          subscriptionStatus: string;
          pointsBalance: number;
        };
      }>(response);
      
      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData<{
          accessToken: string;
          refreshToken: string;
          userProfile: {
            id: number;
            name: string;
            email: string;
            companyName: string;
            subscriptionStatus: string;
            pointsBalance: number;
          };
        }>(response);
        
        // Update auth store
        loginStore(
          responseData.accessToken,
          responseData.refreshToken,
          {
            id: responseData.userProfile.id,
            email: responseData.userProfile.email,
            name: responseData.userProfile.name,
            companyName: responseData.userProfile.companyName,
            subscriptionStatus: responseData.userProfile.subscriptionStatus as 'free' | 'pro' | 'starter' | 'enterprise',
            pointsBalance: responseData.userProfile.pointsBalance,
          }
        );

        // Call the onRegister callback to proceed with the flow
        onRegister();
      } else {
        // Extract error message - the response object contains error and responseMessage
        const apiResponseData = response as any;
        
        // Extract error using extractErrorMessage to handle ZodError and other formats
        // Create a mock AxiosError structure to use extractErrorMessage
        const mockError = {
          response: {
            status: 400,
            data: apiResponseData,
          }
        };
        
        try {
          const errorInfo = extractErrorMessage(mockError);
          setGeneralError(errorInfo.message);
          setDetailedError(errorInfo.detailedMessage || null);
        } catch (err) {
          // Fallback if extractErrorMessage fails - this should rarely happen
          console.error('Error extracting error message:', err);
          const errorField = apiResponseData?.error || normalizedResponse.message || 'Registration failed';
          setGeneralError(errorField === 'BAD REQUEST' 
            ? 'Invalid request. Please check your input.'
            : errorField);
          setDetailedError(null);
        }
      }
    } catch (error) {
      // Extract field-specific errors
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        // Set field-specific errors
        setErrors(prev => ({
          ...prev,
          ...fieldErrors,
        }));
      } else {
        // Set general error with detailed message
        const errorMessage = extractErrorMessage(error);
        setGeneralError(errorMessage.message);
        setDetailedError(errorMessage.detailedMessage || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white z-40 font-exo overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md mx-auto py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-audiowide">Create an account</h1>
          <p className="text-gray-600 text-base sm:text-lg font-exo">Get started — create quotes and manage projects.</p>
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
              id="name"
              label="Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              required
              aria-label="Name"
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
            />
            <Input
              id="company"
              label="Company name"
              placeholder="Enter your company name"
              value={formData.company}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.company}
              required
              aria-label="Company name"
            />
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors duration-200" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
              }
              required
              aria-label="Password"
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              rightIcon={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 transition-colors duration-200" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
              }
              required
              aria-label="Confirm password"
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
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm sm:text-base font-exo">
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin} 
              className="font-semibold text-gray-900 hover:text-gray-700 underline underline-offset-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 rounded-sm font-exo"
            >
              Sign in
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationScreen;
