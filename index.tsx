import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';

// Polyfill Buffer and global for browser - MUST be before any other imports
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = { env: {} };
}

// Make Buffer available globally
(globalThis as any).Buffer = Buffer;
(globalThis as any).global = globalThis;

// Remove console logs in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error and console.warn for debugging
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  // Prevent default error handling (don't show in console)
  event.preventDefault();
  // You can show a toast notification here instead
});

// Global error handler for errors
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
  // Prevent default error handling
  event.preventDefault();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);