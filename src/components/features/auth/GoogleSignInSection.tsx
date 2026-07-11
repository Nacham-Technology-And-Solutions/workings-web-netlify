import React from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { GoogleIcon } from '@/assets/icons/IconComponents';

const googleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

interface GoogleSignInSectionProps {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: () => void;
  loading?: boolean;
  /** Shown when VITE_GOOGLE_CLIENT_ID is missing. */
  onNotConfigured?: () => void;
}

const GoogleSignInSection: React.FC<GoogleSignInSectionProps> = ({
  onSuccess,
  onError,
  loading = false,
  onNotConfigured,
}) => {
  if (!googleClientConfigured) {
    return (
      <button
        type="button"
        onClick={() =>
          onNotConfigured?.()
        }
        className="flex w-full items-center justify-center gap-3 rounded border border-border py-3 px-4 font-medium text-text-secondary transition-colors hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Continue with Google"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" aria-hidden />
        Continue with Google
      </button>
    );
  }

  return (
    <div className={`relative w-full min-h-[44px] ${loading ? 'pointer-events-none opacity-70' : ''}`}>
      <div className="flex w-full justify-center overflow-hidden rounded border border-border bg-white [&>div]:!w-full [&>div]:max-w-none">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-white/70">
          <svg
            className="h-8 w-8 animate-spin text-gray-700"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInSection;
