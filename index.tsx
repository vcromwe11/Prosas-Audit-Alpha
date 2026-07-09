import { ToastProvider } from "./src/contexts/ToastContext";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './index.css';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { Analytics } from "@vercel/analytics/react";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        
            <ToastProvider><App /></ToastProvider>
            <Analytics />
          
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);