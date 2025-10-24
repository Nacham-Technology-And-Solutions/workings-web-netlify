
import React, { useState } from 'react';
import Input from './Input';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon, AppleIcon } from './icons/IconComponents';

interface LoginScreenProps {
  onLogin: () => void;
  onCreateAccount: () => void;
}

const SocialButton: React.FC<{
  provider: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ provider, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
    aria-label={`Sign up with ${provider}`}
  >
    {icon}
    Sign up with {provider}
  </button>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation for demonstration
    if (email && password.length >= 8) {
      onLogin();
    } else {
        // Here you could set error states to show in the UI
        console.log("Invalid login credentials");
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-40 flex items-center justify-center font-sans p-4 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto py-8">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sign in</h1>
          <p className="text-gray-500 mt-2">Welcome back — pick up where you left off.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="Eg- youremail@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
              }
              required
              aria-label="Password"
            />
            <p className="mt-1 text-sm text-gray-500">*Must be at least 8 characters.*</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 text-lg font-semibold text-white bg-gray-800 rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:enabled:bg-gray-700 transform hover:enabled:scale-105"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="px-4 text-sm text-gray-500">Or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div className="space-y-3">
            <SocialButton provider="Google" icon={<GoogleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Google clicked')} />
            <SocialButton provider="Facebook" icon={<FacebookIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Facebook clicked')} />
            <SocialButton provider="Apple" icon={<AppleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Apple clicked')} />
        </div>

        <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
                New here?{' '}
                <button onClick={onCreateAccount} className="font-bold text-gray-800 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 rounded-sm">
                    CREATE AN ACCOUNT
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
