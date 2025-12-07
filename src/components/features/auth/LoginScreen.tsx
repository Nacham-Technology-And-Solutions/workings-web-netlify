
import React, { useState } from 'react';
import Input from '@/components/common/Input';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon, AppleIcon } from '@/assets/icons/IconComponents';

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
    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-lg text-text-secondary font-medium hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
    <div className="fixed inset-0 bg-main z-40 font-exo overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm mx-auto py-8">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-audiowide">Sign in</h1>
          <p className="text-text-secondary mt-2 font-exo">Welcome back — pick up where you left off.</p>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-tertiary hover:text-text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
              }
              required
              aria-label="Password"
            />
            <p className="mt-1 text-sm text-text-secondary">*Must be at least 8 characters.*</p>
          </div>

          <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 text-lg font-semibold text-text-inverse bg-primary rounded-lg transition-all duration-200 disabled:bg-text-tertiary disabled:cursor-not-allowed hover:enabled:bg-primary/90 transform hover:enabled:scale-105 font-exo"
              >
                Sign In
              </button>
          </div>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-border" />
          <span className="px-4 text-sm text-text-secondary">Or</span>
          <hr className="flex-grow border-t border-border" />
        </div>

        <div className="space-y-3">
            <SocialButton provider="Google" icon={<GoogleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Google clicked')} />
            <SocialButton provider="Facebook" icon={<FacebookIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Facebook clicked')} />
            <SocialButton provider="Apple" icon={<AppleIcon className="h-5 w-5" />} onClick={() => console.log('Sign in with Apple clicked')} />
        </div>

          <div className="text-center mt-8">
              <p className="text-sm text-text-secondary font-exo">
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
