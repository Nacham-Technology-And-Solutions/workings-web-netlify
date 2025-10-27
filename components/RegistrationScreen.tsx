import React, { useState, useMemo } from 'react';
import Input from './Input';
import { EyeIcon, EyeOffIcon } from './icons/IconComponents';

interface RegistrationScreenProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, onSwitchToLogin }) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear error on change after a failed submission attempt
    if(errors[id as keyof typeof errors]) {
        setErrors(prev => ({...prev, [id]: ''}));
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
    return (
      formData.name.trim() !== '' &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.company.trim() !== '' &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword
    );
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isCompanyValid = validateField('company', formData.company);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (isNameValid && isEmailValid && isCompanyValid && isPasswordValid && isConfirmPasswordValid) {
      onRegister();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white z-40 flex items-center justify-center font-exo p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-audiowide">Create an account</h1>
          <p className="text-gray-600 text-base sm:text-lg font-exo">Get started — create quotes and manage projects.</p>
        </div>
        
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
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
                disabled={!isFormValid}
                className="w-full py-4 text-lg font-semibold text-white bg-gray-900 rounded-xl transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed hover:enabled:bg-gray-800 hover:enabled:shadow-lg hover:enabled:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-900/20 font-exo"
              >
                Create Account
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
  );
};

export default RegistrationScreen;