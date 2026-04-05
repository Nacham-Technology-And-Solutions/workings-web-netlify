import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './src/app/App';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import * as serviceWorkerRegistration from './src/utils/serviceWorkerRegistration';
import './src/styles/index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const appTree = <App />;

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
      ) : (
        appTree
      )}
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
