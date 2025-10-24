import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, error, rightIcon, className, ...props }) => {
  const hasError = !!error;
  
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={`w-full px-4 py-3.5 text-gray-900 bg-white border ${
            hasError ? 'border-red-500' : 'border-gray-300'
          } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 placeholder:text-gray-400 ${className || ''}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">*{error}*</p>}
    </div>
  );
};

export default Input;