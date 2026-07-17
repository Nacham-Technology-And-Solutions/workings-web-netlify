import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import * as Sentry from '@sentry/react';
import { Analytics } from '@vercel/analytics/react';
import App from './src/app/App';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { queryClient } from './src/lib/queryClient';
import * as serviceWorkerRegistration from './src/utils/serviceWorkerRegistration';
import './src/styles/index.css';
// Parse UTM tracking parameters from URL and store in sessionStorage
try {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  if (utmSource) sessionStorage.setItem('utm_source', utmSource);
  if (utmMedium) sessionStorage.setItem('utm_medium', utmMedium);
  if (utmCampaign) sessionStorage.setItem('utm_campaign', utmCampaign);
  
  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    sessionStorage.setItem('referrer', document.referrer);
  }
} catch (e) {
  console.error('Failed to parse UTM tracking parameters:', e);
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const appTree = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
      ) : (
        appTree
      )}
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // New service worker available, could prompt user to update
      console.log('New service worker available');
    },
    onSuccess: (registration) => {
      console.log('Service worker registered successfully');
    },
  });
} else {
  // Unregister service worker in development
  serviceWorkerRegistration.unregister();
}
