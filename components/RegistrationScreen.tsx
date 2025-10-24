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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
    if(id === 'password') setIsPasswordFocused(false);
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
    <div className="fixed inset-0 bg-white z-40 flex items-center justify-center font-sans p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto py-8">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create an account</h1>
          <p className="text-gray-500 mt-2">Get started — create quotes and manage projects.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="name"
            label="Your Name"
            placeholder="Eg- John Doe"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            required
            aria-label="Your Name"
          />
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="Eg- youremail@email.com"
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
            placeholder="Eg- [company-name]"
            value={formData.company}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.company}
            required
            aria-label="Company name"
          />
          <div>
            <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={handleBlur}
                error={errors.password}
                rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                }
                required
                aria-label="Password"
            />
             {isPasswordFocused && !errors.password && (
                 <div className="mt-2 text-xs text-gray-500 space-y-1 pl-1">
                    <p>• Use 8+ characters, including a number.</p>
                    <p>• Tip: use a short phrase you can remember.</p>
                 </div>
             )}
          </div>
          <Input
            id="confirmPassword"
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="********"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            rightIcon={
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-500 hover:text-gray-700" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            }
            required
            aria-label="Confirm password"
          />

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full py-4 text-lg font-semibold text-white bg-gray-800 rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:enabled:bg-gray-700 transform hover:enabled:scale-105"
            >
              Create Account
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-bold text-gray-800 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 rounded-sm">
                    SIGN IN
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationScreen;