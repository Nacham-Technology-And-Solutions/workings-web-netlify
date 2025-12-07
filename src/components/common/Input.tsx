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
      <label htmlFor={id} className="block text-sm font-semibold text-gray-800 mb-2 font-exo">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={`w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 ${
            hasError 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'
          } rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 placeholder:text-gray-500 hover:border-gray-300 font-exo ${className || ''}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center font-exo">
          <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
