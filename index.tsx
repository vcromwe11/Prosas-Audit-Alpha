import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { AnalysisProvider } from './contexts/AnalysisContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);